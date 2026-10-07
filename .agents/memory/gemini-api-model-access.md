---
name: Gemini API model access
description: Diagnosing model availability mismatches between Gemini metadata and actual generateContent calls.
---

Treat a successful Gemini `models.get` or `models.list` response as insufficient proof that the current API key can generate with that model. Test the actual `generateContent` call and inspect a sanitized provider error.

**Why:** Model metadata can continue to advertise a generation method even when a model is unavailable to new users; the generation endpoint gives the actionable answer.

**How to apply:** When diagnosing Gemini 404s or access failures, test generation with the server-side key without printing it, then select a model that succeeds for that key.
