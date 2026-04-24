import { useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function authFetch(path, opts = {}) {
  const token = localStorage.getItem('accessToken');
  return fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts.headers }
  });
}

const RUN_BTNS = [
  { label: '·', value: 0, cls: 'dot'   },
  { label: '1', value: 1, cls: 'run-1' },
  { label: '2', value: 2, cls: 'run-2' },
  { label: '3', value: 3, cls: 'run-3' },
  { label: '4', value: 4, cls: 'four'  },
  { label: '6', value: 6, cls: 'six'   },
];

const EXTRA_BTNS = [
  { label: 'WD',  extra_type: 'wide',    cls: 'wide'   },
  { label: 'NB',  extra_type: 'no-ball', cls: 'noball' },
  { label: 'BYE', extra_type: 'bye',     cls: 'bye'    },
  { label: 'LB',  extra_type: 'leg-bye', cls: 'legbye' },
];

const WICKET_TYPES = ['bowled','caught','lbw','run-out','stumped','hit-wicket','retired'];

function chipClass(b) {
  if (b.is_wicket) return 'wicket';
  if (b.extra_type === 'wide')    return 'wide';
  if (b.extra_type === 'no-ball') return 'noball';
  if (b.runs_scored === 4) return 'four';
  if (b.runs_scored === 6) return 'six';
  if (b.runs_scored === 0) return 'dot';
  return 'run';
}

function chipLabel(b) {
  if (b.is_wicket) return 'W';
  if (b.extra_type === 'wide')    return 'Wd';
  if (b.extra_type === 'no-ball') return 'Nb';
  if (b.runs_scored === 0) return '·';
  return b.runs_scored;
}

function groupByOver(balls = []) {
  const map = {};
  balls.forEach(b => {
    const o = b.over_number ?? 0;
    if (!map[o]) map[o] = [];
    map[o].push(b);
  });
  return Object.entries(map).map(([over, balls]) => ({ over: parseInt(over), balls }));
}

export function LiveScoring() {
  const [matches, setMatches]             = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [manualId, setManualId]           = useState('');
  const [innings, setInnings]             = useState(null);
  const [balls, setBalls]                 = useState([]);
  const [players, setPlayers]             = useState([]);
  const [loading, setLoading]             = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [flash, setFlash]                 = useState(null);

  // Scoring state
  const [batsmanId, setBatsmanId]   = useState('');
  const [bowlerId, setBowlerId]     = useState('');
  const [pendingRuns, setPendingRuns]   = useState(null);
  const [pendingExtra, setPendingExtra] = useState(null);
  const [wicketMode, setWicketMode]     = useState(false);
  const [wicketType, setWicketType]     = useState('');

  /* Fetch live matches on mount */
  useEffect(() => {
    authFetch('/matches?status=live')
      .then(r => r.json())
      .then(d => setMatches(d.data || []))
      .catch(console.error);
  }, []);

  /* Load match data when a match is selected */
  const loadMatch = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    setBalls([]); setInnings(null); setPlayers([]);
    try {
      // Get scorecard from analytics endpoint (correct URL)
      const [scorecardRes, matchRes] = await Promise.all([
        authFetch(`/analytics/match/${id}/scorecard`),
        authFetch(`/matches/${id}/summary`),
      ]);

      const sc = await scorecardRes.json();
      const mc = await matchRes.json();

      // Find the active (non-completed) innings
      const allInnings = sc.data?.innings || [];
      const active = allInnings.find(i => !i.is_completed) || allInnings[allInnings.length - 1] || null;
      setInnings(active);
      setBalls(active?.balls || sc.data?.balls || []);

      // Load players from both teams
      const match = mc.data || mc;
      const teamIds = [match?.team1_id, match?.team2_id].filter(Boolean);
      const all = [];
      for (const tid of teamIds) {
        try {
          const pr = await authFetch(`/teams/${tid}/players`);
          const pd = await pr.json();
          all.push(...(pd.data || []));
        } catch { /* ignore */ }
      }
      setPlayers(all);
    } catch (e) {
      console.error('Load match error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedMatch) loadMatch(selectedMatch);
  }, [selectedMatch, loadMatch]);

  /* Flash message helper */
  const showFlash = (text, type = 'success') => {
    setFlash({ text, type });
    setTimeout(() => setFlash(null), 3000);
  };

  /* Submit a delivery */
  const recordBall = async () => {
    if (!innings?.innings_id) {
      showFlash('No active innings found', 'error'); return;
    }
    setSubmitting(true);
    try {
      const payload = {
        match_id: parseInt(selectedMatch),
        innings_id: innings.innings_id,
        batsman_id: batsmanId || null,
        bowler_id: bowlerId || null,
        runs_scored: pendingRuns ?? 0,
        extras: pendingExtra ? 1 : 0,
        extra_type: pendingExtra || 'none',
        is_wicket: wicketMode,
        wicket_type: wicketMode ? (wicketType || 'bowled') : null,
      };
      const r = await authFetch('/scoring/ball', { method: 'POST', body: JSON.stringify(payload) });
      const d = await r.json();
      if (d.success) {
        const label = wicketMode ? '🚨 Wicket!' : pendingExtra ? pendingExtra.toUpperCase() : `${pendingRuns} run(s)`;
        showFlash(`✅ ${label} recorded`);
        setPendingRuns(null); setPendingExtra(null); setWicketMode(false); setWicketType('');
        loadMatch(selectedMatch);
      } else {
        showFlash(d.message || 'Failed to record ball', 'error');
      }
    } catch { showFlash('Network error', 'error'); }
    finally { setSubmitting(false); }
  };

  const hasPending = pendingRuns !== null || pendingExtra !== null;
  const overs = groupByOver(balls);

  return (
    <div>
      {/* ── Match Selector ─────────────────────────────── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">🔴 Select Live Match</span>
        </div>
        <div className="card-body">
          {matches.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {matches.map(m => (
                <button
                  key={m.match_id}
                  className={`btn ${selectedMatch == m.match_id ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                  onClick={() => setSelectedMatch(m.match_id)}
                >
                  {m.team1_name || 'Team 1'} vs {m.team2_name || 'Team 2'}
                </button>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="number"
              placeholder="Enter Match ID manually"
              value={manualId}
              onChange={e => setManualId(e.target.value)}
              style={{ maxWidth: 240 }}
            />
            <button
              className="btn btn-outline btn-sm"
              onClick={() => { if (manualId) setSelectedMatch(manualId); }}
            >
              Load
            </button>
          </div>
          {matches.length === 0 && !loading && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
              No live matches found. Enter a match ID manually, or start a match from the backend.
            </p>
          )}
        </div>
      </div>

      {loading && <div className="spinner-container"><div className="spinner" /></div>}

      {!loading && !selectedMatch && (
        <div className="empty-state">
          <div className="empty-state-icon">🎙️</div>
          <h3>No match selected</h3>
          <p>Select a live match above to start ball-by-ball scoring.</p>
        </div>
      )}

      {!loading && selectedMatch && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

          {/* ── Left column: score panel + controls ──── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Score Panel */}
            {innings ? (
              <div className="score-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: '#6ee7b7', fontWeight: 700, letterSpacing: 1 }}>
                    INNINGS {innings.innings_number || 1}
                  </span>
                  <span className="badge badge-live">LIVE</span>
                </div>
                <div className="score-panel-teams">
                  <div className="score-panel-team">
                    <div className="score-panel-team-name">Score</div>
                    <div className="score-panel-score">{innings.total_runs}/{innings.total_wickets}</div>
                    <div className="score-panel-overs">{innings.total_overs} overs</div>
                  </div>
                  <div className="score-panel-vs">·</div>
                  <div className="score-panel-team">
                    <div className="score-panel-team-name">Run Rate</div>
                    <div className="score-panel-score" style={{ fontSize: 28 }}>
                      {innings.total_overs > 0
                        ? (innings.total_runs / parseFloat(innings.total_overs)).toFixed(2)
                        : '0.00'}
                    </div>
                    <div className="score-panel-overs">current CRR</div>
                  </div>
                </div>
                <div className="score-panel-meta">
                  <div className="score-meta-item">
                    <div className="score-meta-label">Balls</div>
                    <div className="score-meta-value">{innings.total_balls || 0}</div>
                  </div>
                  <div className="score-meta-item">
                    <div className="score-meta-label">Extras</div>
                    <div className="score-meta-value">{innings.extras || 0}</div>
                  </div>
                  <div className="score-meta-item">
                    <div className="score-meta-label">Wickets</div>
                    <div className="score-meta-value">{innings.total_wickets}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="alert alert-error">No active innings for this match. Start an innings first.</div>
            )}

            {/* Flash */}
            {flash && (
              <div className={`alert ${flash.type === 'error' ? 'alert-error' : 'alert-success'}`}>
                {flash.text}
              </div>
            )}

            {/* Player Selectors */}
            <div className="card">
              <div className="card-header"><span className="card-title">Current Players</span></div>
              <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Batsman</label>
                  <select value={batsmanId} onChange={e => setBatsmanId(e.target.value)}>
                    <option value="">Select batsman</option>
                    {players.map(p => <option key={p.player_id} value={p.player_id}>{p.player_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Bowler</label>
                  <select value={bowlerId} onChange={e => setBowlerId(e.target.value)}>
                    <option value="">Select bowler</option>
                    {players.map(p => <option key={p.player_id} value={p.player_id}>{p.player_name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Run Buttons */}
            <div className="card">
              <div className="card-header"><span className="card-title">Runs</span></div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
                  {RUN_BTNS.map(rb => (
                    <button
                      key={rb.value}
                      className={`score-btn ${rb.cls}`}
                      style={{ outline: pendingRuns === rb.value && !pendingExtra ? '3px solid var(--brand)' : 'none', outlineOffset: 2 }}
                      onClick={() => { setPendingRuns(rb.value); setPendingExtra(null); setWicketMode(false); }}
                    >
                      {rb.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Extras */}
            <div className="card">
              <div className="card-header"><span className="card-title">Extras</span></div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {EXTRA_BTNS.map(eb => (
                    <button
                      key={eb.extra_type}
                      className={`score-btn ${eb.cls}`}
                      style={{ outline: pendingExtra === eb.extra_type ? '3px solid var(--brand)' : 'none', outlineOffset: 2 }}
                      onClick={() => { setPendingExtra(eb.extra_type); setPendingRuns(null); setWicketMode(false); }}
                    >
                      {eb.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Wicket */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Wicket</span>
                <button
                  className={`btn btn-sm ${wicketMode ? 'btn-danger' : 'btn-ghost'}`}
                  onClick={() => { setWicketMode(!wicketMode); if (wicketMode) setWicketType(''); }}
                >
                  {wicketMode ? '✓ Wicket ON' : '🚨 Mark as Wicket'}
                </button>
              </div>
              {wicketMode && (
                <div className="card-body">
                  <div className="form-group">
                    <label>Dismissal Type</label>
                    <select value={wicketType} onChange={e => setWicketType(e.target.value)}>
                      <option value="">Select dismissal</option>
                      {WICKET_TYPES.map(w => (
                        <option key={w} value={w} style={{ textTransform: 'capitalize' }}>{w}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm button */}
            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={!hasPending || submitting || !innings}
              onClick={recordBall}
            >
              {submitting ? 'Recording…' : hasPending
                ? `✅ Confirm — ${wicketMode ? 'WICKET + ' : ''}${pendingExtra ? pendingExtra.toUpperCase() : pendingRuns + ' run(s)'}`
                : 'Select runs or an extra first'
              }
            </button>
          </div>

          {/* ── Right column: over history ──────────── */}
          <div className="card" style={{ position: 'sticky', top: 80 }}>
            <div className="card-header"><span className="card-title">Over History</span></div>
            <div className="card-body" style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
              {overs.length === 0
                ? <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No balls bowled yet</div>
                : overs.slice().reverse().map(({ over, balls: overBalls }) => (
                    <div key={over} className="over-row">
                      <div className="over-label">Ov {over + 1}</div>
                      <div className="balls">
                        {overBalls.map((b, i) => (
                          <div key={i} className={`ball-chip ${chipClass(b)}`} title={b.commentary || ''}>
                            {chipLabel(b)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
