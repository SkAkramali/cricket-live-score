// ============================================
// TOURNAMENT MODEL
// Data access layer for tournament operations
// ============================================

const { getPool } = require('../database');

class Tournament {
  /**
   * Create a new tournament
   */
  static async create(tournamentData) {
    const pool = getPool();
    const {
      tournament_name,
      description,
      location,
      start_date,
      end_date,
      format,
      overs_per_side,
      created_by,
      prize_money,
      sponsor_name,
      join_code
    } = tournamentData;

    const query = `
      INSERT INTO tournaments (
        tournament_name, description, location, start_date, end_date,
        format, overs_per_side, created_by, prize_money, sponsor_name, join_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      tournament_name,
      description || null,
      location || null,
      start_date,
      end_date,
      format || 't20',
      overs_per_side || 20,
      created_by || null,
      prize_money || null,
      sponsor_name || 'No Sponsor',
      join_code || null
    ]);

    return this.findById(result.insertId);
  }

  /**
   * Find tournament by ID
   */
  static async findById(id) {
    const pool = getPool();
    const query = `
      SELECT 
        t.*,
        u.username as creator_username,
        u.full_name as creator_name
      FROM tournaments t
      LEFT JOIN users u ON t.created_by = u.user_id
      WHERE t.tournament_id = ?
    `;

    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  /**
   * Get all tournaments with optional filters
   */
  static async findAll(filters = {}) {
    const pool = getPool();
    let query = `
      SELECT 
        t.*,
        COUNT(DISTINCT tt.team_id) as team_count,
        COUNT(DISTINCT m.match_id) as match_count
      FROM tournaments t
      LEFT JOIN tournament_teams tt ON t.tournament_id = tt.tournament_id
      LEFT JOIN matches m ON t.tournament_id = m.tournament_id
      WHERE 1=1
    `;

    const values = [];

    if (filters.status) {
      query += ' AND t.status = ?';
      values.push(filters.status);
    }

    if (filters.format) {
      query += ' AND t.format = ?';
      values.push(filters.format);
    }

    query += ' GROUP BY t.tournament_id ORDER BY t.start_date DESC';

    const [rows] = await pool.execute(query, values);
    return rows;
  }

  /**
   * Update tournament
   */
  static async update(id, tournamentData) {
    const pool = getPool();
    const allowedFields = [
      'tournament_name', 'description', 'location', 'start_date',
      'end_date', 'status', 'format', 'overs_per_side',
      'prize_money', 'sponsor_name'
    ];

    const updates = [];
    const values = [];

    allowedFields.forEach(field => {
      if (tournamentData[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(tournamentData[field]);
      }
    });

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);
    const query = `UPDATE tournaments SET ${updates.join(', ')} WHERE tournament_id = ?`;

    await pool.execute(query, values);
    return this.findById(id);
  }

  static async findByJoinCode(code) {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM tournaments WHERE join_code = ?',
      [code.toUpperCase()]
    );
    return rows[0] || null;
  }

  static async delete(id) {
    const pool = getPool();
    const query = 'DELETE FROM tournaments WHERE tournament_id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  /**
   * Add team to tournament
   */
  static async addTeam(tournamentId, teamId) {
    const pool = getPool();
    const query = `
      INSERT INTO tournament_teams (tournament_id, team_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE joined_at = CURRENT_TIMESTAMP
    `;

    await pool.execute(query, [tournamentId, teamId]);

    // Update tournament team count
    await this.updateTeamCount(tournamentId);

    return true;
  }

  /**
   * Remove team from tournament
   */
  static async removeTeam(tournamentId, teamId) {
    const pool = getPool();
    const query = 'DELETE FROM tournament_teams WHERE tournament_id = ? AND team_id = ?';
    await pool.execute(query, [tournamentId, teamId]);

    await this.updateTeamCount(tournamentId);
    return true;
  }

  /**
   * Get teams in tournament
   */
  static async getTeams(tournamentId) {
    const pool = getPool();
    const query = `
      SELECT 
        tm.team_id,
        tm.team_name,
        tm.team_short_name,
        tm.logo_url,
        tt.points,
        tt.played,
        tt.won,
        tt.lost,
        tt.tied,
        tt.no_result,
        tt.net_run_rate,
        tt.position
      FROM tournament_teams tt
      JOIN teams tm ON tt.team_id = tm.team_id
      WHERE tt.tournament_id = ?
      ORDER BY tt.points DESC, tt.net_run_rate DESC
    `;

    const [rows] = await pool.execute(query, [tournamentId]);
    return rows;
  }

  /**
   * Update team count for tournament
   */
  static async updateTeamCount(tournamentId) {
    const pool = getPool();
    const query = `
      UPDATE tournaments 
      SET total_teams = (
        SELECT COUNT(*) FROM tournament_teams WHERE tournament_id = ?
      )
      WHERE tournament_id = ?
    `;
    await pool.execute(query, [tournamentId, tournamentId]);
  }

  /**
   * Get points table for tournament
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
      ORDER BY tt.points DESC, tt.net_run_rate DESC
    `;

    const [rows] = await pool.execute(query, [tournamentId]);
    return rows;
  }

  /**
   * Update team stats in tournament
   */
  static async updateTeamStats(tournamentId, teamId, stats) {
    const pool = getPool();
    const query = `
      UPDATE tournament_teams 
      SET points = COALESCE(?, points),
          played = COALESCE(?, played),
          won = COALESCE(?, won),
          lost = COALESCE(?, lost),
          tied = COALESCE(?, tied),
          no_result = COALESCE(?, no_result),
          runs_for = COALESCE(?, runs_for),
          runs_against = COALESCE(?, runs_against),
          wickets_for = COALESCE(?, wickets_for),
          wickets_against = COALESCE(?, wickets_against),
          net_run_rate = COALESCE(?, net_run_rate)
      WHERE tournament_id = ? AND team_id = ?
    `;

    await pool.execute(query, [
      stats.points, stats.played, stats.won, stats.lost,
      stats.tied, stats.no_result, stats.runs_for, stats.runs_against,
      stats.wickets_for, stats.wickets_against, stats.net_run_rate,
      tournamentId, teamId
    ]);
  }
}

module.exports = Tournament;
