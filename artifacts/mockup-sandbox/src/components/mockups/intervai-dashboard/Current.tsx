import { ArrowRight, AudioLines, BarChart3, BookOpen, ChevronRight, Clock3, FileText, LogOut, Plus, Sparkles } from 'lucide-react';
import './_group.css';

const recentInterviews = [
  { id: 'interview-1', type: 'Behavioral Interview', role: 'Product Designer', difficulty: 'Medium', score: 86, date: 'Oct 06' },
  { id: 'interview-2', type: 'Technical Interview', role: 'Frontend Engineer', difficulty: 'Hard', score: 78, date: 'Oct 03' },
  { id: 'interview-3', type: 'HR Interview', role: 'Product Designer', difficulty: 'Easy', score: 92, date: 'Sep 28' },
];

export function Current() {
  return (
    <div className="current-preview">
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <a href="#" className="wordmark"><span className="mark"><AudioLines size={17} /></span><span>Interv<span className="word-accent">AI</span></span></a>
          </div>
          <div className="sidebar-label">YOUR STUDIO</div>
          <nav className="side-nav" aria-label="Main navigation">
            <a href="#" className="side-link side-active"><BarChart3 size={17} />Overview</a>
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
            <div className="breadcrumb">YOUR STUDIO <span>/</span> <b>OVERVIEW</b></div>
            <div className="session-status"><i /> PRIVATE PRACTICE</div>
          </header>
          <div className="page-content">
            <div className="page-heading">
              <div>
                <div className="eyebrow">YOUR PRACTICE, IN ONE PLACE</div>
                <h1>Good to have you here, Jordan.</h1>
                <p>Each practice brings you one step closer to ready.</p>
              </div>
              <a href="#" className="button"><Plus size={16} />Start a practice</a>
            </div>
            <section className="welcome-band">
              <div className="welcome-orbit" />
              <div className="welcome-text">
                <span className="eyebrow">A MOMENT FOR YOU</span>
                <h2>The best way to feel ready<br />is to <em>show up before.</em></h2>
                <p>Take a breath. Pick a role. We’ll take it from there.</p>
              </div>
              <div className="welcome-index"><span>STUDIO NOTE</span><b>01</b><i>—</i></div>
            </section>
            <section className="history-summary" aria-label="Interview performance summary">
              <div><span className="stat-label">TOTAL INTERVIEWS</span><b>12</b></div>
              <div><span className="stat-label">AVERAGE SCORE</span><b>84</b></div>
              <div><span className="stat-label">BEST SCORE</span><b>96</b></div>
              <div className="summary-aside"><span>PERFORMANCE SUMMARY</span><p>You’re building strong interview confidence.</p></div>
            </section>
            <div className="section-head">
              <div><h2>Recent practice</h2><p>Your latest sessions and how they went.</p></div>
              <a href="#" className="text-link">View all <ArrowRight size={15} /></a>
            </div>
            <div className="recent-list">
              {recentInterviews.map((row, index) => (
                <a href="#" key={row.id} className="recent-row">
                  <span className="recent-number">{String(index + 1).padStart(2, '0')}</span>
                  <div className="recent-info"><b>{row.role}</b><span>{row.type} <i>·</i> {row.difficulty}</span></div>
                  <span className="recent-date">{row.date}</span>
                  <span className="recent-score">{row.score}<small>SCORE</small></span>
                  <ChevronRight className="recent-chevron" size={17} />
                </a>
              ))}
            </div>
            <div className="section-head"><div className="text-link"><Clock3 size={15} /> Your practice history is private and saved to your account.</div><BookOpen size={15} /></div>
          </div>
        </main>
      </div>
    </div>
  );
}
