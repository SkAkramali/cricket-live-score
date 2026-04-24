// ============================================
// ANALYTICS MODEL
// Data access layer for statistics and analytics
// ============================================

const { getPool } = require('../database');

class Analytics {
  /**
   * Get top run scorers (leaderboard)
   */
  static async getTopRunScorers(limit = 10, filters = {}) {
    const pool = getPool();
    
    let query = `
      SELECT 
        p.player_id,
        p.player_name,
        t.team_name,
        t.team_short_name,
        SUM(bs.runs_scored) AS total_runs,
        COUNT(DISTINCT bs.match_id) AS innings,
        AVG(bs.runs_scored) AS average,
        MAX(bs.runs_scored) AS highest_score,
        SUM(bs.fours) AS fours,
        SUM(bs.sixes) AS sixes,
        ROUND(SUM(bs.runs_scored) * 100.0 / NULLIF(SUM(bs.balls_faced), 0), 2) AS strike_rate
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.team_id
      LEFT JOIN batting_stats bs ON p.player_id = bs.player_id
    `;

    const whereClauses = [];
    const values = [];

    if (filters.tournament_id) {
      whereClauses.push('bs.match_id IN (SELECT match_id FROM matches WHERE tournament_id = ?)');
      values.push(filters.tournament_id);
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += `
      GROUP BY p.player_id, p.player_name, t.team_name, t.team_short_name
      HAVING total_runs > 0
      ORDER BY total_runs DESC, strike_rate DESC
      LIMIT ?
    `;

    values.push(limit);
    const [rows] = await pool.execute(query, values);
    return rows;
  }

  /**
   * Get top wicket takers (leaderboard)
   */
  static async getTopWicketTakers(limit = 10, filters = {}) {
    const pool = getPool();
    
    let query = `
      SELECT 
        p.player_id,
        p.player_name,
        t.team_name,
        t.team_short_name,
        SUM(bw.wickets_taken) AS total_wickets,
        COUNT(DISTINCT bw.match_id) AS matches,
        SUM(bw.runs_conceded) AS runs_conceded,
        SUM(bw.overs_bowled) AS overs_bowled,
        ROUND(SUM(bw.runs_conceded) / NULLIF(SUM(bw.wickets_taken), 0), 2) AS average,
        ROUND(SUM(bw.runs_conceded) / NULLIF(SUM(bw.overs_bowled), 0), 2) AS economy_rate,
        MAX(bw.wickets_taken) AS best_bowling
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.team_id
      LEFT JOIN bowling_stats bw ON p.player_id = bw.player_id
    `;

    const whereClauses = [];
    const values = [];

    if (filters.tournament_id) {
      whereClauses.push('bw.match_id IN (SELECT match_id FROM matches WHERE tournament_id = ?)');
      values.push(filters.tournament_id);
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += `
      GROUP BY p.player_id, p.player_name, t.team_name, t.team_short_name
      HAVING total_wickets > 0
      ORDER BY total_wickets DESC, average ASC
      LIMIT ?
    `;

    values.push(limit);
    const [rows] = await pool.execute(query, values);
    return rows;
  }

  /**
   * Get tournament points table
   */
  static async getPointsTable(tournamentId) {
    const pool = getPool();
    const query = `
      SELECT 
        tm.team_id,
        tm.team_name,
        tm.team_short_name,
        tt.points,
        tt.played,
        tt.won,
        tt.lost,
        tt.tied,
        tt.no_result,
        tt.runs_for,
        tt.runs_against,
        tt.wickets_for,
        tt.wickets_against,
        tt.net_run_rate,
        tt.position,
        CASE 
          WHEN tt.won > 0 THEN ROUND((tt.won * 100.0 / tt.played), 2)
          ELSE 0 
        END AS win_percentage
      FROM tournament_teams tt
      JOIN teams tm ON tt.team_id = tm.team_id
      WHERE tt.tournament_id = ?
      ORDER BY tt.points DESC, tt.net_run_rate DESC, tt.won DESC
    `;

    const [rows] = await pool.execute(query, [tournamentId]);
    return rows;
  }

  /**
   * Get player detailed stats
   */
  static async getPlayerStats(playerId) {
    const pool = getPool();
    
    // Batting career stats
    const battingQuery = `
      SELECT 
        COUNT(DISTINCT bs.match_id) AS matches,
        SUM(bs.runs_scored) AS runs,
        SUM(bs.balls_faced) AS balls,
        AVG(bs.runs_scored) AS average,
        MAX(bs.runs_scored) AS highest_score,
        ROUND(SUM(bs.runs_scored) * 100.0 / NULLIF(SUM(bs.balls_faced), 0), 2) AS strike_rate,
        SUM(bs.fours) AS fours,
        SUM(bs.sixes) AS sixes,
        COUNT(CASE WHEN bs.dismissal_type != 'not-out' THEN 1 END) AS dismissals
      FROM batting_stats bs
      WHERE bs.player_id = ?
    `;

    // Bowling career stats
    const bowlingQuery = `
      SELECT 
        COUNT(DISTINCT bw.match_id) AS matches,
        SUM(bw.wickets_taken) AS wickets,
        SUM(bw.runs_conceded) AS runs,
        SUM(bw.overs_bowled) AS overs,
        ROUND(SUM(bw.runs_conceded) / NULLIF(SUM(bw.wickets_taken), 0), 2) AS average,
        ROUND(SUM(bw.runs_conceded) / NULLIF(SUM(bw.overs_bowled), 0), 2) AS economy,
        MAX(bw.wickets_taken) AS best_bowling
      FROM bowling_stats bw
      WHERE bw.player_id = ?
    `;

    const [battingStats] = await pool.execute(battingQuery, [playerId]);
    const [bowlingStats] = await pool.execute(bowlingQuery, [playerId]);

    return {
      batting: battingStats[0] || {},
      bowling: bowlingStats[0] || {}
    };
  }

  /**
   * Get match history
   */
  static async getMatchHistory(limit = 20, filters = {}) {
    const pool = getPool();
    
    let query = `
      SELECT 
        m.match_id,
        m.match_code,
        m.match_date,
        m.venue,
        m.status,
        t1.team_name AS team1_name,
        t2.team_name AS team2_name,
        tw.team_name AS winner_name,
        m.result_text,
        tr.tournament_name
      FROM matches m
      LEFT JOIN teams t1 ON m.team1_id = t1.team_id
      LEFT JOIN teams t2 ON m.team2_id = t2.team_id
      LEFT JOIN teams tw ON m.winner_team_id = tw.team_id
      LEFT JOIN tournaments tr ON m.tournament_id = tr.tournament_id
      WHERE 1=1
    `;

    const values = [];

    if (filters.tournament_id) {
      query += ' AND m.tournament_id = ?';
      values.push(filters.tournament_id);
    }

    if (filters.team_id) {
      query += ' AND (m.team1_id = ? OR m.team2_id = ?)';
      values.push(filters.team_id, filters.team_id);
    }

    if (filters.status) {
      query += ' AND m.status = ?';
      values.push(filters.status);
    }

    query += ' ORDER BY m.match_date DESC LIMIT ?';
    values.push(limit);

    const [rows] = await pool.execute(query, values);
    return rows;
  }

  /**
   * Get team stats in tournament
   */
  static async getTeamStats(teamId, tournamentId) {
    const pool = getPool();
    const query = `
      SELECT 
        tm.team_name,
        tt.points,
        tt.played,
        tt.won,
        tt.lost,
        tt.tied,
        tt.no_result,
        tt.runs_for,
        tt.runs_against,
        tt.wickets_for,
        tt.wickets_against,
        tt.net_run_rate,
        tt.position
      FROM tournament_teams tt
      JOIN teams tm ON tt.team_id = tm.team_id
      WHERE tt.team_id = ? AND tt.tournament_id = ?
    `;

    const [rows] = await pool.execute(query, [teamId, tournamentId]);
    return rows[0] || {};
  }

  /**
   * Get most sixes
   */
  static async getMostSixes(limit = 10) {
    const pool = getPool();
    const query = `
      SELECT 
        p.player_name,
        t.team_name,
        SUM(bs.sixes) AS total_sixes
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.team_id
      LEFT JOIN batting_stats bs ON p.player_id = bs.player_id
      GROUP BY p.player_id, p.player_name, t.team_name
      HAVING total_sixes > 0
      ORDER BY total_sixes DESC
      LIMIT ?
    `;

    const [rows] = await pool.execute(query, [limit]);
    return rows;
  }

  /**
   * Get most fours
   */
  static async getMostFours(limit = 10) {
    const pool = getPool();
    const query = `
      SELECT 
        p.player_name,
        t.team_name,
        SUM(bs.fours) AS total_fours
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.team_id
      LEFT JOIN batting_stats bs ON p.player_id = bs.player_id
      GROUP BY p.player_id, p.player_name, t.team_name
      HAVING total_fours > 0
      ORDER BY total_fours DESC
      LIMIT ?
    `;

    const [rows] = await pool.execute(query, [limit]);
    return rows;
  }

  /**
   * Get best strike rates (min 50 balls)
   */
  static async getBestStrikeRates(minBalls = 50, limit = 10) {
    const pool = getPool();
    const query = `
      SELECT 
        p.player_name,
        t.team_name,
        SUM(bs.runs_scored) AS runs,
        SUM(bs.balls_faced) AS balls,
        ROUND(SUM(bs.runs_scored) * 100.0 / SUM(bs.balls_faced), 2) AS strike_rate
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.team_id
      LEFT JOIN batting_stats bs ON p.player_id = bs.player_id
      GROUP BY p.player_id, p.player_name, t.team_name
      HAVING SUM(bs.balls_faced) >= ?
      ORDER BY strike_rate DESC
      LIMIT ?
    `;

    const [rows] = await pool.execute(query, [minBalls, limit]);
    return rows;
  }

  /**
   * Get best economy rates (min 10 overs)
   */
  static async getBestEconomyRates(minOvers = 10, limit = 10) {
    const pool = getPool();
    const query = `
      SELECT 
        p.player_name,
        t.team_name,
        SUM(bw.runs_conceded) AS runs,
        SUM(bw.overs_bowled) AS overs,
        ROUND(SUM(bw.runs_conceded) / SUM(bw.overs_bowled), 2) AS economy
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.team_id
      LEFT JOIN bowling_stats bw ON p.player_id = bw.player_id
      GROUP BY p.player_id, p.player_name, t.team_name
      HAVING SUM(bw.overs_bowled) >= ?
      ORDER BY economy ASC
      LIMIT ?
    `;

    const [rows] = await pool.execute(query, [minOvers, limit]);
    return rows;
  }
}

module.exports = Analytics;
