// ============================================
// TEAM MODEL
// Data access layer for team operations
// ============================================

const { getPool } = require('../database');

class Team {
  /**
   * Create a new team
   */
  static async create(teamData) {
    const pool = getPool();
    const {
      team_name,
      team_short_name,
      logo_url,
      tournament_id,
      created_by,
      home_ground
    } = teamData;

    const query = `
      INSERT INTO teams (team_name, team_short_name, logo_url, tournament_id, created_by, home_ground)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      team_name,
      team_short_name || null,
      logo_url || null,
      tournament_id || null,
      created_by || null,
      home_ground || null
    ]);

    return this.findById(result.insertId);
  }

  /**
   * Find team by ID
   */
  static async findById(id) {
    const pool = getPool();
    const query = `
      SELECT 
        t.*,
        u.username as creator_username,
        tr.tournament_name
      FROM teams t
      LEFT JOIN users u ON t.created_by = u.user_id
      LEFT JOIN tournaments tr ON t.tournament_id = tr.tournament_id
      WHERE t.team_id = ?
    `;

    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  /**
   * Get all teams with optional filters
   */
  static async findAll(filters = {}) {
    const pool = getPool();
    let query = `
      SELECT 
        t.*,
        tr.tournament_name,
        COUNT(DISTINCT p.player_id) as player_count
      FROM teams t
      LEFT JOIN tournaments tr ON t.tournament_id = tr.tournament_id
      LEFT JOIN players p ON t.team_id = p.team_id
      WHERE 1=1
    `;

    const values = [];

    if (filters.tournament_id) {
      query += ' AND t.tournament_id = ?';
      values.push(filters.tournament_id);
    }

    if (filters.team_name) {
      query += ' AND t.team_name LIKE ?';
      values.push(`%${filters.team_name}%`);
    }

    query += ' GROUP BY t.team_id ORDER BY t.team_name ASC';

    const [rows] = await pool.execute(query, values);
    return rows;
  }

  /**
   * Update team
   */
  static async update(id, teamData) {
    const pool = getPool();
    const allowedFields = [
      'team_name', 'team_short_name', 'logo_url', 
      'tournament_id', 'home_ground'
    ];

    const updates = [];
    const values = [];

    allowedFields.forEach(field => {
      if (teamData[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(teamData[field]);
      }
    });

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);
    const query = `UPDATE teams SET ${updates.join(', ')} WHERE team_id = ?`;
    
    await pool.execute(query, values);
    return this.findById(id);
  }

  /**
   * Delete team
   */
  static async delete(id) {
    const pool = getPool();
    const query = 'DELETE FROM teams WHERE team_id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  /**
   * Get players in a team
   */
  static async getPlayers(teamId) {
    const pool = getPool();
    const query = `
      SELECT 
        p.player_id,
        p.player_name,
        p.role,
        p.batting_style,
        p.bowling_style,
        p.jersey_number
      FROM players p
      WHERE p.team_id = ?
      ORDER BY p.player_name ASC
    `;

    const [rows] = await pool.execute(query, [teamId]);
    return rows;
  }

  /**
   * Add player to team
   */
  static async addPlayer(teamId, playerData) {
    const pool = getPool();
    const {
      player_name,
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
      teamId,
      role,
      batting_style || 'right-hand',
      bowling_style || 'none',
      jersey_number || null,
      date_of_birth || null,
      user_id || null
    ]);

    return { player_id: result.insertId };
  }

  /**
   * Search teams by name
   */
  static async search(searchTerm) {
    const pool = getPool();
    const query = `
      SELECT 
        t.*,
        tr.tournament_name
      FROM teams t
      LEFT JOIN tournaments tr ON t.tournament_id = tr.tournament_id
      WHERE t.team_name LIKE ? OR t.team_short_name LIKE ?
      ORDER BY t.team_name ASC
      LIMIT 20
    `;

    const term = `%${searchTerm}%`;
    const [rows] = await pool.execute(query, [term, term]);
    return rows;
  }

  /**
   * Get teams without tournament
   */
  static async getAvailableTeams() {
    const pool = getPool();
    const query = `
      SELECT t.*
      FROM teams t
      WHERE t.tournament_id IS NULL
      ORDER BY t.team_name ASC
    `;

    const [rows] = await pool.execute(query);
    return rows;
  }
}

module.exports = Team;
