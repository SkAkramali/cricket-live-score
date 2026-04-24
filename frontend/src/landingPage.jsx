import { useNavigate } from 'react-router-dom';
import './css/landingpage.css';

/* ── Data ───────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: '🔴',
    title: 'Ball-by-Ball Live Scoring',
    desc: 'Record every delivery instantly — runs, extras, wickets — and watch the scoreboard update in real time.',
    color: '#ef4444',
  },
  {
    icon: '📊',
    title: 'Auto-Generated Scorecards',
    desc: 'Batting averages, strike rates, economy figures, and bowling stats computed automatically after each ball.',
    color: '#10b981',
  },
  {
    icon: '🏆',
    title: 'Tournament Management',
    desc: 'Create tournaments, generate unique join codes, manage teams, and track points tables — all in one place.',
    color: '#f59e0b',
  },
  {
    icon: '🛡️',
    title: 'Teams & Rosters',
    desc: 'Build full team rosters with player roles, batting style, bowling style, and jersey numbers.',
    color: '#3b82f6',
  },
  {
    icon: '📈',
    title: 'Points Table & Standings',
    desc: 'Live points tables with Net Run Rate, wins, losses, and head-to-head records updated automatically.',
    color: '#8b5cf6',
  },
  {
    icon: '⚡',
    title: 'Real-Time via WebSocket',
    desc: 'Socket.io powered updates mean every scorer and spectator sees the same live score with zero refresh.',
    color: '#ec4899',
  },
];

const STEPS = [
  { n: '01', title: 'Create a Tournament', desc: 'Set the format, overs, dates, and location. Get a unique 8-character join code instantly.' },
  { n: '02', title: 'Add Teams & Players', desc: 'Build your team rosters with player roles, batting styles, and jersey numbers.' },
  { n: '03', title: 'Score Ball by Ball', desc: 'Use the live scoring panel — tap a run, mark an extra, or record a wicket in one tap.' },
];

const STATS = [
  { value: '∞', label: 'Matches Supported' },
  { value: '6',  label: 'Formats (T10–Test)' },
  { value: '< 1s', label: 'Score Latency' },
  { value: '100%', label: 'Free to Use' },
];

const NAV_LINKS = [
  { label: 'Features',    href: '#features'  },
  { label: 'How it Works',href: '#how'       },
  { label: 'Stats',       href: '#stats'     },
];

/* ── Component ───────────────────────────────────────────────── */
export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="lp-root">
      {/* ── Navbar ──────────────────────────────────────────── */}
      <header className="lp-nav">
        <div className="lp-nav-inner">
          <a href="/" className="lp-logo">
            <span className="lp-logo-icon">🏏</span>
            <span className="lp-logo-text">Cric<span>Live</span></span>
          </a>

          <nav className="lp-nav-links">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} className="lp-nav-link">{l.label}</a>
            ))}
          </nav>

          <div className="lp-nav-cta">
            <button className="lp-btn lp-btn-ghost" onClick={() => navigate('/signin')}>
              Sign In
            </button>
            <button className="lp-btn lp-btn-primary" onClick={() => navigate('/signup')}>
              Get Started Free →
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="lp-hero">
        {/* Background decoration */}
        <div className="lp-hero-glow lp-glow-tl" />
        <div className="lp-hero-glow lp-glow-br" />
        <div className="lp-hero-grid" />

        <div className="lp-hero-inner">
          {/* Left */}
          <div className="lp-hero-text">
            <div className="lp-badge">
              <span className="lp-badge-dot" />
              Live Cricket Scoring Platform
            </div>

            <h1 className="lp-h1">
              Score every ball.<br />
              <span className="lp-h1-accent">Track every moment.</span>
            </h1>

            <p className="lp-hero-sub">
              CricLive is an enterprise-grade cricket scoring platform for clubs, academies, and
              tournaments. Ball-by-ball scoring, live scorecards, auto-points tables — everything
              in one place.
            </p>

            <div className="lp-hero-btns">
              <button className="lp-btn lp-btn-primary lp-btn-lg" onClick={() => navigate('/signup')}>
                Start for free
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
              <button className="lp-btn lp-btn-outline lp-btn-lg" onClick={() => navigate('/signin')}>
                View Demo
              </button>
            </div>

            {/* Mini stats */}
            <div className="lp-hero-trust">
              {['T20 · ODI · Test · T10', 'Ball-by-ball scoring', 'Auto scorecards'].map(t => (
                <div key={t} className="lp-trust-item">
                  <span className="lp-trust-check">✓</span>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Mock scoreboard card */}
          <div className="lp-hero-visual">
            <div className="lp-mock-card">
              {/* Live header */}
              <div className="lp-mock-header">
                <div className="lp-mock-live">
                  <span className="lp-live-dot" />
                  LIVE
                </div>
                <span style={{ fontSize: 12, color: '#64748b' }}>T20 · Over 14.3</span>
              </div>

              {/* Teams & Score */}
              <div className="lp-mock-score">
                <div className="lp-mock-team">
                  <div className="lp-mock-team-logo">MI</div>
                  <div>
                    <div className="lp-mock-team-name">Mumbai</div>
                    <div className="lp-mock-runs">142<span>/4</span></div>
                  </div>
                </div>
                <div className="lp-mock-vs">VS</div>
                <div className="lp-mock-team lp-mock-team-right">
                  <div>
                    <div className="lp-mock-team-name" style={{ textAlign: 'right' }}>Chennai</div>
                    <div className="lp-mock-runs" style={{ textAlign: 'right' }}>—</div>
                  </div>
                  <div className="lp-mock-team-logo lp-mock-team-logo-csk">CSK</div>
                </div>
              </div>

              {/* Current over chips */}
              <div className="lp-mock-over">
                <span style={{ fontSize: 11, color: '#94a3b8', marginRight: 8, fontWeight: 600 }}>Ov 15</span>
                {['·','1','4','W','6','2'].map((b, i) => (
                  <div key={i} className={`lp-chip ${b === 'W' ? 'lp-chip-w' : b === '4' ? 'lp-chip-4' : b === '6' ? 'lp-chip-6' : b === '·' ? 'lp-chip-dot' : 'lp-chip-run'}`}>
                    {b}
                  </div>
                ))}
              </div>

              {/* CRR */}
              <div className="lp-mock-meta">
                <div><span className="lp-mock-meta-label">CRR</span><span className="lp-mock-meta-val">9.87</span></div>
                <div><span className="lp-mock-meta-label">REQ</span><span className="lp-mock-meta-val">11.2</span></div>
                <div><span className="lp-mock-meta-label">Target</span><span className="lp-mock-meta-val">186</span></div>
              </div>
            </div>

            {/* Floating secondary card */}
            <div className="lp-mock-float">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--lp-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏆</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>IPL 2025 · 8 teams</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Points table updated</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features strip ──────────────────────────────────── */}
      <div className="lp-strip">
        {['Ball-by-ball scoring', 'Auto scorecards', 'Points tables', 'Tournament management', 'Live WebSocket updates', 'Multi-format support'].map(f => (
          <div key={f} className="lp-strip-item">
            <span className="lp-strip-check">✓</span>{f}
          </div>
        ))}
      </div>

      {/* ── Features grid ───────────────────────────────────── */}
      <section className="lp-section" id="features">
        <div className="lp-section-inner">
          <div className="lp-section-label">Features</div>
          <h2 className="lp-section-h2">Everything your tournament needs</h2>
          <p className="lp-section-sub">
            From a local club match to a full T20 league — CricLive handles scoring, stats, and standings.
          </p>

          <div className="lp-features-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="lp-feature-card">
                <div className="lp-feature-icon" style={{ background: f.color + '18', color: f.color }}>
                  {f.icon}
                </div>
                <h3 className="lp-feature-title">{f.title}</h3>
                <p className="lp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section className="lp-section lp-section-dark" id="how">
        <div className="lp-section-inner">
          <div className="lp-section-label lp-label-light">How it works</div>
          <h2 className="lp-section-h2 lp-h2-white">Up and scoring in 3 steps</h2>
          <p className="lp-section-sub lp-sub-muted">No setup hassle. Start scoring your first ball in under 5 minutes.</p>

          <div className="lp-steps">
            {STEPS.map((s, i) => (
              <div key={s.n} className="lp-step">
                <div className="lp-step-number">{s.n}</div>
                <div className="lp-step-body">
                  <h3 className="lp-step-title">{s.title}</h3>
                  <p className="lp-step-desc">{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && <div className="lp-step-arrow">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────── */}
      <section className="lp-stats-section" id="stats">
        <div className="lp-section-inner">
          <div className="lp-stats-grid">
            {STATS.map(s => (
              <div key={s.label} className="lp-stat">
                <div className="lp-stat-val">{s.value}</div>
                <div className="lp-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="lp-cta">
        <div className="lp-cta-inner">
          <div className="lp-cta-glow" />
          <div style={{ position: 'relative' }}>
            <h2 className="lp-cta-h2">Ready to score your first match?</h2>
            <p className="lp-cta-sub">
              Free forever for small tournaments. No credit card required.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="lp-btn lp-btn-primary lp-btn-lg" onClick={() => navigate('/signup')}>
                Create free account →
              </button>
              <button className="lp-btn lp-btn-ghost-white lp-btn-lg" onClick={() => navigate('/signin')}>
                Sign in
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="lp-logo lp-footer-logo">
              <span className="lp-logo-icon">🏏</span>
              <span className="lp-logo-text">Cric<span>Live</span></span>
            </div>
            <p className="lp-footer-tagline">
              Enterprise-grade cricket scoring for clubs, academies, and tournaments.
            </p>
          </div>

          <div className="lp-footer-cols">
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Platform</div>
              <a onClick={() => navigate('/signup')} className="lp-footer-link">Sign Up</a>
              <a onClick={() => navigate('/signin')} className="lp-footer-link">Sign In</a>
              <a href="#features" className="lp-footer-link">Features</a>
              <a href="#how" className="lp-footer-link">How it Works</a>
            </div>
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Scoring</div>
              <a className="lp-footer-link">Live Match</a>
              <a className="lp-footer-link">Scorecards</a>
              <a className="lp-footer-link">Points Table</a>
              <a className="lp-footer-link">Tournament</a>
            </div>
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Formats</div>
              {['T20', 'ODI', 'Test Match', 'T10', 'Custom'].map(f => (
                <span key={f} className="lp-footer-link">{f}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="lp-footer-bottom">
          <span>© {new Date().getFullYear()} CricLive. Built for cricket lovers.</span>
          <span style={{ display: 'flex', gap: 16 }}>
            <span className="lp-footer-link">Privacy</span>
            <span className="lp-footer-link">Terms</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
