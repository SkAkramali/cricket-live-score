import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function authFetch(path) {
  const token = localStorage.getItem('accessToken');
  return fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.json());
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

export function Scoreboard() {
  const [matches, setMatches]       = useState([]);
  const [matchId, setMatchId]       = useState('');
  const [scorecard, setScorecard]   = useState(null);
  const [loading, setLoading]       = useState(false);
  const [activeInnings, setActiveInnings] = useState(0);
  const [error, setError]           = useState('');

  useEffect(() => {
    // Use matches endpoint (no auth required per matchs.js router)
    authFetch('/matches')
      .then(d => setMatches(d.data || []))
      .catch(console.error);
  }, []);

  const loadScorecard = async (id) => {
    if (!id) return;
    setLoading(true); setError(''); setScorecard(null);
    try {
      // Correct endpoint: /api/analytics/match/:id/scorecard
      const d = await authFetch(`/analytics/match/${id}/scorecard`);
      if (d.success) {
        setScorecard(d.data);
        setActiveInnings(0);
      } else {
        setError(d.message || 'Failed to load scorecard');
      }
    } catch {
      setError('Network error. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Match Selector */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">📋 Select Match</span></div>
        <div className="card-body">
          {matches.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {matches.slice(0, 10).map(m => (
                <button
                  key={m.match_id}
                  className={`btn btn-sm ${matchId == m.match_id ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => { setMatchId(m.match_id); loadScorecard(m.match_id); }}
                >
                  {m.team1_name || 'T1'} vs {m.team2_name || 'T2'}
                  {m.status === 'live' && (
                    <span className="badge badge-live" style={{ marginLeft: 6, padding: '1px 6px' }}>Live</span>
                  )}
                </button>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="number"
              placeholder="Or enter Match ID"
              value={matchId}
              onChange={e => setMatchId(e.target.value)}
              style={{ maxWidth: 200 }}
            />
            <button
              className="btn btn-primary"
              onClick={() => loadScorecard(matchId)}
              disabled={loading || !matchId}
            >
              {loading ? 'Loading…' : 'Load Scorecard'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {loading && <div className="spinner-container"><div className="spinner" /></div>}

      {scorecard && (
        <ScorecardView
          scorecard={scorecard}
          activeInnings={activeInnings}
          onInningsChange={setActiveInnings}
        />
      )}

      {!scorecard && !loading && !error && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No scorecard loaded</h3>
          <p>Select a match above to view the full batting and bowling scorecard.</p>
        </div>
      )}
    </div>
  );
}

/* ── Scorecard View ─────────────────────────────────────────── */
function ScorecardView({ scorecard, activeInnings, onInningsChange }) {
  // Backend returns innings as [{ innings: {...}, batting: [...], bowling: [...] }]
  const rawInnings = scorecard.innings || [];
  const match      = scorecard.match;

  if (!rawInnings.length) return (
    <div className="empty-state">
      <div className="empty-state-icon">🏏</div>
      <h3>No innings data yet</h3>
      <p>This match hasn't started recording innings yet.</p>
    </div>
  );

  // Normalise — support both nested { innings, batting, bowling } and flat format
  const innings = rawInnings.map(entry =>
    entry.innings
      ? { ...entry.innings, batsmen: entry.batting || [], bowlers: entry.bowling || [] }
      : { ...entry, batsmen: entry.batsmen || entry.batting || [], bowlers: entry.bowlers || entry.bowling || [] }
  );

  const inn = innings[activeInnings];

  return (
    <div>
      {/* Match Banner */}
      {match && (
        <div className="score-panel" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ color: '#6ee7b7', fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 }}>
                Match Scorecard
              </div>
              <h2 style={{ color: 'white', fontSize: 20, margin: 0, fontWeight: 800 }}>
                {match.team1_name || 'Team 1'} vs {match.team2_name || 'Team 2'}
              </h2>
              {match.venue && (
                <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>📍 {match.venue}</div>
              )}
            </div>
            <span className={`badge ${match.status === 'live' ? 'badge-live' : 'badge-completed'}`}>
              {match.status}
            </span>
          </div>
          {(match.result || match.result_text) && (
            <div style={{ marginTop: 14, padding: '8px 14px', background: 'rgba(16,185,129,0.12)', borderRadius: 8, color: '#6ee7b7', fontSize: 14, fontWeight: 600 }}>
              🏆 {match.result || match.result_text}
            </div>
          )}
        </div>
      )}

      {/* Innings Tabs */}
      {innings.length > 1 && (
        <div className="tabs" style={{ marginBottom: 20 }}>
          {innings.map((item, i) => (
            <button
              key={i}
              className={`tab ${activeInnings === i ? 'active' : ''}`}
              onClick={() => onInningsChange(i)}
            >
              {item.batting_team_name || `Innings ${i + 1}`}
              <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 700, opacity: 0.8 }}>
                {item.total_runs}/{item.total_wickets} ({item.total_overs} ov)
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Score',    value: `${inn.total_runs}/${inn.total_wickets}` },
          { label: 'Overs',    value: inn.total_overs },
          { label: 'Run Rate', value: inn.total_overs > 0 ? (inn.total_runs / parseFloat(inn.total_overs)).toFixed(2) : '0.00' },
          { label: 'Extras',   value: inn.extras || inn.extras_total || 0 },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Batting Scorecard */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">🏏 Batting — {inn.batting_team_name || 'Batting Team'}</span>
        </div>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Batsman</th>
                <th style={{ minWidth: 120 }}>Dismissal</th>
                <th style={{ textAlign: 'right' }}>R</th>
                <th style={{ textAlign: 'right' }}>B</th>
                <th style={{ textAlign: 'right' }}>4s</th>
                <th style={{ textAlign: 'right' }}>6s</th>
                <th style={{ textAlign: 'right' }}>SR</th>
              </tr>
            </thead>
            <tbody>
              {(inn.batsmen || inn.batting || []).length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                    No batting data recorded yet
                  </td>
                </tr>
              ) : (inn.batsmen || inn.batting || []).map((b, i) => {
                const runs = b.runs_scored ?? b.runs ?? 0;
                const balls = b.balls_faced ?? b.balls ?? 0;
                return (
                  <tr key={i}>
                    <td>
                      <div className="td-name">{b.player_name || b.batsman_name || 'Unknown'}</div>
                      {b.is_not_out && <div style={{ fontSize: 11, color: 'var(--brand-dark)', fontWeight: 600 }}>not out</div>}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {b.dismissal || (b.is_not_out ? 'not out' : '—')}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 15 }}>{runs}</td>
                    <td style={{ textAlign: 'right' }} className="td-muted">{balls}</td>
                    <td style={{ textAlign: 'right' }} className="td-muted">{b.fours ?? 0}</td>
                    <td style={{ textAlign: 'right' }} className="td-muted">{b.sixes ?? 0}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="td-highlight">
                        {balls > 0 ? (runs / balls * 100).toFixed(1) : '0.0'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--border-light)' }}>
                <td colSpan={2} style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>Total</td>
                <td colSpan={5} style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {inn.total_runs}/{inn.total_wickets} ({inn.total_overs} ov) · Extras: {inn.extras || inn.extras_total || 0}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Bowling Scorecard */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">⚡ Bowling</span>
        </div>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Bowler</th>
                <th style={{ textAlign: 'right' }}>O</th>
                <th style={{ textAlign: 'right' }}>M</th>
                <th style={{ textAlign: 'right' }}>R</th>
                <th style={{ textAlign: 'right' }}>W</th>
                <th style={{ textAlign: 'right' }}>Wd</th>
                <th style={{ textAlign: 'right' }}>Nb</th>
                <th style={{ textAlign: 'right' }}>Econ</th>
              </tr>
            </thead>
            <tbody>
              {(inn.bowlers || []).length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                    No bowling data recorded yet
                  </td>
                </tr>
              ) : inn.bowlers.map((b, i) => {
                const runs = b.runs_conceded ?? 0;
                const overs = parseFloat(b.overs_bowled ?? 0);
                return (
                  <tr key={i}>
                    <td className="td-name">{b.player_name || 'Unknown'}</td>
                    <td style={{ textAlign: 'right' }} className="td-muted">{overs}</td>
                    <td style={{ textAlign: 'right' }} className="td-muted">{b.maidens ?? 0}</td>
                    <td style={{ textAlign: 'right' }}>{runs}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--live)' }}>{b.wickets_taken ?? 0}</td>
                    <td style={{ textAlign: 'right' }} className="td-muted">{b.wides ?? 0}</td>
                    <td style={{ textAlign: 'right' }} className="td-muted">{b.noballs ?? 0}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="td-highlight">
                        {overs > 0 ? (runs / overs).toFixed(2) : '0.00'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ball by Ball */}
      {inn.balls && inn.balls.length > 0 && (
        <div className="card">
          <div className="card-header"><span className="card-title">Ball by Ball</span></div>
          <div className="card-body">
            <div className="over-history">
              {groupByOver(inn.balls).map(({ over, balls }) => (
                <div key={over} className="over-row">
                  <div className="over-label">Ov {over + 1}</div>
                  <div className="balls">
                    {balls.map((b, i) => (
                      <div key={i} className={`ball-chip ${chipClass(b)}`} title={b.commentary || ''}>
                        {chipLabel(b)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
