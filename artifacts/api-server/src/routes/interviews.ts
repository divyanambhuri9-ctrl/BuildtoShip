import { Router, type IRouter, type Request, type Response } from "express";
import {
  EvaluateInterviewBody,
  EvaluateInterviewResponse,
  GenerateInterviewQuestionsBody,
  GenerateInterviewQuestionsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const geminiEndpoint =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent";

type GeminiResponse = {
  candidates?: Array<{
    finishReason?: string;
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function redactApiKey(message: string, apiKey = process.env.GEMINI_API_KEY): string {
  return (apiKey ? message.replaceAll(apiKey, "[redacted]") : message).slice(0, 1000);
}

async function authenticateRequest(
  req: Request,
  res: Response,
): Promise<boolean> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const authorization = req.header("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!supabaseUrl || !publishableKey) {
    res.status(503).json({
      error: "Authentication is not configured for this app yet.",
    });
    return false;
  }

  if (!token) {
    res.status(401).json({ error: "Please sign in to continue." });
    return false;
  }

  try {
    const response = await fetch(
      `${supabaseUrl.replace(/\/+$/, "")}/auth/v1/user`,
      {
        headers: {
          apikey: publishableKey,
          authorization: `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok) {
      res.status(401).json({ error: "Your session has expired. Please sign in again." });
      return false;
    }

    const user: unknown = await response.json();
    if (!isObject(user) || typeof user.id !== "string") {
      res.status(401).json({ error: "Please sign in to continue." });
      return false;
    }
    return true;
  } catch {
    req.log.warn("Supabase session verification failed");
    res.status(503).json({
      error: "We couldn't verify your session. Check your connection and try again.",
    });
    return false;
  }
}

async function generateJson(
  req: Request,
  prompt: string,
): Promise<unknown | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("AI_NOT_CONFIGURED");
  }

  const response = await fetch(geminiEndpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    }),
    signal: AbortSignal.timeout(45000),
  });

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");
    let providerError: Record<string, unknown> | undefined;
    try {
      const payload: unknown = JSON.parse(responseText);
      if (isObject(payload) && isObject(payload.error)) {
        providerError = payload.error;
      }
    } catch {
      // Keep a concise sanitized response excerpt below for non-JSON errors.
    }
    const providerMessage =
      typeof providerError?.message === "string"
        ? providerError.message
        : responseText || `Gemini returned HTTP ${response.status} without an error message.`;
    req.log.error(
      {
        status: response.status,
        providerCode: typeof providerError?.code === "number" ? providerError.code : undefined,
        providerStatus: typeof providerError?.status === "string" ? providerError.status : undefined,
        providerMessage: redactApiKey(providerMessage, apiKey),
      },
      "Gemini request failed",
    );
    return null;
  }

  let rawPayload: unknown;
  try {
    rawPayload = await response.json();
  } catch (error) {
    req.log.warn(
      {
        status: response.status,
        errorType: error instanceof Error ? error.name : "unknown",
        errorMessage: redactApiKey(error instanceof Error ? error.message : "Invalid JSON response"),
      },
      "Gemini returned an invalid JSON response",
    );
    return null;
  }

  if (!isObject(rawPayload)) {
    req.log.warn("Gemini returned a response with an unexpected JSON shape");
    return null;
  }

  const payload = rawPayload as GeminiResponse;
  const candidate = payload.candidates?.[0];
  const parts = Array.isArray(candidate?.content?.parts)
    ? candidate.content.parts
    : [];
  const text = parts
    .map((part) =>
      isObject(part) && typeof part.text === "string" ? part.text : "",
    )
    .join("")
    .trim();

  if (!text) {
    req.log.warn(
      {
        finishReason: candidate?.finishReason,
        blockReason: payload.promptFeedback?.blockReason,
      },
      "Gemini returned no text candidate",
    );
    return null;
  }

  const withoutFence = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  try {
    return JSON.parse(withoutFence) as unknown;
  } catch (error) {
    req.log.warn(
      {
        errorType: error instanceof Error ? error.name : "unknown",
        responseLength: withoutFence.length,
      },
      "Gemini returned non-JSON text",
    );
    return null;
  }
}

router.post("/interviews/generate", async (req, res) => {
  if (!(await authenticateRequest(req, res))) return;

  const parsed = GenerateInterviewQuestionsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Check the interview details and try again." });
    return;
  }

  const { interviewType, role, difficulty, numberOfQuestions } = parsed.data;
  const prompt = [
    "Create interview questions for a realistic mock interview.",
    `Interview type: ${interviewType}.`,
    `Role: ${role}.`,
    `Difficulty: ${difficulty}.`,
    `Return exactly ${numberOfQuestions} distinct, open-ended questions.`,
    "Return only valid JSON in this exact shape: {\"questions\":[{\"question\":\"...\"}]}.",
    "Do not include markdown, an introduction, answers, or any keys beyond questions and question.",
  ].join("\n");

  try {
    const generated = await generateJson(req, prompt);
    if (!generated) {
      res.status(502).json({
        error: "The AI couldn't generate questions right now. Please try again.",
      });
      return;
    }

    const validated = GenerateInterviewQuestionsResponse.safeParse(generated);
    if (!validated.success) {
      req.log.warn(
        {
          issues: validated.error.issues.map((issue) => ({
            path: issue.path.join("."),
            code: issue.code,
          })),
        },
        "Gemini returned an invalid question set",
      );
      res.status(502).json({
        error: "The AI returned an incomplete question set. Please try again.",
      });
      return;
    }

    if (validated.data.questions.length !== numberOfQuestions) {
      req.log.warn(
        {
          expected: numberOfQuestions,
          received: validated.data.questions.length,
        },
        "Gemini returned the wrong number of questions",
      );
      res.status(502).json({
        error: "The AI returned an incomplete question set. Please try again.",
      });
      return;
    }

    res.json(validated.data);
  } catch (error) {
    const configured = error instanceof Error && error.message === "AI_NOT_CONFIGURED";
    if (configured) {
      res.status(503).json({ error: "AI feedback is not configured yet." });
      return;
    }
    req.log.warn(
      {
        errorType: error instanceof Error ? error.name : "unknown",
        errorMessage: redactApiKey(error instanceof Error ? error.message : "Unknown Gemini error"),
      },
      "Gemini request could not be completed",
    );
    res.status(502).json({
      error: "The AI couldn't complete this request. Please try again.",
    });
  }
});

router.post("/interviews/evaluate", async (req, res) => {
  if (!(await authenticateRequest(req, res))) return;

  const parsed = EvaluateInterviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Please answer every question before submitting your interview.",
    });
    return;
  }

  const { interviewType, role, difficulty, questions } = parsed.data;
  if (questions.some(({ answer }) => answer.trim().length === 0)) {
    res.status(400).json({
      error: "Please answer every question before submitting your interview.",
    });
    return;
  }

  const prompt = [
    "Evaluate this completed mock interview fairly and constructively.",
    `Interview type: ${interviewType}.`,
    `Role: ${role}.`,
    `Difficulty: ${difficulty}.`,
    "Evaluate each answer for correctness, relevance, clarity, technical understanding, and communication.",
    "Use an integer score from 0 to 100 for each question and for the overall interview.",
    "Return a short performanceLevel and concise strengths and improvements.",
    "Return only valid JSON matching this exact shape:",
    '{"overallScore":82,"performanceLevel":"Good","strengths":["..."],"improvements":["..."],"questions":[{"question":"...","answer":"...","score":80,"feedback":"..."}]}',
    "Include one result for every input question, in the original order, keeping each question and answer exactly as provided.",
    `Completed interview: ${JSON.stringify(questions)}`,
  ].join("\n");

  try {
    const generated = await generateJson(req, prompt);
    if (!generated) {
      res.status(502).json({
        error: "The AI couldn't evaluate this interview right now. Please try again.",
      });
      return;
    }

    const validated = EvaluateInterviewResponse.safeParse(generated);
    if (
      !validated.success ||
      validated.data.questions.length !== questions.length ||
      validated.data.questions.some(
        (result, index) =>
          result.question !== questions[index]?.question ||
          result.answer !== questions[index]?.answer,
      )
    ) {
      req.log.warn("Gemini returned an invalid interview evaluation");
      res.status(502).json({
        error: "The AI returned an incomplete evaluation. Please try again.",
      });
      return;
    }

    res.json(validated.data);
  } catch (error) {
    const configured = error instanceof Error && error.message === "AI_NOT_CONFIGURED";
    if (configured) {
      res.status(503).json({ error: "AI feedback is not configured yet." });
      return;
    }
    req.log.warn(
      { errorType: error instanceof Error ? error.name : "unknown" },
      "Gemini evaluation could not be completed",
    );
    res.status(502).json({
      error: "The AI couldn't evaluate this interview right now. Please try again.",
    });
  }
});

export default router;
