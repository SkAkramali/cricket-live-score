// ============================================
// SCORE MODEL
// Data access layer for ball-by-ball scoring
// ============================================

const { getPool } = require('../database');

class Score {
  /**
   * Record a ball event
   */
  static async addBall(ballData) {
    const pool = getPool();
    const {
      match_id,
      innings_id,
      over_number,
      ball_number,
      batsman_id,
      bowler_id,
      non_striker_id,
      runs_scored,
      extras,
      extra_type,
      is_wicket,
      wicket_type,
      dismissed_player_id,
      fielder_id,
      ball_type,
      commentary
    } = ballData;

    const query = `
      INSERT INTO ball_by_ball (
        match_id, innings_id, over_number, ball_number,
        batsman_id, bowler_id, non_striker_id,
        runs_scored, extras, extra_type,
        is_wicket, wicket_type, dismissed_player_id, fielder_id,
        ball_type, commentary
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      match_id,
      innings_id,
      over_number,
      ball_number,
      batsman_id,
      bowler_id,
      non_striker_id,
      runs_scored || 0,
      extras || 0,
      extra_type || 'none',
      is_wicket || false,
      wicket_type || 'none',
      dismissed_player_id || null,
      fielder_id || null,
      ball_type || 'legal',
      commentary || null
    ]);

    return { ball_id: result.insertId };
  }

  /**
   * Get balls for an over
   */
  static async getOverBalls(inningsId, overNumber) {
    const pool = getPool();
    const query = `
      SELECT 
        b.*,
        bat.player_name AS batsman_name,
        bowl.player_name AS bowler_name,
        ns.player_name AS non_striker_name,
        dp.player_name AS dismissed_name,
        f.player_name AS fielder_name
      FROM ball_by_ball b
      JOIN players bat ON b.batsman_id = bat.player_id
      JOIN players bowl ON b.bowler_id = bowl.player_id
      JOIN players ns ON b.non_striker_id = ns.player_id
      LEFT JOIN players dp ON b.dismissed_player_id = dp.player_id
      LEFT JOIN players f ON b.fielder_id = f.player_id
      WHERE b.innings_id = ? AND b.over_number = ?
      ORDER BY b.ball_number ASC
    `;

    const [rows] = await pool.execute(query, [inningsId, overNumber]);
    return rows;
  }

  /**
   * Get all balls for innings
   */
  static async getInningsBalls(inningsId) {
    const pool = getPool();
    const query = `
      SELECT 
        b.*,
        bat.player_name AS batsman_name,
        bowl.player_name AS bowler_name
      FROM ball_by_ball b
      JOIN players bat ON b.batsman_id = bat.player_id
      JOIN players bowl ON b.bowler_id = bowl.player_id
      WHERE b.innings_id = ?
      ORDER BY b.over_number ASC, b.ball_number ASC
    `;

    const [rows] = await pool.execute(query, [inningsId]);
    return rows;
  }

  /**
   * Update batsman stats on ball
   */
  static async updateBatsmanStats(inningsId, playerId, runs, balls, fours = 0, sixes = 0) {
    const pool = getPool();
    const query = `
      INSERT INTO batting_stats (innings_id, player_id, runs_scored, balls_faced, fours, sixes)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        runs_scored = runs_scored + ?,
        balls_faced = balls_faced + ?,
        fours = fours + ?,
        sixes = sixes + ?,
        strike_rate = ((runs_scored + ?) * 100.0 / NULLIF((balls_faced + ?), 0))
    `;

    await pool.execute(query, [
      inningsId, playerId, runs, balls, fours, sixes,
      runs, balls, fours, sixes, runs, balls
    ]);
  }

  /**
   * Update bowler stats on ball
   */
  static async updateBowlerStats(inningsId, playerId, runs, isWicket, isWide, isNoBall) {
    const pool = getPool();
    
    // Calculate overs to add (0 for wide/noball, 1 for legal ball)
    const oversToAdd = (isWide || isNoBall) ? 0 : 1;
    
    const query = `
      INSERT INTO bowling_stats (innings_id, player_id, runs_conceded, wickets_taken)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        runs_conceded = runs_conceded + ?,
        wickets_taken = wickets_taken + ?,
        economy_rate = ((runs_conceded + ?) / NULLIF(((SELECT SUM(overs_bowled) FROM bowling_stats WHERE innings_id = ? AND player_id = ?) + ? / 6.0), 0))
    `;

    await pool.execute(query, [
      inningsId, playerId, runs, isWicket ? 1 : 0,
      runs, isWicket ? 1 : 0,
      inningsId, playerId, oversToAdd
    ]);
  }

  /**
   * Record dismissal
   */
  static async recordDismissal(inningsId, playerId, dismissalType, dismissedBy, fielder) {
    const pool = getPool();
    const query = `
      UPDATE batting_stats 
      SET dismissal_type = ?,
          dismissed_by_player_id = ?,
          fielder_player_id = ?
      WHERE innings_id = ? AND player_id = ?
    `;

    await pool.execute(query, [dismissalType, dismissedBy, fielder, inningsId, playerId]);
  }

  /**
   * Create/update partnership
   */
  static async updatePartnership(inningsId, batsman1Id, batsman2Id, runs, balls) {
    const pool = getPool();
    
    // Check if active partnership exists
    const checkQuery = `
      SELECT partnership_id FROM partnerships 
      WHERE innings_id = ? AND is_active = TRUE
      LIMIT 1
    `;
    
    const [existing] = await pool.execute(checkQuery, [inningsId]);
    
    if (existing.length > 0) {
      // Update existing partnership
      const updateQuery = `
        UPDATE partnerships 
        SET runs = runs + ?, balls = balls + ?
        WHERE partnership_id = ?
      `;
      await pool.execute(updateQuery, [runs, balls, existing[0].partnership_id]);
    } else {
      // Create new partnership
      const insertQuery = `
        INSERT INTO partnerships (innings_id, match_id, batsman1_id, batsman2_id, runs, balls)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await pool.execute(insertQuery, [inningsId, inningsId, batsman1Id, batsman2Id, runs, balls]);
    }
  }

  /**
   * Get current score summary
   */
  static async getCurrentScore(inningsId) {
    const pool = getPool();
    const query = `
      SELECT 
        i.total_runs,
        i.total_wickets,
        i.total_overs,
        i.extras_total,
        ROUND(i.total_runs / NULLIF(i.total_overs, 0), 2) AS run_rate,
        i.target_runs
      FROM innings i
      WHERE i.innings_id = ?
    `;

    const [rows] = await pool.execute(query, [inningsId]);
    return rows[0] || {};
  }

  /**
   * Get recent balls (last 6 overs or so)
   */
  static async getRecentBalls(inningsId, limit = 36) {
    const pool = getPool();
    const query = `
      SELECT 
        b.*,
        CONCAT(b.over_number, '.', b.ball_number) AS ball_display
      FROM ball_by_ball b
      WHERE b.innings_id = ?
      ORDER BY b.over_number DESC, b.ball_number DESC
      LIMIT ?
    `;

    const [rows] = await pool.execute(query, [inningsId, limit]);
    return rows.reverse();
  }

  /**
   * Delete ball event
   */
  static async deleteBall(ballId) {
    const pool = getPool();
    const query = 'DELETE FROM ball_by_ball WHERE ball_id = ?';
    const [result] = await pool.execute(query, [ballId]);
    return result.affectedRows > 0;
  }
}

module.exports = Score;
