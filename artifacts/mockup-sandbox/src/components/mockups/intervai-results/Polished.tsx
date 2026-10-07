import {
  ArrowRight,
  AudioLines,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  FileText,
  Gauge,
  Plus,
  Sparkles,
  Target,
  Check,
} from 'lucide-react';
import './_group.css';
import './Polished.css';

const questions = [
  {
    question: 'Tell me about a product decision you made using user research.',
    answer:
      'I started by clarifying the user groups and friction points. I proposed short guided flows, then used five moderated sessions to test whether the navigation matched how people actually described their tasks.',
    feedback:
      'You connected the research to a concrete product decision. Adding one specific outcome would make the impact easier to evaluate.',
    score: 78,
  },
  {
    question: 'How do you handle disagreement with a cross-functional partner?',
    answer:
      'I try to make the underlying concern visible first. In one project, an engineer and I disagreed about a loading state, so I brought together the constraints and we tested a smaller version before committing.',
    feedback:
      'The example shows collaboration and a practical way to move forward. You could make your own role in the resolution more explicit.',
    score: 84,
  },
  {
    question: 'What would you do differently on your most recent project?',
    answer:
      'I would bring support and operations into discovery earlier. We caught a few edge cases late, and involving them sooner would have helped us plan a more complete experience.',
    feedback:
      'A thoughtful reflection. Consider naming the specific signal that would tell you to involve them next time.',
    score: 73,
  },
];

const overallScore = 82;
const scoreCircumference = 2 * Math.PI * 46;

export function Polished() {
  return (
    <div className="current-preview results-polished-preview">
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <a href="/dashboard" className="wordmark" aria-label="IntervAI dashboard">
              <span className="mark"><AudioLines size={17} /></span>
              <span>Interv<span className="word-accent">AI</span></span>
            </a>
          </div>
          <div className="sidebar-label">YOUR STUDIO</div>
          <nav className="side-nav" aria-label="Main navigation">
            <a href="/dashboard" className="side-link"><BarChart3 size={17} />Overview</a>
            <a href="/interview/setup" className="side-link"><Plus size={17} />New practice</a>
            <a href="#questions" className="side-link side-active"><FileText size={17} />Interview history</a>
          </nav>
          <div className="sidebar-bottom">
            <div className="sidebar-tip"><Sparkles size={16} /><p>Every answer is a chance to get clearer.</p></div>
            <div className="profile-row">
              <div className="avatar-initial">J</div>
              <div className="profile-meta"><b>Jordan Lee</b><span>jordan@example.com</span></div>
            </div>
          </div>
        </aside>

        <main className="main-panel">
          <header className="topbar">
            <div className="breadcrumb">YOUR STUDIO <span>/</span> <b>RESULTS</b></div>
            <div className="session-status"><i /> PRIVATE PRACTICE</div>
          </header>

          <div className="page-content">
            <div className="results-page">
              <div className="results-toolbar">
                <a href="/dashboard" className="results-back"><ChevronLeft size={16} />Back to Dashboard</a>
                <span className="results-date"><CalendarDays size={14} />October 07, 2026</span>
              </div>

              <section className="results-hero" aria-labelledby="results-title">
                <div className="results-hero-copy">
                  <div className="results-eyebrow">PRACTICE REVIEW <span>·</span> SESSION COMPLETE</div>
                  <h1 id="results-title">That was a <em>good step.</em></h1>
                  <p>A thoughtful practice session. Here’s what’s already working — and what to build on.</p>
                </div>
                <div className="results-score" aria-label={`Overall score: ${overallScore} out of 100`}>
                  <div className="score-ring">
                    <svg viewBox="0 0 112 112" role="img" aria-hidden="true">
                      <circle className="score-ring-track" cx="56" cy="56" r="46" />
                      <circle
                        className="score-ring-value"
                        cx="56"
                        cy="56"
                        r="46"
                        strokeDasharray={scoreCircumference}
                        strokeDashoffset={scoreCircumference * (1 - overallScore / 100)}
                      />
                    </svg>
                    <div className="score-ring-number">{overallScore}<span>/100</span></div>
                  </div>
                  <span className="score-caption">OVERALL SCORE</span>
                  <span className="score-level">Strong performance</span>
                </div>
                <div className="results-meta" aria-label="Interview details">
                  <div className="meta-item"><span><FileText size={14} /></span><div><small>INTERVIEW TYPE</small><b>Behavioral Interview</b></div></div>
                  <div className="meta-item"><span><BriefcaseBusiness size={14} /></span><div><small>ROLE</small><b>Product Designer</b></div></div>
                  <div className="meta-item"><span><Gauge size={14} /></span><div><small>DIFFICULTY</small><b>Medium</b></div></div>
                  <div className="meta-item"><span><CalendarDays size={14} /></span><div><small>DATE</small><b>October 07, 2026</b></div></div>
                </div>
              </section>

              <section className="feedback-columns" aria-label="Interview summary">
                <article className="feedback-panel strengths">
                  <div className="feedback-title">
                    <span className="feedback-icon"><Check size={16} /></span>
                    <div><h2>Strengths</h2><p>Keep bringing these strengths into the room.</p></div>
                  </div>
                  <ul>
                    <li><span>+</span><p>You grounded your examples in real user needs.</p></li>
                    <li><span>+</span><p>Your answers showed calm, thoughtful collaboration.</p></li>
                  </ul>
                </article>
                <article className="feedback-panel improvements">
                  <div className="feedback-title">
                    <span className="feedback-icon"><Target size={16} /></span>
                    <div><h2>Areas to Improve</h2><p>Small shifts can make a strong answer clearer.</p></div>
                  </div>
                  <ul>
                    <li><span>↗</span><p>Add a clear result or metric to show the impact of your work.</p></li>
                  </ul>
                </article>
              </section>

              <section className="questions-section" id="questions" aria-labelledby="questions-title">
                <div className="questions-heading">
                  <div><span className="results-eyebrow">SESSION BREAKDOWN</span><h2 id="questions-title">Question by question</h2><p>Revisit your answers with the feedback beside them.</p></div>
                  <span className="question-count">03 QUESTIONS</span>
                </div>
                <div className="question-list">
                  {questions.map((item, index) => (
                    <details className="question-entry" key={item.question} open={index === 0}>
                      <summary>
                        <span className="question-index">{String(index + 1).padStart(2, '0')}</span>
                        <span className="question-summary-copy">
                          <small>QUESTION {String(index + 1).padStart(2, '0')}</small>
                          <b>{item.question}</b>
                        </span>
                        <span className="question-score">{item.score}<small>/100</small></span>
                        <ChevronDown className="question-chevron" size={17} />
                      </summary>
                      <div className="question-detail">
                        <div className="answer-block">
                          <span className="detail-label">YOUR SAVED ANSWER</span>
                          <p>{item.answer}</p>
                        </div>
                        <div className="ai-feedback">
                          <span className="detail-label"><Sparkles size={12} /> AI FEEDBACK</span>
                          <p>{item.feedback}</p>
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </section>

              <footer className="results-footer">
                <p><span className="footer-dot" />Practice makes progress. Keep the good work.</p>
                <a href="/interview/setup" className="practice-again">Practice Again<ArrowRight size={16} /></a>
              </footer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
