import { useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function authFetch(path, opts = {}) {
  const token = localStorage.getItem('accessToken');
  return fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts.headers }
  });
}

const STATUS_FILTERS = ['all', 'upcoming', 'live', 'completed'];
const FORMAT_LABELS  = { t20: 'T20', odi: 'ODI', test: 'Test', t10: 'T10', custom: 'Custom' };

export function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [filter, setFilter]           = useState('all');
  const [loading, setLoading]         = useState(true);
  const [showCreate, setShowCreate]   = useState(false);
  const [showJoin, setShowJoin]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = filter !== 'all' ? `?status=${filter}` : '';
      const r = await authFetch(`/tournaments${q}`);
      const d = await r.json();
      setTournaments(d.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Tournaments</div>
          <div className="page-subtitle">{tournaments.length} tournament{tournaments.length !== 1 ? 's' : ''} found</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost" onClick={() => setShowJoin(true)}>🔑 Join via Code</button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create Tournament</button>
        </div>
      </div>

      {/* Status Filters */}
      <div className="filter-pills">
        {STATUS_FILTERS.map(s => (
          <button key={s} className={`pill ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="spinner-container"><div className="spinner" /></div>
      ) : tournaments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏆</div>
          <h3>No tournaments found</h3>
          <p>Create your first tournament or join one with a code.</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Tournament</button>
        </div>
      ) : (
        <div className="grid-3">
          {tournaments.map(t => <TournamentCard key={t.tournament_id} t={t} />)}
        </div>
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onSaved={load} />}
      {showJoin   && <JoinModal   onClose={() => setShowJoin(false)}   onSaved={load} />}
    </div>
  );
}

function TournamentCard({ t }) {
  const statusBadge = { live: 'badge-live', upcoming: 'badge-upcoming', completed: 'badge-completed' }[t.status] || 'badge-upcoming';
  const fmtBadge    = { t20: 'badge-t20', odi: 'badge-odi', test: 'badge-test', t10: 'badge-t10' }[t.format] || 'badge-t20';
  const fmt = label => t[label] ? new Date(t[label]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD';

  return (
    <div className="tournament-card">
      <div className="tournament-card-top">
        <div className="tournament-card-badges">
          <span className={`badge ${statusBadge}`}>{t.status}</span>
          <span className={`badge ${fmtBadge}`}>{FORMAT_LABELS[t.format] || t.format}</span>
        </div>
        <div className="tournament-card-name">{t.tournament_name}</div>
        {t.location && (
          <div className="tournament-card-location">
            <span>📍</span> {t.location}
          </div>
        )}
      </div>
      <div className="tournament-card-body">
        <div className="tournament-card-meta">
          <div className="tournament-card-meta-item">
            <span>📅</span>
            {fmt('start_date')} — {fmt('end_date')}
          </div>
          <div className="tournament-card-meta-item">
            <span>🛡️</span>
            {t.team_count || t.total_teams || 0} teams
          </div>
          <div className="tournament-card-meta-item">
            <span>🏏</span>
            {t.overs_per_side || 20} overs
          </div>
        </div>
        {t.join_code && (
          <div className="tournament-card-code">
            🔑 {t.join_code}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Create Tournament Modal ─────────────────────────────────── */
function CreateModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    tournament_name: '', description: '', location: '',
    start_date: '', end_date: '', format: 't20', overs_per_side: 20,
    prize_money: '', sponsor_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await authFetch('/tournaments', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      const d = await r.json();
      if (d.success) { onSaved(); onClose(); }
      else setError(d.message || 'Failed to create tournament');
    } catch { setError('Network error. Try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Create Tournament</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-grid">
              <div className="form-group full">
                <label>Tournament Name *</label>
                <input value={form.tournament_name} onChange={set('tournament_name')} required placeholder="e.g. IPL 2025" />
              </div>
              <div className="form-group">
                <label>Format</label>
                <select value={form.format} onChange={set('format')}>
                  {['t20','odi','test','t10','custom'].map(f => (
                    <option key={f} value={f}>{FORMAT_LABELS[f] || f}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Overs per Side</label>
                <input type="number" value={form.overs_per_side} onChange={set('overs_per_side')} min={1} max={90} />
              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input type="date" value={form.start_date} onChange={set('start_date')} />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input type="date" value={form.end_date} onChange={set('end_date')} />
              </div>
              <div className="form-group full">
                <label>Location</label>
                <input value={form.location} onChange={set('location')} placeholder="City / Stadium" />
              </div>
              <div className="form-group full">
                <label>Description</label>
                <input value={form.description} onChange={set('description')} placeholder="Brief tournament description" />
              </div>
              <div className="form-group">
                <label>Sponsor Name</label>
                <input value={form.sponsor_name} onChange={set('sponsor_name')} placeholder="Optional" />
              </div>
              <div className="form-group">
                <label>Prize Money (₹)</label>
                <input type="number" value={form.prize_money} onChange={set('prize_money')} placeholder="Optional" min={0} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating…' : '🏆 Create Tournament'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Join Tournament Modal ───────────────────────────────────── */
function JoinModal({ onClose, onSaved }) {
  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [found, setFound]     = useState(null);

  const search = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setError(''); setFound(null); setLoading(true);
    try {
      const r = await authFetch('/tournaments/join', {
        method: 'POST',
        body: JSON.stringify({ join_code: code.trim().toUpperCase() })
      });
      const d = await r.json();
      if (d.success) { setFound(d.data); onSaved(); }
      else setError(d.message || 'Invalid join code');
    } catch { setError('Network error. Try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Join via Code</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={search}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            {found && (
              <div className="alert alert-success">
                ✅ Found: <strong>{found.tournament_name}</strong>
              </div>
            )}
            <div className="form-group">
              <label>Tournament Join Code</label>
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. A1B2C3D4"
                maxLength={8}
                style={{ letterSpacing: '3px', fontWeight: 700, fontSize: 18, textAlign: 'center' }}
                required
              />
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
              Get the 8-character code from the tournament organizer.
            </p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Searching…' : '🔑 Join Tournament'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
