import { createContext, useContext, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import {
  ArrowLeft, ArrowRight, AudioLines, BarChart3, BookOpen, Check, ChevronLeft, ChevronRight,
  CircleHelp, Clock3, FileText, LogOut, Menu, Mic2, Plus, Sparkles, Target, X
} from 'lucide-react';
import { useEvaluateInterview, useGenerateInterviewQuestions } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const supabase: SupabaseClient | null = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
type InterviewType = 'Technical Interview' | 'HR Interview' | 'Behavioral Interview' | 'General Interview';
type Difficulty = 'Easy' | 'Medium' | 'Hard';
type Setup = { interviewType: InterviewType; role: string; difficulty: Difficulty; numberOfQuestions: 5 | 10 };
type InterviewRow = { id: string; interview_type: string; role: string; difficulty: string; score: number | null; strengths: string[] | null; improvements: string[] | null; created_at: string };
type Question = { question: string; answer: string; score?: number; feedback?: string };
type Evaluation = { overallScore: number; performanceLevel: string; strengths: string[]; improvements: string[]; questions: Question[] };
type SessionContextValue = { session: Session | null; profile: { id: string; full_name: string; email: string } | null; setProfile: (v: SessionContextValue['profile']) => void; loading: boolean; };
const SessionContext = createContext<SessionContextValue | null>(null);

function friendlyDatabaseError(message: string, fallback: string) {
  if (/schema cache|relation .* does not exist|could not find the table/i.test(message)) {
    return 'Supabase tables are not set up yet. Run supabase/schema.sql in your Supabase SQL Editor, then try again.';
  }
  if (/row-level security|permission denied|violates row-level/i.test(message)) {
    return 'Supabase access rules need setup. Run supabase/schema.sql in your Supabase SQL Editor, then try again.';
  }
  return fallback;
}

function clearInterviewSessionState() {
  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const key = sessionStorage.key(i);
    if (key?.startsWith('intervai-')) sessionStorage.removeItem(key);
  }
}

function useAuth() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('Auth context unavailable');
  return value;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<SessionContextValue['profile']>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let mounted = true;
    let knownUserId: string | null = null;
    let hasInitialSession = false;
    const applySession = (next: Session | null) => {
      const nextUserId = next?.user.id ?? null;
      if (hasInitialSession && nextUserId !== knownUserId) clearInterviewSessionState();
      hasInitialSession = true;
      knownUserId = nextUserId;
      setSession(next);
    };
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => applySession(next));
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      applySession(data.session);
      setLoading(false);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    if (!session?.user || !supabase) { setProfile(null); return; }
    let active = true;
    const user = session.user;
    setProfile(null);
    supabase.from('profiles').select('id,full_name,email').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (active) setProfile(data ?? { id: user.id, full_name: user.user_metadata?.full_name ?? '', email: user.email ?? '' });
    });
    return () => { active = false; };
  }, [session]);
  const value = useMemo(() => ({ session, profile, setProfile, loading }), [session, profile, loading]);
  return <QueryClientProvider client={queryClient}><TooltipProvider><SessionContext.Provider value={value}>
    <WouterRouter><Router /></WouterRouter><Toaster />
  </SessionContext.Provider></TooltipProvider></QueryClientProvider>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch>
    <Route path="/" component={Landing} />
    <Route path="/login" component={AuthPage} />
    <Route path="/signup" component={AuthPage} />
    <Route path="/dashboard" component={Dashboard} />
    <Route path="/interview/setup" component={SetupPage} />
    <Route path="/interview/session" component={SessionPage} />
    <Route path="/interview/results/:id" component={ResultsPage} />
    <Route path="/history" component={HistoryPage} />
    <Route component={NotFound} />
  </Switch></ErrorBoundary>;
}

function ConfigNotice() {
  return !supabase ? <div className="config-notice" data-testid="status-supabase-config"><CircleHelp size={16} /> Supabase isn’t configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to enable accounts and saved interviews.</div> : null;
}

function Wordmark({ small = false }: { small?: boolean }) {
  return <Link href="/" className={`wordmark ${small ? 'wordmark-small' : ''}`} data-testid="link-home"><span className="mark"><AudioLines size={19} /></span><span>Interv<span className="word-accent">AI</span></span></Link>;
}

function Landing() {
  return <main className="landing">
    <header className="landing-nav"><Wordmark /><nav><Link href="/login" className="nav-text" data-testid="link-login">Log in</Link><Link href="/signup" className="button button-primary button-small" data-testid="link-get-started">Start practicing <ArrowRight size={15}/></Link></nav></header>
    <ConfigNotice />
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow"><span className="live-dot" /> PRACTICE SMARTER. INTERVIEW BETTER.</div>
        <h1>Show up ready<br/>for <span>what’s next.</span></h1>
        <p>Rehearse the hard questions in a space built for focus. Get thoughtful feedback, find your edge, and walk in knowing you’ve done the work.</p>
        <div className="hero-actions"><Link href="/signup" className="button button-primary" data-testid="button-start-practice">Start Mock Interview <ArrowRight size={16}/></Link><span className="hero-note"><span className="note-rule"/> No pressure. Just practice.</span></div>
        <div className="hero-proof"><div className="avatar-stack"><i>J</i><i>M</i><i>A</i></div><span>Made for the moment<br/>before the big moment.</span></div>
      </div>
      <div className="studio-visual" aria-label="Interview practice preview">
        <div className="visual-orbit orbit-one"/><div className="visual-orbit orbit-two"/>
        <div className="visual-label"><span className="live-dot"/> PRACTICE SESSION <span>01 / 05</span></div>
        <div className="visual-card">
          <span className="visual-kicker">QUESTION 01</span>
          <h2>Tell me about a time you had to solve a difficult problem.</h2>
          <div className="visual-wave"><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/><span/></div>
          <div className="visual-card-foot"><span><span className="record-dot"/> YOUR ANSWER</span><span>01:24</span></div>
        </div>
        <div className="floating-score"><span className="score-ring">82</span><div><b>Strong start</b><small>Specificity · +12%</small></div><Check size={17}/></div>
        <div className="visual-caption"><span className="caption-mark">/</span> A little more practice<br/>changes everything.</div>
      </div>
      <div className="hero-bottom"><span>YOUR NEXT CHAPTER STARTS HERE</span><span className="bottom-line"/><span>01 — 03</span></div>
    </section>
    <section className="landing-story">
      <div className="story-heading"><div className="eyebrow">PRACTICE WITH PURPOSE</div><h2>Not another interview.<br/><span>A place to get better at them.</span></h2></div>
      <div className="story-grid">
        <article className="story-step"><span className="step-num">01</span><div className="step-icon"><Target size={20}/></div><h3>Make it yours</h3><p>Choose a role, an interview style, and a level that meets you where you are.</p></article>
        <article className="story-step"><span className="step-num">02</span><div className="step-icon"><Mic2 size={20}/></div><h3>Find your words</h3><p>Answer generated questions at your own pace. Your responses stay with you as you go.</p></article>
        <article className="story-step"><span className="step-num">03</span><div className="step-icon"><BarChart3 size={20}/></div><h3>Leave sharper</h3><p>Get practical, question-by-question feedback you can take into the real room.</p></article>
      </div>
      <div className="story-cta"><span>Confidence isn’t a trait. It’s a practice.</span><Link href="/signup" className="text-link" data-testid="link-create-account">Create your free account <ArrowRight size={16}/></Link></div>
    </section>
    <footer className="landing-footer"><Wordmark small/><span>Practice for the moment that matters.</span><span>© 2026 IntervAI</span></footer>
  </main>;
}

function AuthPage() {
  const [location, setLocation] = useLocation();
  const signup = location === '/signup';
  const { session, loading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => { if (!loading && session) setLocation('/dashboard'); }, [loading, session, setLocation]);
  async function submit(e: FormEvent) {
    e.preventDefault(); setError(''); setSuccess('');
    if (!supabase) { setError('Add your Supabase project keys to enable authentication.'); return; }
    setBusy(true);
    try {
      if (signup) {
        const { data, error: authError } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/` } });
        if (authError) throw authError;
        setSuccess(data.session ? 'Your account is ready. Taking you to your studio…' : 'Check your email to confirm your account.');
        if (data.session) setLocation('/dashboard');
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        setLocation('/dashboard');
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.'); }
    finally { setBusy(false); }
  }
  return <main className="auth-layout"><aside className="auth-aside"><Wordmark/><div className="auth-aside-copy"><div className="eyebrow">THE PRACTICE STUDIO</div><h1>Make room<br/>to get <span>ready.</span></h1><p>Good interviews aren’t luck. They’re the result of showing up for yourself beforehand.</p><div className="auth-aside-note"><span className="note-rule"/> A quiet place to practice out loud.</div></div><div className="auth-aside-foot">INTERVAI / YOUR NEXT CHAPTER</div></aside>
    <section className="auth-main"><div className="auth-top"><span>{signup ? 'New to the studio?' : 'Already have an account?'}</span><button className="button button-quiet button-small" onClick={() => { setLocation(signup ? '/login' : '/signup'); setError(''); }} data-testid="button-switch-auth">{signup ? 'Log in' : 'Create account'} <ArrowRight size={14}/></button></div>
      <div className="auth-form-wrap"><div className="eyebrow">{signup ? 'YOUR PRACTICE STARTS HERE' : 'WELCOME BACK'}</div><h2>{signup ? 'Create your account' : 'Step back in.'}</h2><p className="auth-lede">{signup ? 'A focused space to get ready for what comes next.' : 'Your next answer is one practice away.'}</p><ConfigNotice/>
        <form onSubmit={submit} className="form-stack">
          {signup && <label className="field-label">Full name<input value={name} onChange={e => setName(e.target.value)} placeholder="How should we address you?" required autoComplete="name" data-testid="input-full-name"/></label>}
          <label className="field-label">Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" data-testid="input-email"/></label>
          <label className="field-label">Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} required autoComplete={signup ? 'new-password' : 'current-password'} data-testid="input-password"/></label>
          {error && <div className="alert alert-error" data-testid="status-auth-error">{error}</div>}{success && <div className="alert alert-success" data-testid="status-auth-success">{success}</div>}
          <button disabled={busy} className="button button-primary button-wide" type="submit" data-testid="button-auth-submit">{busy ? 'One moment…' : signup ? 'Create account' : 'Log in'} {!busy && <ArrowRight size={16}/>}</button>
        </form><div className="auth-terms">By continuing, you agree to use IntervAI as a practice tool. Your interview answers are saved privately to your account.</div></div>
    </section>
  </main>;
}

function Shell({ children, active }: { children: ReactNode; active: string }) {
  const { profile } = useAuth();
  const [, setLocation] = useLocation();
  const [menu, setMenu] = useState(false);
  async function signOut() { clearInterviewSessionState(); if (supabase) await supabase.auth.signOut(); setLocation('/'); }
  return <div className="app-shell">
    <aside className={`sidebar ${menu ? 'sidebar-open' : ''}`}><div className="sidebar-brand"><Wordmark small/><button className="icon-button mobile-close" onClick={() => setMenu(false)} aria-label="Close menu" data-testid="button-close-menu"><X size={17}/></button></div>
      <div className="sidebar-label">YOUR STUDIO</div><nav className="side-nav">
        <Link href="/dashboard" onClick={() => setMenu(false)} className={`side-link ${active === 'dashboard' ? 'side-active' : ''}`} data-testid="link-dashboard"><BarChart3 size={17}/>Overview</Link>
        <Link href="/interview/setup" onClick={() => setMenu(false)} className={`side-link ${active === 'practice' ? 'side-active' : ''}`} data-testid="link-new-practice"><Plus size={17}/>New practice</Link>
        <Link href="/history" onClick={() => setMenu(false)} className={`side-link ${active === 'history' ? 'side-active' : ''}`} data-testid="link-history"><FileText size={17}/>Interview history</Link>
      </nav>
      <div className="sidebar-bottom"><div className="sidebar-tip"><Sparkles size={16}/><p>Every answer is a chance to get clearer.</p></div><div className="profile-row"><div className="avatar-initial">{(profile?.full_name || profile?.email || 'Y').slice(0,1).toUpperCase()}</div><div className="profile-meta"><b data-testid="text-profile-name">{profile?.full_name || 'Your studio'}</b><span>{profile?.email || 'Practice space'}</span></div><button className="icon-button" onClick={signOut} title="Sign out" data-testid="button-sign-out"><LogOut size={16}/></button></div></div>
    </aside>
    {menu && <button className="mobile-scrim" onClick={() => setMenu(false)} aria-label="Close navigation"/>}
    <main className="main-panel"><header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMenu(true)} aria-label="Open menu" data-testid="button-open-menu"><Menu size={19}/></button><div className="breadcrumb">YOUR STUDIO <span>/</span> <b>{active === 'dashboard' ? 'OVERVIEW' : active === 'practice' ? 'NEW PRACTICE' : active === 'history' ? 'HISTORY' : 'RESULTS'}</b></div><div className="topbar-right"><span className="session-status"><i/> PRIVATE PRACTICE</span></div></header><div className="page-content"><ConfigNotice/>{children}</div></main>
  </div>;
}

function Protected({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => { if (!loading && !session) setLocation('/login'); }, [loading, session, setLocation]);
  if (loading || !session) return <div className="loading-screen"><div className="skeleton skeleton-logo"/><div className="skeleton skeleton-block"/></div>;
  return <>{children}</>;
}

function Dashboard() {
  const { profile, session } = useAuth();
  const [rows, setRows] = useState<InterviewRow[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    if (!supabase || !session?.user) { setBusy(false); return; }
    setBusy(true);
    setError('');
    supabase.from('interviews').select('id,interview_type,role,difficulty,score,strengths,improvements,created_at').eq('user_id', session.user.id).order('created_at', { ascending: false })
      .then(({ data, error: err }) => { if (!active) return; if (err) setError(friendlyDatabaseError(err.message, 'We couldn’t load your recent interviews. Please try again.')); else setRows((data ?? []) as InterviewRow[]); setBusy(false); });
    return () => { active = false; };
  }, [session, refresh]);
  const [, setLocation] = useLocation();
  const completedScores = rows.flatMap(row => row.score == null ? [] : [row.score]);
  const averageScore = completedScores.length ? Math.round(completedScores.reduce((sum, score) => sum + score, 0) / completedScores.length) : null;
  const bestScore = completedScores.length ? Math.max(...completedScores) : null;
  const performanceSummary = averageScore == null
    ? 'Your first score will appear after a practice.'
    : averageScore >= 80 ? 'You’re building strong interview confidence.'
    : averageScore >= 60 ? 'You’re making progress with every answer.'
    : 'Keep practicing; steady repetition makes a difference.';
  return <Protected><Shell active="dashboard"><div className="dashboard-page">
    <section className="dashboard-welcome" aria-labelledby="dashboard-title">
      <div className="dashboard-welcome-copy">
        <div className="eyebrow">YOUR PRACTICE, IN ONE PLACE</div>
        <h1 id="dashboard-title">Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}.</h1>
        <p>Build confidence one thoughtful practice at a time.</p>
      </div>
      <Link href="/interview/setup" className="button button-primary dashboard-cta" data-testid="button-dashboard-practice"><Sparkles size={17}/> Start Mock Interview <ArrowRight size={16}/></Link>
      <div className="dashboard-welcome-orbit" aria-hidden="true"><span/><span/></div>
    </section>

    <section className="dashboard-stats-grid" aria-label="Interview performance summary">
      <article className="dashboard-stat-card">
        <span className="dashboard-stat-icon"><BarChart3 size={18}/></span>
        <div className="dashboard-stat-copy"><span className="dashboard-stat-label">TOTAL INTERVIEWS</span><b data-testid="value-total-interviews">{busy ? '—' : rows.length}</b><small>Practice sessions saved</small></div>
      </article>
      <article className="dashboard-stat-card">
        <span className="dashboard-stat-icon"><Target size={18}/></span>
        <div className="dashboard-stat-copy"><span className="dashboard-stat-label">AVERAGE SCORE</span><b data-testid="value-average-score">{busy || averageScore == null ? '—' : averageScore}<small className="dashboard-score-out-of">{!busy && averageScore != null ? ' / 100' : ''}</small></b><small>{busy ? 'Loading your results' : averageScore == null ? 'Scores appear after review' : performanceSummary}</small></div>
      </article>
      <article className="dashboard-stat-card dashboard-stat-card-best">
        <span className="dashboard-stat-icon"><Sparkles size={18}/></span>
        <div className="dashboard-stat-copy"><span className="dashboard-stat-label">BEST SCORE</span><b data-testid="value-best-score">{busy || bestScore == null ? '—' : bestScore}<small className="dashboard-score-out-of">{!busy && bestScore != null ? ' / 100' : ''}</small></b><small>{busy ? 'Loading your results' : bestScore == null ? 'Your top result will show here' : 'Your highest interview score'}</small></div>
      </article>
    </section>

    <section className="dashboard-recent-section" aria-labelledby="dashboard-recent-heading">
      <div className="section-head dashboard-section-head">
        <div><div className="eyebrow">KEEP YOUR MOMENTUM</div><h2 id="dashboard-recent-heading">Recent Interviews</h2><p>Your latest sessions and how they went.</p></div>
        <Link href="/history" className="text-link" data-testid="link-view-history">View all <ArrowRight size={15}/></Link>
      </div>
      {busy ? <div className="list-skeleton dashboard-list-skeleton"><div/><div/><div/></div> : error ? <div className="empty-state dashboard-empty-state"><h3>We couldn’t load your practice.</h3><p>{error}</p><button className="button button-secondary" onClick={() => setRefresh(refresh + 1)} data-testid="button-retry-dashboard">Try again</button></div> : rows.length === 0 ? <div className="empty-state dashboard-empty-state"><div className="empty-icon"><BookOpen size={21}/></div><h3>Your first mock interview is waiting.</h3><p>Choose a role and practice at your own pace. Your feedback will be saved here.</p><Link href="/interview/setup" className="button button-primary dashboard-cta" data-testid="button-empty-start"><Sparkles size={16}/> Start Mock Interview <ArrowRight size={15}/></Link></div> : <div className="recent-list dashboard-recent-list">{rows.slice(0, 5).map((row, i) => <Link key={row.id} href={`/interview/results/${row.id}`} className="recent-row dashboard-recent-row" data-testid={`row-recent-${row.id}`}><span className="recent-number">{String(i + 1).padStart(2, '0')}</span><div className="recent-info dashboard-recent-info"><b>{row.role}</b><div className="dashboard-interview-tags"><span className="dashboard-interview-type">{row.interview_type}</span><span className="dashboard-difficulty">{row.difficulty}</span></div></div><span className="recent-date dashboard-recent-date">{new Date(row.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span><span className="recent-score dashboard-recent-score">{row.score == null ? '—' : row.score}<small>{row.score == null ? 'NOT REVIEWED' : 'SCORE / 100'}</small></span><ChevronRight className="recent-chevron" size={17}/></Link>)}</div>}
    </section>
    <div className="dashboard-footnote"><Clock3 size={15}/> Your practice history is private and saved to your account.</div>
  </div></Shell></Protected>;
}

function SetupPage() {
  const [setup, setSetup] = useState<Setup>({ interviewType: 'Behavioral Interview', role: '', difficulty: 'Medium', numberOfQuestions: 5 });
  const [error, setError] = useState('');
  const [, setLocation] = useLocation();
  const { session } = useAuth();
  const generate = useGenerateInterviewQuestions({ request: { headers: { Authorization: `Bearer ${session?.access_token ?? ''}` } } });
  async function start(e: FormEvent) {
    e.preventDefault(); setError('');
    if (!supabase || !session?.user) { setError('Your Supabase account connection is unavailable. Please check the project configuration and sign in again.'); return; }
    try {
      const result = await generate.mutateAsync({ data: { ...setup, role: setup.role.trim() } });
      if (!result.questions?.length) throw new Error('No questions were returned. Please try again.');
      const { data: interview, error: insertError } = await supabase.from('interviews').insert({ user_id: session.user.id, interview_type: setup.interviewType, role: setup.role.trim(), difficulty: setup.difficulty, score: null, strengths: [], improvements: [] }).select('id').single();
      if (insertError) throw new Error(friendlyDatabaseError(insertError.message, 'We couldn’t save this practice. Please try again.'));
      const questions = result.questions.map((q, index) => ({ interview_id: interview.id, question: q.question, answer: '', position: index + 1 }));
      const { error: questionError } = await supabase.from('interview_questions').insert(questions);
      if (questionError) {
        await supabase.from('interviews').delete().eq('id', interview.id);
        throw new Error(friendlyDatabaseError(questionError.message, 'We couldn’t save the generated questions. Please try again.'));
      }
      sessionStorage.setItem(`intervai-active-${session.user.id}`, JSON.stringify({ id: interview.id, setup: { ...setup, role: setup.role.trim() }, questions: result.questions.map(q => ({ question: q.question, answer: '' })) }));
      setLocation('/interview/session');
    } catch (err) { setError(err instanceof Error ? friendlyDatabaseError(err.message, err.message) : 'We couldn’t start this practice. Please try again.'); }
  }
  return <Protected><Shell active="practice"><div className="page-heading compact-heading"><div><div className="eyebrow">SET THE SCENE</div><h1>Build your practice.</h1><p>Choose what you’re preparing for. We’ll shape the questions around you.</p></div><Link href="/dashboard" className="back-link" data-testid="link-back-dashboard"><ArrowLeft size={15}/> Back to overview</Link></div>
    <div className="setup-layout"><form className="setup-form" onSubmit={start}>
      <div className="setup-block"><div className="setup-step"><span>01</span><div><h2>What kind of interview?</h2><p>Pick the style you want to work on.</p></div></div><div className="choice-grid">{(['Behavioral Interview', 'Technical Interview', 'HR Interview', 'General Interview'] as InterviewType[]).map((v, i) => <button type="button" className={`choice-card ${setup.interviewType === v ? 'choice-selected' : ''}`} key={v} onClick={() => setSetup({ ...setup, interviewType: v })} data-testid={`option-type-${i}`}><span className="choice-symbol">{['B','T','H','G'][i]}</span><span>{v.replace(' Interview', '')}</span>{setup.interviewType === v && <Check size={15}/>}</button>)}</div></div>
      <div className="setup-block"><div className="setup-step"><span>02</span><div><h2>What role are you aiming for?</h2><p>Be specific. It helps make the practice feel real.</p></div></div><label className="field-label">Role or position<input value={setup.role} onChange={e => setSetup({ ...setup, role: e.target.value })} placeholder="e.g. Product Designer, Junior Developer" required minLength={2} maxLength={80} data-testid="input-role"/></label></div>
      <div className="setup-block"><div className="setup-step"><span>03</span><div><h2>Choose your pace.</h2><p>Adjust the challenge and the length.</p></div></div><div className="split-fields"><label className="field-label">Difficulty<select value={setup.difficulty} onChange={e => setSetup({ ...setup, difficulty: e.target.value as Difficulty })} data-testid="select-difficulty"><option>Easy</option><option>Medium</option><option>Hard</option></select></label><label className="field-label">Questions<select value={setup.numberOfQuestions} onChange={e => setSetup({ ...setup, numberOfQuestions: Number(e.target.value) as 5 | 10 })} data-testid="select-question-count"><option value={5}>5 questions · quick run</option><option value={10}>10 questions · deep practice</option></select></label></div></div>
      {error && <div className="alert alert-error" data-testid="status-setup-error">{error}</div>}
      <button type="submit" disabled={generate.isPending} className="button button-primary button-wide" data-testid="button-generate-questions">{generate.isPending ? <><span className="button-pulse"/> Preparing your questions…</> : <>Create my practice <ArrowRight size={16}/></>}</button>
    </form><aside className="setup-aside"><div className="aside-mark"><AudioLines size={19}/></div><span className="eyebrow">YOUR SESSION, YOUR SPACE</span><h3>Take it at<br/>your own pace.</h3><p>Your answers stay saved as you move through the questions. Pause, think, and come back to what matters.</p><div className="aside-meta"><span><Check size={14}/> Private by default</span><span><Check size={14}/> Feedback at the end</span></div><div className="aside-foot"><span>INTERVAI / PRACTICE STUDIO</span><span>EST. FOR WHAT’S NEXT</span></div></aside></div>
  </Shell></Protected>;
}

function SessionPage() {
  const { session } = useAuth();
  const [, setLocation] = useLocation();
  const evaluate = useEvaluateInterview({ request: { headers: { Authorization: `Bearer ${session?.access_token ?? ''}` } } });
  const [active, setActive] = useState<{ id: string; setup: Setup; questions: Question[] } | null>(null);
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const submittingRef = useRef(false);
  useEffect(() => {
    if (!session?.user.id) return;
    const raw = sessionStorage.getItem(`intervai-active-${session.user.id}`);
    if (raw) { try { setActive(JSON.parse(raw) as typeof active); } catch { setError('Your practice session could not be restored. Please start again.'); } }
    else setError('No active practice found. Start a new practice to begin.');
  }, [session?.user.id]);
  function updateAnswer(value: string) {
    if (!active) return;
    const next = { ...active, questions: active.questions.map((q, i) => i === index ? { ...q, answer: value } : q) };
    setActive(next); if (session?.user.id) sessionStorage.setItem(`intervai-active-${session.user.id}`, JSON.stringify(next));
  }
  async function goNext() {
    if (!active || !supabase || submittingRef.current) return;
    submittingRef.current = true;
    setSaving(true); setError('');
    try {
      const current = active.questions[index];
      const { error: dbError } = await supabase.from('interview_questions').update({ answer: current.answer }).eq('interview_id', active.id).eq('position', index + 1);
      if (dbError) throw new Error(friendlyDatabaseError(dbError.message, 'We couldn’t save this answer. Please try again.'));
      if (index < active.questions.length - 1) setIndex(index + 1);
      else {
        const resultKey = `intervai-result-${active.id}`;
        let result: Evaluation;
        const savedResult = sessionStorage.getItem(resultKey);
        if (savedResult) {
          try { result = JSON.parse(savedResult) as Evaluation; }
          catch {
            sessionStorage.removeItem(resultKey);
            result = await evaluate.mutateAsync({ data: { interviewType: active.setup.interviewType, role: active.setup.role, difficulty: active.setup.difficulty, questions: active.questions.map(q => ({ question: q.question, answer: q.answer })) } });
            sessionStorage.setItem(resultKey, JSON.stringify(result));
          }
        } else {
          result = await evaluate.mutateAsync({ data: { interviewType: active.setup.interviewType, role: active.setup.role, difficulty: active.setup.difficulty, questions: active.questions.map(q => ({ question: q.question, answer: q.answer })) } });
          sessionStorage.setItem(resultKey, JSON.stringify(result));
        }
        await saveEvaluation(active.id, result);
        sessionStorage.setItem(`intervai-meta-${active.id}`, JSON.stringify({ difficulty: active.setup.difficulty }));
        if (session?.user.id) sessionStorage.removeItem(`intervai-active-${session.user.id}`);
        setLocation(`/interview/results/${active.id}`);
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'We couldn’t save this answer. Please try again.'); }
    finally { submittingRef.current = false; setSaving(false); }
  }
  async function saveEvaluation(id: string, result: Evaluation) {
    if (!supabase) return;
    const { error: saveError } = await supabase.from('interviews').update({ score: result.overallScore, strengths: result.strengths, improvements: result.improvements }).eq('id', id);
    if (saveError) throw saveError;
    for (let i = 0; i < result.questions.length; i++) {
      const q = result.questions[i];
      const { error: questionError } = await supabase.from('interview_questions').update({ answer: q.answer, feedback: q.feedback, score: q.score }).eq('interview_id', id).eq('position', i + 1);
      if (questionError) throw questionError;
    }
  }
  const current = active?.questions[index];
  return <Protected><Shell active="practice">{!active ? <div className="empty-state session-empty"><div className="empty-icon"><CircleHelp size={20}/></div><h2>Practice isn’t ready yet.</h2><p>{error || 'Start a new practice to begin.'}</p><Link href="/interview/setup" className="button button-primary" data-testid="button-session-setup">Set up a practice <ArrowRight size={15}/></Link></div> :
    <div className="session-page"><div className="session-top"><Link href="/interview/setup" className="back-link" data-testid="link-session-back"><ChevronLeft size={16}/> Leave session</Link><span className="session-chip"><i/> IN PROGRESS</span></div>
      <div className="session-title"><div className="eyebrow">{active.setup.interviewType.toUpperCase()} <span>/</span> {active.setup.role.toUpperCase()}</div><h1>Take a moment.<br/><em>Then answer.</em></h1><p>Your response is saved as you move through the practice.</p></div>
      <div className="session-progress"><div className="progress-copy"><span>QUESTION <b>{String(index + 1).padStart(2, '0')}</b> <i>OF</i> {String(active.questions.length).padStart(2, '0')}</span><span>{Math.round((index / active.questions.length) * 100)}% COMPLETE</span></div><div className="progress-track"><span style={{ width: `${(index / active.questions.length) * 100}%` }}/></div></div>
       <section className="question-card"><span className="question-number">Q{String(index + 1).padStart(2, '0')}</span><div className="question-body"><div className="eyebrow">YOUR QUESTION</div><h2 data-testid={`text-question-${index + 1}`}>{current?.question}</h2><label className="answer-label" htmlFor="answer-box">YOUR ANSWER <span>{(current?.answer ?? '').length} / 8,000</span></label><textarea id="answer-box" maxLength={8000} value={current?.answer ?? ''} onChange={e => updateAnswer(e.target.value)} placeholder="Take a breath, then write it as you’d say it in the room…" data-testid="input-answer"/></div></section>
      {error && <div className="alert alert-error" data-testid="status-session-error">{error}</div>}
      <div className="session-controls"><span><span className="autosave-dot"/> Answers saved as you go</span><div><button className="button button-secondary" disabled={index === 0 || saving} onClick={() => setIndex(index - 1)} data-testid="button-previous-question"><ChevronLeft size={16}/> Previous</button><button className="button button-primary" disabled={saving || evaluate.isPending || !current?.answer.trim()} onClick={goNext} data-testid="button-next-question">{saving || evaluate.isPending ? 'Saving…' : index === active.questions.length - 1 ? 'Finish & get feedback' : 'Next question'} {!(saving || evaluate.isPending) && <ArrowRight size={16}/>}</button></div></div>
    </div>}
  </Shell></Protected>;
}

async function getResult(id: string, session: Session | null): Promise<{ interview: InterviewRow; questions: Question[] } | null> {
  const cached = sessionStorage.getItem(`intervai-result-${id}`);
  if (cached) {
    try { const e = JSON.parse(cached) as Evaluation; const meta = JSON.parse(sessionStorage.getItem(`intervai-meta-${id}`) ?? '{}') as { difficulty?: Difficulty }; const { data: interview } = await supabase!.from('interviews').select('id,interview_type,role,difficulty,score,strengths,improvements,created_at').eq('id', id).single(); if (interview) return { interview: { ...interview, difficulty: interview.difficulty ?? meta.difficulty ?? 'Medium' } as InterviewRow, questions: e.questions }; } catch { /* fall through to persisted data */ }
  }
  if (!supabase || !session) return null;
   const [interviewResult, questionsResult] = await Promise.all([
    supabase.from('interviews').select('id,interview_type,role,difficulty,score,strengths,improvements,created_at').eq('id', id).eq('user_id', session.user.id).single(),
    supabase.from('interview_questions').select('question,answer,feedback,score,position').eq('interview_id', id).order('position')
  ]);
   if (interviewResult.error) throw new Error(friendlyDatabaseError(interviewResult.error.message, 'These results could not be loaded. Please try again.'));
   if (questionsResult.error) throw new Error(friendlyDatabaseError(questionsResult.error.message, 'These answers could not be loaded. Please try again.'));
   const interview = interviewResult.data;
   const questions = questionsResult.data;
  if (!interview) return null;
  return { interview: interview as InterviewRow, questions: (questions ?? []).map((q: any) => ({ question: q.question, answer: q.answer, feedback: q.feedback, score: q.score })) };
}

function ResultsPage() {
  const params = useParams<{ id: string }>();
  const { session } = useAuth();
  const [result, setResult] = useState<{ interview: InterviewRow; questions: Question[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    getResult(params.id, session).then(data => { if (active) { setResult(data); setLoading(false); } }).catch(err => { if (active) { setError(err instanceof Error ? err.message : 'Unable to load results.'); setLoading(false); } });
    return () => { active = false; };
  }, [params.id, session]);
  const overallScore = result?.interview.score ?? null;
  const scoreProgress = overallScore == null ? 0 : Math.max(0, Math.min(overallScore, 100));
  const interviewDate = result
    ? new Date(result.interview.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    : '';
  const performanceLabel = overallScore == null
    ? 'Awaiting review'
    : overallScore >= 80
      ? 'Strong performance'
      : overallScore >= 60
        ? 'Building confidence'
        : 'Room to grow';

  return <Protected><Shell active="results">
    {loading
      ? <div className="results-loading"><div className="skeleton skeleton-block"/><div className="skeleton skeleton-block"/></div>
      : error
        ? <div className="empty-state"><h2>Results couldn’t be loaded.</h2><p>{error}</p><Link href="/history" className="button button-secondary" data-testid="button-results-retry">Go to history</Link></div>
        : !result
          ? <div className="empty-state"><h2>We couldn’t find this practice.</h2><p>It may have been removed, or the link may be out of date.</p><Link href="/dashboard" className="button button-secondary" data-testid="button-results-dashboard">Back to overview</Link></div>
          : <div className="results-page">
            <div className="result-toolbar">
              <Link href="/dashboard" className="button button-secondary result-dashboard-link" data-testid="link-results-dashboard"><ArrowLeft size={15}/> Back to Dashboard</Link>
              <span className="eyebrow">INTERVIEW RESULTS</span>
            </div>
            <section className="result-hero" aria-labelledby="results-title">
              <div className="result-intro">
                <div className="eyebrow">PRACTICE REVIEW <span>/</span> {result.interview.interview_type.toUpperCase()}</div>
                <h1 id="results-title">Your practice,<br/><em>in focus.</em></h1>
                <p>Take what worked into your next conversation.</p>
              </div>
              <div className="result-score-panel">
                <div
                  className="result-score-ring"
                  role="img"
                  aria-label={`Overall score ${overallScore == null ? 'not available' : `${overallScore} out of 100`}`}
                  style={{ background: `conic-gradient(#b4baf1 ${scoreProgress}%, #373d51 ${scoreProgress}% 100%)` }}
                >
                  <div className="result-score-core">
                    <strong className="result-score-value" data-testid="value-overall-score">{overallScore ?? '—'}</strong>
                    <span className="result-score-max">/ 100</span>
                  </div>
                </div>
                <div className="score-label">OVERALL SCORE</div>
                <span className="result-level">{performanceLabel}</span>
              </div>
            </section>
            <dl className="results-metadata" aria-label="Interview details">
              <div className="result-meta-item"><dt><AudioLines size={14}/> Interview type</dt><dd>{result.interview.interview_type}</dd></div>
              <div className="result-meta-item"><dt><FileText size={14}/> Role</dt><dd>{result.interview.role}</dd></div>
              <div className="result-meta-item"><dt><CircleHelp size={14}/> Difficulty</dt><dd>{result.interview.difficulty ?? 'Not specified'}</dd></div>
              <div className="result-meta-item"><dt><Clock3 size={14}/> Date</dt><dd>{interviewDate}</dd></div>
            </dl>
            <div className="result-feedback-grid">
              <section className="result-feedback-card strengths" aria-labelledby="results-strengths-title">
                <div className="result-feedback-heading">
                  <span className="result-feedback-icon"><Check size={16}/></span>
                  <div><h2 id="results-strengths-title">Strengths</h2><p>What came through in your answers.</p></div>
                </div>
                {(result.interview.strengths ?? []).length
                  ? <ul className="result-feedback-list">{result.interview.strengths?.map((item, i) => <li key={i} data-testid={`text-strength-${i}`}><span aria-hidden="true">+</span>{item}</li>)}</ul>
                  : <p className="result-feedback-empty">Your strengths will appear here once this practice has been evaluated.</p>}
              </section>
              <section className="result-feedback-card improvements" aria-labelledby="results-improvements-title">
                <div className="result-feedback-heading">
                  <span className="result-feedback-icon"><Target size={16}/></span>
                  <div><h2 id="results-improvements-title">Areas to Improve</h2><p>Specific opportunities for your next practice.</p></div>
                </div>
                {(result.interview.improvements ?? []).length
                  ? <ul className="result-feedback-list">{result.interview.improvements?.map((item, i) => <li key={i} data-testid={`text-improvement-${i}`}><span aria-hidden="true">↗</span>{item}</li>)}</ul>
                  : <p className="result-feedback-empty">No improvement notes were saved for this session.</p>}
              </section>
            </div>
            <div className="section-head result-question-section-head">
              <div><h2>Question by question</h2><p>Open any response to review your answer and AI feedback.</p></div>
              <span className="result-question-count">{result.questions.length} {result.questions.length === 1 ? 'QUESTION' : 'QUESTIONS'}</span>
            </div>
            <div className="result-question-list">
              {result.questions.map((q, i) => (
                <details className="result-question" key={`${i}-${q.question}`}>
                  <summary>
                    <span className="result-question-index">Q{String(i + 1).padStart(2, '0')}</span>
                    <span className="result-question-title">{q.question}</span>
                    <span className="result-question-score" data-testid={`value-question-score-${i}`}><strong>{q.score ?? '—'}</strong><small>/100</small></span>
                    <span className="result-question-toggle"><ChevronRight size={17}/></span>
                  </summary>
                  <div className="result-question-content">
                    <div className="rq-answer"><span>Your answer</span><p>{q.answer || 'No answer was saved for this question.'}</p></div>
                    <div className="rq-feedback"><span>AI feedback</span><p>{q.feedback || 'AI feedback is not available for this question.'}</p></div>
                  </div>
                </details>
              ))}
            </div>
            <div className="results-end">
              <div><span>Keep building on this practice.</span><p>Each interview is a chance to make your next answer clearer.</p></div>
              <Link href="/interview/setup" className="button button-primary" data-testid="button-practice-again">Practice Again <ArrowRight size={15}/></Link>
            </div>
          </div>}
  </Shell></Protected>;
}

function HistoryPage() {
  const { session } = useAuth();
  const [rows, setRows] = useState<InterviewRow[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    if (!supabase || !session) { setBusy(false); return; }
    setBusy(true);
    supabase.from('interviews').select('id,interview_type,role,difficulty,score,strengths,improvements,created_at').eq('user_id', session.user.id).order('created_at', { ascending: false })
      .then(({ data, error: err }) => { if (!active) return; if (err) setError(friendlyDatabaseError(err.message, 'Your interview history couldn’t be loaded. Please try again.')); else { setError(''); setRows((data ?? []) as InterviewRow[]); } setBusy(false); });
    return () => { active = false; };
  }, [session, refresh]);
  return <Protected><Shell active="history"><div className="page-heading compact-heading"><div><div className="eyebrow">EVERY STEP COUNTS</div><h1>Your practice history.</h1><p>Look back at how far you’ve come, one answer at a time.</p></div><Link href="/interview/setup" className="button button-primary" data-testid="button-history-practice"><Plus size={16}/> New practice</Link></div>
    <section className="history-summary"><div><span>SESSIONS</span><b data-testid="value-session-count">{busy ? '—' : rows.length}</b></div><div><span>LAST PRACTICE</span><b data-testid="value-last-session">{rows[0] ? new Date(rows[0].created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}</b></div><div className="summary-aside">A record of showing up<br/>for your next step.</div></section>
    <div className="section-head history-list-heading"><div><h2>All practices</h2><p>Saved privately to your account.</p></div>{!busy && <span className="count-pill">{rows.length} TOTAL</span>}</div>
    {busy ? <div className="list-skeleton"><div/><div/><div/><div/></div> : error ? <div className="empty-state"><h3>History didn’t load.</h3><p>{error}</p><button className="button button-secondary" onClick={() => setRefresh(refresh + 1)} data-testid="button-retry-history">Try again</button></div> : rows.length === 0 ? <div className="empty-state"><div className="empty-icon"><FileText size={21}/></div><h3>Nothing to look back on yet.</h3><p>Your finished practices will live here. Start with one and see what you learn.</p><Link href="/interview/setup" className="button button-secondary" data-testid="button-history-empty">Start your first practice <ArrowRight size={15}/></Link></div> : <div className="history-list">{rows.map((row, i) => <Link key={row.id} href={`/interview/results/${row.id}`} className="history-row" data-testid={`row-history-${row.id}`}><span className="history-num">{String(i + 1).padStart(2, '0')}</span><div className="history-primary"><b>{row.role}</b><span>{row.interview_type} <i>·</i> {row.difficulty}</span></div><div className="history-date"><span>{new Date(row.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span><small>{new Date(row.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</small></div><div className="history-score">{row.score ?? '—'}<small>{row.score == null ? 'PENDING' : 'SCORE'}</small></div><ChevronRight size={17}/></Link>)}</div>}
  </Shell></Protected>;
}

export default App;
