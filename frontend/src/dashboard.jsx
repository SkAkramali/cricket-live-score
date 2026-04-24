import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function api(path) {
  const token = localStorage.getItem('accessToken');
  return fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.json());
}

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats]         = useState({ tournaments: 0, teams: 0, liveMatches: 0 });
  const [matches, setMatches]     = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      api('/tournaments'),
      api('/matches?status=live'),
      api('/teams'),
    ]).then(([t, m, tm]) => {
      const tourns   = t.data  || [];
      const live     = m.data  || [];
      const teams    = tm.data || [];
      setTournaments(tourns.slice(0, 3));
      setMatches(live.slice(0, 4));
      setStats({ tournaments: tourns.length, teams: teams.length, liveMatches: live.length });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner-container"><div className="spinner" /></div>;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #064e3b 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 32px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: 'white',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{ position: 'absolute', right: 32, top: -20, fontSize: 120, opacity: 0.08 }}>🏏</div>
        <div>
          <p style={{ color: '#6ee7b7', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
            {greeting()}, {user?.username || 'Player'} 👋
          </p>
          <h2 style={{ color: 'white', fontSize: 26, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
            Ready to score today?
          </h2>
          <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 6 }}>
            {stats.liveMatches > 0
              ? `${stats.liveMatches} match${stats.liveMatches > 1 ? 'es' : ''} live right now`
              : 'No matches live right now — check upcoming tournaments'}
          </p>
        </div>
        <button
          className="btn btn-primary"
          style={{ flexShrink: 0 }}
          onClick={() => navigate('/live-scoring')}
        >
          Start Scoring
        </button>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard icon="🏆" label="Tournaments" value={stats.tournaments} color="green" />
        <StatCard icon="🔴" label="Live Matches" value={stats.liveMatches} color="red"  />
        <StatCard icon="🛡️" label="Teams"        value={stats.teams}       color="blue" />
        <StatCard icon="⚡" label="Active Now"   value={stats.liveMatches} color="amber" />
      </div>

      {/* Live Matches + Recent Tournaments */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Live / Recent Matches */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              {stats.liveMatches > 0 ? '🔴 Live Matches' : 'Recent Matches'}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/live-scoring')}>
              View all
            </button>
          </div>
          <div>
            {matches.length === 0
              ? <EmptyMini icon="🏏" msg="No live matches right now" />
              : matches.map(m => <MatchRow key={m.match_id} match={m} />)
            }
          </div>
        </div>

        {/* Tournaments */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">My Tournaments</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tournaments')}>
              View all
            </button>
          </div>
          <div>
            {tournaments.length === 0
              ? <EmptyMini icon="🏆" msg="No tournaments yet" />
              : tournaments.map(t => <TournamentRow key={t.tournament_id} t={t} />)
            }
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <span className="card-title">Quick Actions</span>
        </div>
        <div className="card-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <QuickAction icon="🏆" label="Create Tournament" onClick={() => navigate('/tournaments')} />
          <QuickAction icon="🛡️" label="Add Team"          onClick={() => navigate('/teams')} />
          <QuickAction icon="🔴" label="Score a Match"     onClick={() => navigate('/live-scoring')} primary />
          <QuickAction icon="📋" label="View Scorecard"    onClick={() => navigate('/scoreboard')} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function MatchRow({ match }) {
  return (
    <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
          {match.team1_name || `Team ${match.team1_id}`} vs {match.team2_name || `Team ${match.team2_id}`}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{match.venue || 'TBD'}</div>
      </div>
      <span className="badge badge-live">Live</span>
    </div>
  );
}

function TournamentRow({ t }) {
  const statusClass = { live: 'badge-live', upcoming: 'badge-upcoming', completed: 'badge-completed' }[t.status] || 'badge-upcoming';
  const fmt = { t20: 'T20', odi: 'ODI', test: 'Test', t10: 'T10' }[t.format] || t.format?.toUpperCase();
  return (
    <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{t.tournament_name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{fmt} · {t.team_count || 0} teams</div>
      </div>
      <span className={`badge ${statusClass}`}>{t.status}</span>
    </div>
  );
}

function EmptyMini({ icon, msg }) {
  return (
    <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      {msg}
    </div>
  );
}

function QuickAction({ icon, label, onClick, primary }) {
  return (
    <button
      onClick={onClick}
      className={`btn ${primary ? 'btn-primary' : 'btn-ghost'}`}
      style={{ gap: 8 }}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}
