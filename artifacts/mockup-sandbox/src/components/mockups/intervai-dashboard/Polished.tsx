import { ArrowRight, AudioLines, BarChart3, BookOpen, ChevronRight, Clock3, FileText, LogOut, Mic2, Plus, Sparkles } from 'lucide-react';
import './_group.css';
import './Polished.css';

const recentInterviews = [
  { id: 'interview-1', type: 'Behavioral Interview', role: 'Product Designer', difficulty: 'Medium', score: 86, date: 'Oct 06' },
  { id: 'interview-2', type: 'Technical Interview', role: 'Frontend Engineer', difficulty: 'Hard', score: 78, date: 'Oct 03' },
  { id: 'interview-3', type: 'HR Interview', role: 'Product Designer', difficulty: 'Easy', score: 92, date: 'Sep 28' },
];

export function Polished() {
  const firstName = 'Jordan';
  const interviews = recentInterviews;
  const averageScore = Math.round(interviews.reduce((sum, interview) => sum + interview.score, 0) / interviews.length);
  const bestScore = Math.max(...interviews.map((interview) => interview.score));

  return (
    <div className="polished">
      <aside className="polished-sidebar">
        <div className="polished-brand">
          <span className="polished-mark"><AudioLines size={17} strokeWidth={2.2} /></span>
          <span>Interv<span className="polished-brand-accent">AI</span></span>
        </div>

        <div className="polished-nav-label">YOUR STUDIO</div>
        <nav className="polished-nav" aria-label="Main navigation">
          <a href="#overview" className="polished-nav-link is-active"><BarChart3 size={17} />Overview</a>
          <a href="#practice" className="polished-nav-link"><Plus size={17} />New practice</a>
          <a href="#recent-practice" className="polished-nav-link"><FileText size={17} />Interview history</a>
        </nav>

        <div className="polished-sidebar-bottom">
          <div className="polished-note">
            <Sparkles size={16} />
            <p>Every answer is a chance to get clearer.</p>
          </div>
          <div className="polished-profile">
            <div className="polished-avatar">J</div>
            <div className="polished-profile-copy"><b>Jordan Lee</b><span>jordan@example.com</span></div>
            <button className="polished-icon-button" type="button" aria-label="Sign out"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>

      <main className="polished-main" id="overview">
        <header className="polished-topbar">
          <div className="polished-breadcrumb">YOUR STUDIO <span>/</span> <b>OVERVIEW</b></div>
          <div className="polished-private"><i /> PRIVATE PRACTICE</div>
        </header>

        <div className="polished-content">
          <section className="polished-heading">
            <div>
              <div className="polished-eyebrow">YOUR PRACTICE, IN ONE PLACE</div>
              <h1>Good to have you here, {firstName}.</h1>
              <p>Each practice brings you one step closer to ready.</p>
            </div>
            <button className="polished-primary-button" type="button" id="practice">
              <Plus size={17} /> Start Mock Interview
            </button>
          </section>

          <section className="polished-welcome" aria-label="A note for your practice">
            <div className="polished-orbit polished-orbit-one" />
            <div className="polished-orbit polished-orbit-two" />
            <div className="polished-welcome-copy">
              <span className="polished-eyebrow">A MOMENT FOR YOU</span>
              <h2>The best way to feel ready<br />is to <em>show up before.</em></h2>
              <p>Take a breath. Pick a role. We’ll take it from there.</p>
            </div>
            <div className="polished-welcome-index"><span>STUDIO NOTE</span><b>01</b><i>—</i></div>
            <div className="polished-welcome-mark"><Mic2 size={20} /></div>
          </section>

          <section className="polished-stats" aria-label="Interview performance summary">
            <div className="polished-stat">
              <span className="polished-stat-label">TOTAL INTERVIEWS</span>
              <b>{interviews.length}</b>
              <small>practice sessions</small>
            </div>
            <div className="polished-stat">
              <span className="polished-stat-label">AVERAGE SCORE</span>
              <b>{averageScore}<small className="polished-score-unit">/100</small></b>
              <small>across all interviews</small>
            </div>
            <div className="polished-stat">
              <span className="polished-stat-label">BEST SCORE</span>
              <b>{bestScore}<small className="polished-score-unit">/100</small></b>
              <small>your personal best</small>
            </div>
            <div className="polished-summary">
              <span className="polished-stat-label">A NOTE ON YOUR PROGRESS</span>
              <p>You’re building strong interview confidence.</p>
            </div>
          </section>

          <section className="polished-recent" id="recent-practice">
            <div className="polished-section-heading">
              <div><h2>Recent practice</h2><p>Your latest sessions and how they went.</p></div>
              <a className="polished-text-link" href="#recent-practice">View all <ArrowRight size={15} /></a>
            </div>

            {interviews.length ? (
              <div className="polished-interview-list">
                <div className="polished-list-head" aria-hidden="true">
                  <span>SESSION</span><span>ROLE</span><span>DIFFICULTY</span><span>SCORE</span><span>DATE</span><span />
                </div>
                {interviews.map((interview, index) => (
                  <a href="#recent-practice" className="polished-interview-row" key={interview.id}>
                    <span className="polished-row-index">{String(index + 1).padStart(2, '0')}</span>
                    <span className="polished-interview-type">{interview.type}</span>
                    <span className="polished-interview-role">{interview.role}</span>
                    <span className={`polished-difficulty difficulty-${interview.difficulty.toLowerCase()}`}>{interview.difficulty}</span>
                    <span className="polished-interview-score">{interview.score}<small>/100</small></span>
                    <span className="polished-interview-date">{interview.date}</span>
                    <ChevronRight className="polished-row-chevron" size={17} />
                  </a>
                ))}
              </div>
            ) : (
              <div className="polished-empty">
                <div className="polished-empty-icon"><BookOpen size={20} /></div>
                <h3>Your first practice is waiting.</h3>
                <p>Start with one interview. You can revisit your feedback any time.</p>
                <button className="polished-secondary-button" type="button" id="empty-practice">
                  Start Mock Interview <ArrowRight size={15} />
                </button>
              </div>
            )}
            <div className="polished-footnote"><Clock3 size={15} /> Your practice history is private and saved to your account.</div>
          </section>
        </div>
      </main>
    </div>
  );
}
