import {
  ArrowRight,
  AudioLines,
  BarChart3,
  Check,
  ChevronLeft,
  FileText,
  LogOut,
  Plus,
  Sparkles,
  Target,
} from 'lucide-react';
import './_group.css';
import './Current.css';

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

export function Current() {
  return (
    <div className="current-preview current-results-preview">
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <a href="#" className="wordmark" aria-label="IntervAI">
              <span className="mark"><AudioLines size={17} /></span>
              <span>Interv<span className="word-accent">AI</span></span>
            </a>
          </div>
          <div className="sidebar-label">YOUR STUDIO</div>
          <nav className="side-nav" aria-label="Main navigation">
            <a href="#" className="side-link"><BarChart3 size={17} />Overview</a>
            <a href="#" className="side-link"><Plus size={17} />New practice</a>
            <a href="#" className="side-link"><FileText size={17} />Interview history</a>
          </nav>
          <div className="sidebar-bottom">
            <div className="sidebar-tip"><Sparkles size={16} /><p>Every answer is a chance to get clearer.</p></div>
            <div className="profile-row">
              <div className="avatar-initial">J</div>
              <div className="profile-meta"><b>Jordan Lee</b><span>jordan@example.com</span></div>
              <button type="button" aria-label="Sign out"><LogOut size={16} /></button>
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
              <div className="result-toolbar">
                <a href="#" className="back-link"><ChevronLeft size={16} /> Practice history</a>
                <span className="eyebrow">October 07, 2026</span>
              </div>
              <section className="result-hero">
                <div className="result-intro">
                  <div className="eyebrow">PRACTICE REVIEW <span>/</span> BEHAVIORAL INTERVIEW</div>
                  <h1>That was a<br /><em>good step.</em></h1>
                  <p>Product Designer <span>·</span> Medium practice</p>
                </div>
                <div className="result-score-block">
                  <div className="result-score">82<span>/100</span></div>
                  <div className="score-label">OVERALL SCORE</div>
                  <span className="result-level">Strong performance</span>
                </div>
              </section>
              <div className="feedback-columns">
                <section className="feedback-panel strengths">
                  <div className="feedback-title">
                    <span className="feedback-icon"><Check size={16} /></span>
                    <div><h2>What came through</h2><p>Keep bringing these strengths into the room.</p></div>
                  </div>
                  <ul>
                    <li><span>+</span> You grounded your examples in real user needs.</li>
                    <li><span>+</span> Your answers showed calm, thoughtful collaboration.</li>
                  </ul>
                </section>
                <section className="feedback-panel improvements">
                  <div className="feedback-title">
                    <span className="feedback-icon"><Target size={16} /></span>
                    <div><h2>One thing to sharpen</h2><p>Small shifts can make a strong answer clearer.</p></div>
                  </div>
                  <ul>
                    <li><span>↗</span> Add a clear result or metric to show the impact of your work.</li>
                  </ul>
                </section>
              </div>
              <div className="section-head result-questions-head">
                <div><h2>Question by question</h2><p>Review what you said and the feedback that followed.</p></div>
                <span className="count-pill">3 QUESTIONS</span>
              </div>
              <div className="result-question-list">
                {questions.map((question, index) => (
                  <article className="result-question" key={question.question}>
                    <div className="rq-head">
                      <span>QUESTION {String(index + 1).padStart(2, '0')}</span>
                      <span className="rq-score">{question.score}<small>/100</small></span>
                    </div>
                    <h3>{question.question}</h3>
                    <div className="rq-answer">
                      <span>YOUR ANSWER</span><p>{question.answer}</p>
                    </div>
                    <div className="rq-feedback">
                      <span>FEEDBACK</span><p>{question.feedback}</p>
                    </div>
                  </article>
                ))}
              </div>
              <div className="results-end">
                <span>Practice makes progress. Keep the good work.</span>
                <a href="#" className="button button-primary">Practice again <ArrowRight size={15} /></a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
