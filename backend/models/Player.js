// ============================================
// PLAYER MODEL
// Data access layer for player operations
// ============================================

const { getPool } = require('../database');

class Player {
  /**
   * Create a new player
   */
  static async create(playerData) {
    const pool = getPool();
    const {
      player_name,
      team_id,
      role,
      batting_style,
      bowling_style,
      jersey_number,
      date_of_birth,
      user_id
    } = playerData;

    const query = `
      INSERT INTO players (
        player_name, team_id, role, batting_style, bowling_style,
        jersey_number, date_of_birth, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      player_name,
      team_id || null,
      role,
      batting_style || 'right-hand',
      bowling_style || 'none',
      jersey_number || null,
      date_of_birth || null,
      user_id || null
    ]);

    return this.findById(result.insertId);
  }

  /**
   * Find player by ID
   */
  static async findById(id) {
    const pool = getPool();
    const query = `
      SELECT 
        p.*,
        t.team_name,
        t.team_short_name,
        u.username,
        u.email
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.team_id
      LEFT JOIN users u ON p.user_id = u.user_id
      WHERE p.player_id = ?
    `;

    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  /**
   * Get all players with optional filters
   */
  static async findAll(filters = {}) {
    const pool = getPool();
    let query = `
      SELECT 
        p.*,
        t.team_name,
        t.team_short_name
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.team_id
      WHERE 1=1
    `;

    const values = [];

    if (filters.team_id) {
      query += ' AND p.team_id = ?';
      values.push(filters.team_id);
    }

    if (filters.role) {
      query += ' AND p.role = ?';
      values.push(filters.role);
    }

    if (filters.player_name) {
      query += ' AND p.player_name LIKE ?';
      values.push(`%${filters.player_name}%`);
    }

    query += ' ORDER BY p.player_name ASC';

    const [rows] = await pool.execute(query, values);
    return rows;
  }

  /**
   * Update player
   */
  static async update(id, playerData) {
    const pool = getPool();
    const allowedFields = [
      'player_name', 'team_id', 'role', 'batting_style',
      'bowling_style', 'jersey_number', 'date_of_birth'
    ];

    const updates = [];
    const values = [];

    allowedFields.forEach(field => {
      if (playerData[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(playerData[field]);
      }
    });

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);
    const query = `UPDATE players SET ${updates.join(', ')} WHERE player_id = ?`;
    
    await pool.execute(query, values);
    return this.findById(id);
  }

  /**
   * Delete player
   */
  static async delete(id) {
    const pool = getPool();
    const query = 'DELETE FROM players WHERE player_id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  /**
   * Search players by name
   */
  static async search(searchTerm) {
    const pool = getPool();
    const query = `
      SELECT 
        p.*,
        t.team_name
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.team_id
      WHERE p.player_name LIKE ?
      ORDER BY p.player_name ASC
      LIMIT 20
    `;

    const term = `%${searchTerm}%`;
    const [rows] = await pool.execute(query, [term]);
    return rows;
  }

  /**
   * Get player career statistics
   */
  static async getCareerStats(playerId) {
    const pool = getPool();
    
    // Batting stats
    const battingQuery = `
      SELECT 
        COUNT(DISTINCT bs.match_id) as matches_played,
        SUM(bs.runs_scored) as total_runs,
        SUM(bs.balls_faced) as total_balls,
        ROUND(AVG(bs.runs_scored), 2) as average,
        MAX(bs.runs_scored) as highest_score,
        ROUND(SUM(bs.runs_scored) * 100.0 / NULLIF(SUM(bs.balls_faced), 0), 2) as strike_rate,
        SUM(bs.fours) as fours,
        SUM(bs.sixes) as sixes
      FROM batting_stats bs
      WHERE bs.player_id = ?
    `;

    // Bowling stats
    const bowlingQuery = `
      SELECT 
        COUNT(DISTINCT bw.match_id) as matches_played,
        SUM(bw.wickets_taken) as total_wickets,
        SUM(bw.runs_conceded) as runs_conceded,
        SUM(bw.overs_bowled) as total_overs,
        ROUND(SUM(bw.runs_conceded) / NULLIF(SUM(bw.wickets_taken), 0), 2) as bowling_average,
        ROUND(SUM(bw.runs_conceded) / NULLIF(SUM(bw.overs_bowled), 0), 2) as economy_rate,
        MAX(bw.wickets_taken) as best_bowling
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
   * Get recent matches for player
   */
  static async getRecentMatches(playerId, limit = 5) {
    const pool = getPool();
    const query = `
      SELECT DISTINCT
        m.match_id,
        m.match_code,
        m.match_date,
        m.venue,
        m.status,
        t1.team_name AS team1_name,
        t2.team_name AS team2_name,
        tw.team_name AS winner_name,
        m.result_text
      FROM matches m
      JOIN batting_stats bs ON m.match_id = bs.match_id
      JOIN teams t1 ON m.team1_id = t1.team_id
      JOIN teams t2 ON m.team2_id = t2.team_id
      LEFT JOIN teams tw ON m.winner_team_id = tw.team_id
      WHERE bs.player_id = ?
      ORDER BY m.match_date DESC
      LIMIT ?
    `;

    const [rows] = await pool.execute(query, [playerId, limit]);
    return rows;
  }
}

module.exports = Player;
