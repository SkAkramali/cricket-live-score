import { useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function authFetch(path, opts = {}) {
  const token = localStorage.getItem('accessToken');
  return fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts.headers }
  });
}

const ROLE_ICONS = { batsman: '🏏', bowler: '⚡', 'all-rounder': '⭐', wicketkeeper: '🧤' };

export function TeamsPlayers() {
  const [tab, setTab]               = useState('teams');
  const [teams, setTeams]           = useState([]);
  const [players, setPlayers]       = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [loading, setLoading]       = useState(true);
  const [showTeamModal, setShowTeamModal]     = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [expandedTeam, setExpandedTeam]       = useState(null);

  useEffect(() => {
    authFetch('/tournaments').then(r => r.json()).then(d => setTournaments(d.data || []));
  }, []);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    try {
      const q = selectedTournament ? `?tournament_id=${selectedTournament}` : '';
      const r = await authFetch(`/teams${q}`);
      const d = await r.json();
      setTeams(d.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [selectedTournament]);

  const loadPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const r = await authFetch('/players');
      const d = await r.json();
      setPlayers(d.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === 'teams')   loadTeams();
    if (tab === 'players') loadPlayers();
  }, [tab, loadTeams, loadPlayers]);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">{tab === 'teams' ? 'Teams' : 'Players'}</div>
          <div className="page-subtitle">
            {tab === 'teams' ? `${teams.length} teams registered` : `${players.length} players registered`}
          </div>
        </div>
        <div className="page-actions">
          {tab === 'teams'
            ? <button className="btn btn-primary" onClick={() => setShowTeamModal(true)}>+ Add Team</button>
            : <button className="btn btn-primary" onClick={() => setShowPlayerModal(true)}>+ Add Player</button>
          }
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'teams' ? 'active' : ''}`}   onClick={() => setTab('teams')}>🛡️ Teams</button>
        <button className={`tab ${tab === 'players' ? 'active' : ''}`} onClick={() => setTab('players')}>👤 Players</button>
      </div>

      {/* Tournament filter for teams */}
      {tab === 'teams' && (
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Filter by tournament:</label>
          <select
            value={selectedTournament}
            onChange={e => setSelectedTournament(e.target.value)}
            style={{ maxWidth: 280 }}
          >
            <option value="">All tournaments</option>
            {tournaments.map(t => (
              <option key={t.tournament_id} value={t.tournament_id}>{t.tournament_name}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="spinner-container"><div className="spinner" /></div>
      ) : tab === 'teams' ? (
        teams.length === 0
          ? <EmptyState icon="🛡️" msg="No teams found" sub="Add your first team to get started." action="+ Add Team" onAction={() => setShowTeamModal(true)} />
          : <div className="grid-3">{teams.map(t => (
              <TeamCard
                key={t.team_id}
                team={t}
                expanded={expandedTeam === t.team_id}
                onExpand={() => setExpandedTeam(expandedTeam === t.team_id ? null : t.team_id)}
              />
            ))}</div>
      ) : (
        players.length === 0
          ? <EmptyState icon="👤" msg="No players found" sub="Add players to your teams." action="+ Add Player" onAction={() => setShowPlayerModal(true)} />
          : <PlayersTable players={players} />
      )}

      {showTeamModal   && <TeamModal   tournaments={tournaments} onClose={() => setShowTeamModal(false)}   onSaved={loadTeams} />}
      {showPlayerModal && <PlayerModal teams={teams}             onClose={() => setShowPlayerModal(false)} onSaved={loadPlayers} />}
    </div>
  );
}

/* ── Team Card ──────────────────────────────────────────────── */
function TeamCard({ team, expanded, onExpand }) {
  const [teamPlayers, setTeamPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  useEffect(() => {
    if (expanded && teamPlayers.length === 0) {
      setLoadingPlayers(true);
      authFetch(`/teams/${team.team_id}/players`)
        .then(r => r.json())
        .then(d => setTeamPlayers(d.data || []))
        .catch(console.error)
        .finally(() => setLoadingPlayers(false));
    }
  }, [expanded]);

  const initials = (team.team_short_name || team.team_name || '??').slice(0, 2).toUpperCase();

  return (
    <div className="team-card">
      <div className="team-card-header">
        <div className="team-logo">{initials}</div>
        <div className="team-info">
          <div className="team-name">{team.team_name}</div>
          {team.team_short_name && <div className="team-short">{team.team_short_name}</div>}
        </div>
      </div>
      <div className="team-card-body">
        <div className="team-meta">
          {team.coach_name && <div className="team-meta-item"><span>👨‍💼</span>{team.coach_name}</div>}
          {team.home_ground && <div className="team-meta-item"><span>🏟️</span>{team.home_ground}</div>}
        </div>
        <button
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 12, width: '100%' }}
          onClick={onExpand}
        >
          {expanded ? '▲ Hide Roster' : '▼ View Roster'}
        </button>
        {expanded && (
          <div style={{ marginTop: 12 }}>
            {loadingPlayers
              ? <div style={{ textAlign: 'center', padding: 16 }}><div className="spinner" /></div>
              : teamPlayers.length === 0
                ? <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 12 }}>No players yet</div>
                : teamPlayers.map(p => (
                    <div key={p.player_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--brand-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                        {ROLE_ICONS[p.role] || '👤'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{p.player_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                          {p.role}{p.jersey_number ? ` · #${p.jersey_number}` : ''}
                        </div>
                      </div>
                    </div>
                  ))
            }
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Players Table ──────────────────────────────────────────── */
function PlayersTable({ players }) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Role</th>
            <th>Batting Style</th>
            <th>Bowling Style</th>
            <th>Jersey</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => (
            <tr key={p.player_id}>
              <td className="td-muted">{i + 1}</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                    {ROLE_ICONS[p.role] || '👤'}
                  </div>
                  <div>
                    <div className="td-name">{p.player_name}</div>
                    <div className="td-muted">{p.team_name || 'Unassigned'}</div>
                  </div>
                </div>
              </td>
              <td><span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{p.role}</span></td>
              <td className="td-muted" style={{ textTransform: 'capitalize' }}>{p.batting_style || '—'}</td>
              <td className="td-muted">{p.bowling_style || '—'}</td>
              <td><span style={{ fontWeight: 700, color: 'var(--brand-dark)' }}>{p.jersey_number ? `#${p.jersey_number}` : '—'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Team Modal ─────────────────────────────────────────────── */
function TeamModal({ tournaments, onClose, onSaved }) {
  const [form, setForm] = useState({ team_name: '', team_short_name: '', coach_name: '', home_ground: '', tournament_id: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const r = await authFetch('/teams', { method: 'POST', body: JSON.stringify(form) });
      const d = await r.json();
      if (d.success) { onSaved(); onClose(); }
      else setError(d.message || 'Failed to create team');
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Add Team</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-grid">
              <div className="form-group full">
                <label>Team Name *</label>
                <input value={form.team_name} onChange={set('team_name')} required placeholder="e.g. Mumbai Indians" />
              </div>
              <div className="form-group">
                <label>Short Name</label>
                <input value={form.team_short_name} onChange={set('team_short_name')} placeholder="e.g. MI" maxLength={10} />
              </div>
              <div className="form-group">
                <label>Coach</label>
                <input value={form.coach_name} onChange={set('coach_name')} placeholder="Coach name" />
              </div>
              <div className="form-group full">
                <label>Home Ground</label>
                <input value={form.home_ground} onChange={set('home_ground')} placeholder="Stadium / Ground name" />
              </div>
              <div className="form-group full">
                <label>Tournament</label>
                <select value={form.tournament_id} onChange={set('tournament_id')}>
                  <option value="">No tournament (standalone)</option>
                  {tournaments.map(t => <option key={t.tournament_id} value={t.tournament_id}>{t.tournament_name}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : '🛡️ Add Team'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Player Modal ───────────────────────────────────────────── */
function PlayerModal({ teams, onClose, onSaved }) {
  const [form, setForm] = useState({
    player_name: '', team_id: '', role: 'batsman',
    batting_style: 'right-hand', bowling_style: '', jersey_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const r = await authFetch('/players', { method: 'POST', body: JSON.stringify(form) });
      const d = await r.json();
      if (d.success) { onSaved(); onClose(); }
      else setError(d.message || 'Failed to add player');
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Add Player</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-grid">
              <div className="form-group full">
                <label>Player Name *</label>
                <input value={form.player_name} onChange={set('player_name')} required placeholder="Full name" />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={form.role} onChange={set('role')}>
                  <option value="batsman">Batsman</option>
                  <option value="bowler">Bowler</option>
                  <option value="all-rounder">All-rounder</option>
                  <option value="wicketkeeper">Wicketkeeper</option>
                </select>
              </div>
              <div className="form-group">
                <label>Batting Style</label>
                <select value={form.batting_style} onChange={set('batting_style')}>
                  <option value="right-hand">Right Hand</option>
                  <option value="left-hand">Left Hand</option>
                </select>
              </div>
              <div className="form-group">
                <label>Bowling Style</label>
                <input value={form.bowling_style} onChange={set('bowling_style')} placeholder="e.g. Fast, Spin" />
              </div>
              <div className="form-group">
                <label>Jersey #</label>
                <input type="number" value={form.jersey_number} onChange={set('jersey_number')} placeholder="e.g. 18" min={1} max={99} />
              </div>
              <div className="form-group full">
                <label>Team</label>
                <select value={form.team_id} onChange={set('team_id')}>
                  <option value="">No team</option>
                  {teams.map(t => <option key={t.team_id} value={t.team_id}>{t.team_name}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : '👤 Add Player'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmptyState({ icon, msg, sub, action, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3>{msg}</h3>
      <p>{sub}</p>
      <button className="btn btn-primary" onClick={onAction}>{action}</button>
    </div>
  );
}
