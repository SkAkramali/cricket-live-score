// ============================================
// INNINGS MODEL
// Data access layer for innings operations
// ============================================

const { getPool } = require('../database');

class Innings {
  /**
   * Create a new innings
   */
  static async create(inningsData) {
    const pool = getPool();
    const {
      match_id,
      batting_team_id,
      bowling_team_id,
      innings_number
    } = inningsData;

    const query = `
      INSERT INTO innings (
        match_id, batting_team_id, bowling_team_id, innings_number
      ) VALUES (?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      match_id,
      batting_team_id,
      bowling_team_id,
      innings_number
    ]);

    return this.findById(result.insertId);
  }

  /**
   * Find innings by ID
   */
  static async findById(id) {
    const pool = getPool();
    const query = `
      SELECT 
        i.*,
        bt.team_name AS batting_team_name,
        bwt.team_name AS bowling_team_name
      FROM innings i
      LEFT JOIN teams bt ON i.batting_team_id = bt.team_id
      LEFT JOIN teams bwt ON i.bowling_team_id = bwt.team_id
      WHERE i.innings_id = ?
    `;

    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  /**
   * Get innings by match
   */
  static async getByMatch(matchId) {
    const pool = getPool();
    const query = `
      SELECT 
        i.*,
        bt.team_name AS batting_team_name,
        bwt.team_name AS bowling_team_name
      FROM innings i
      LEFT JOIN teams bt ON i.batting_team_id = bt.team_id
      LEFT JOIN teams bwt ON i.bowling_team_id = bwt.team_id
      WHERE i.match_id = ?
      ORDER BY i.innings_number
    `;

    const [rows] = await pool.execute(query, [matchId]);
    return rows;
  }

  /**
   * Update innings score
   */
  static async updateScore(inningsId, updates) {
    const pool = getPool();
    const {
      total_runs,
      total_wickets,
      total_overs,
      extras_total,
      extras_wides,
      extras_noballs,
      extras_byes,
      extras_legbyes
    } = updates;

    const allowedFields = [
      'total_runs', 'total_wickets', 'total_overs',
      'extras_total', 'extras_wides', 'extras_noballs',
      'extras_byes', 'extras_legbyes', 'target_runs', 'is_completed'
    ];

    const setClause = [];
    const values = [];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        setClause.push(`${field} = COALESCE(?, ${field})`);
        values.push(updates[field]);
      }
    });

    values.push(inningsId);
    const query = `UPDATE innings SET ${setClause.join(', ')} WHERE innings_id = ?`;
    
    await pool.execute(query, values);
    return this.findById(inningsId);
  }

  /**
   * Complete innings
   */
  static async complete(inningsId) {
    const pool = getPool();
    const query = `
      UPDATE innings 
      SET is_completed = TRUE 
      WHERE innings_id = ?
    `;
    
    await pool.execute(query, [inningsId]);
    return this.findById(inningsId);
  }

  /**
   * Calculate run rate
   */
  static async calculateRunRate(inningsId) {
    const innings = await this.findById(inningsId);
    if (!innings || innings.total_overs === 0) {
      return 0;
    }
    return (innings.total_runs / innings.total_overs).toFixed(2);
  }

  /**
   * Get batting stats for innings
   */
  static async getBattingStats(inningsId) {
    const pool = getPool();
    const query = `
      SELECT 
        bs.*,
        p.player_name,
        p.jersey_number,
        dp.player_name AS dismissed_by_name
      FROM batting_stats bs
      JOIN players p ON bs.player_id = p.player_id
      LEFT JOIN players dp ON bs.dismissed_by_player_id = dp.player_id
      WHERE bs.innings_id = ?
      ORDER BY bs.position ASC
    `;

    const [rows] = await pool.execute(query, [inningsId]);
    return rows;
  }

  /**
   * Get bowling stats for innings
   */
  static async getBowlingStats(inningsId) {
    const pool = getPool();
    const query = `
      SELECT 
        bw.*,
        p.player_name,
        p.jersey_number
      FROM bowling_stats bw
      JOIN players p ON bw.player_id = p.player_id
      WHERE bw.innings_id = ?
      ORDER BY bw.overs_bowled DESC
    `;

    const [rows] = await pool.execute(query, [inningsId]);
    return rows;
  }

  /**
   * Add batsman to innings
   */
  static async addBatsman(inningsId, playerId, position) {
    const pool = getPool();
    const query = `
      INSERT INTO batting_stats (innings_id, player_id, position)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE position = ?
    `;

    await pool.execute(query, [inningsId, playerId, position, position]);
    return true;
  }

  /**
   * Add bowler to innings
   */
  static async addBowler(inningsId, playerId) {
    const pool = getPool();
    const query = `
      INSERT INTO bowling_stats (innings_id, player_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE player_id = ?
    `;

    await pool.execute(query, [inningsId, playerId, playerId]);
    return true;
  }

  /**
   * Get current partnership
   */
  static async getCurrentPartnership(inningsId) {
    const pool = getPool();
    const query = `
      SELECT 
        ps.*,
        p1.player_name AS batsman1_name,
        p2.player_name AS batsman2_name
      FROM partnerships ps
      JOIN players p1 ON ps.batsman1_id = p1.player_id
      JOIN players p2 ON ps.batsman2_id = p2.player_id
      WHERE ps.innings_id = ? AND ps.is_active = TRUE
      LIMIT 1
    `;

    const [rows] = await pool.execute(query, [inningsId]);
    return rows[0] || null;
  }
}

module.exports = Innings;
