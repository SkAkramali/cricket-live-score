// ============================================
// MATCH MODEL
// Data access layer for match operations
// ============================================

const { getPool } = require('../database');

class Match {
  /**
   * Create a new match
   */
  static async create(matchData) {
    const pool = getPool();
    const {
      match_code,
      team1_id,
      team2_id,
      tournament_id,
      match_date,
      venue,
      overs_per_side,
      match_type,
      created_by
    } = matchData;

    const query = `
      INSERT INTO matches (
        match_code, team1_id, team2_id, tournament_id, match_date, 
        venue, overs_per_side, match_type, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)
    `;

    const [result] = await pool.execute(query, [
      match_code,
      team1_id,
      team2_id,
      tournament_id || null,
      match_date,
      venue || null,
      overs_per_side || 20,
      match_type || 't20',
      created_by
    ]);

    return this.findById(result.insertId);
  }

  /**
   * Find match by ID
   */
  static async findById(id) {
    const pool = getPool();
    const query = `
      SELECT 
        m.*,
        t1.team_name AS team1_name,
        t1.team_short_name AS team1_short,
        t2.team_name AS team2_name,
        t2.team_short_name AS team2_short,
        tw.team_name AS toss_winner_name,
        bt.team_name AS batting_first_name,
        wt.team_name AS winner_name,
        tr.tournament_name
      FROM matches m
      LEFT JOIN teams t1 ON m.team1_id = t1.team_id
      LEFT JOIN teams t2 ON m.team2_id = t2.team_id
      LEFT JOIN teams tw ON m.toss_winner_team_id = tw.team_id
      LEFT JOIN teams bt ON m.batting_first_team_id = bt.team_id
      LEFT JOIN teams wt ON m.winner_team_id = wt.team_id
      LEFT JOIN tournaments tr ON m.tournament_id = tr.tournament_id
      WHERE m.match_id = ?
    `;

    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  /**
   * Find match by code
   */
  static async findByCode(code) {
    const pool = getPool();
    const query = `
      SELECT 
        m.*,
        t1.team_name AS team1_name,
        t1.team_short_name AS team1_short,
        t2.team_name AS team2_name,
        t2.team_short_name AS team2_short,
        tw.team_name AS toss_winner_name,
        bt.team_name AS batting_first_name,
        wt.team_name AS winner_name,
        tr.tournament_name
      FROM matches m
      LEFT JOIN teams t1 ON m.team1_id = t1.team_id
      LEFT JOIN teams t2 ON m.team2_id = t2.team_id
      LEFT JOIN teams tw ON m.toss_winner_team_id = tw.team_id
      LEFT JOIN teams bt ON m.batting_first_team_id = bt.team_id
      LEFT JOIN teams wt ON m.winner_team_id = wt.team_id
      LEFT JOIN tournaments tr ON m.tournament_id = tr.tournament_id
      WHERE m.match_code = ?
    `;

    const [rows] = await pool.execute(query, [code]);
    return rows[0] || null;
  }

  /**
   * Get all matches with filters
   */
  static async findAll(filters = {}) {
    const pool = getPool();
    let query = `
      SELECT 
        m.*,
        t1.team_name AS team1_name,
        t2.team_name AS team2_name,
        wt.team_name AS winner_name,
        tr.tournament_name
      FROM matches m
      LEFT JOIN teams t1 ON m.team1_id = t1.team_id
      LEFT JOIN teams t2 ON m.team2_id = t2.team_id
      LEFT JOIN teams wt ON m.winner_team_id = wt.team_id
      LEFT JOIN tournaments tr ON m.tournament_id = tr.tournament_id
      WHERE 1=1
    `;

    const values = [];

    if (filters.status) {
      query += ' AND m.status = ?';
      values.push(filters.status);
    }

    if (filters.tournament_id) {
      query += ' AND m.tournament_id = ?';
      values.push(filters.tournament_id);
    }

    if (filters.team_id) {
      query += ' AND (m.team1_id = ? OR m.team2_id = ?)';
      values.push(filters.team_id, filters.team_id);
    }

    query += ' ORDER BY m.match_date DESC';

    const [rows] = await pool.execute(query, values);
    return rows;
  }

  /**
   * Update match
   */
  static async update(id, matchData) {
    const pool = getPool();
    const allowedFields = [
      'tournament_id', 'match_date', 'venue', 'overs_per_side',
      'status', 'toss_winner_team_id', 'toss_decision',
      'batting_first_team_id', 'winner_team_id', 'result_text'
    ];

    const updates = [];
    const values = [];

    allowedFields.forEach(field => {
      if (matchData[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(matchData[field]);
      }
    });

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);
    const query = `UPDATE matches SET ${updates.join(', ')} WHERE match_id = ?`;
    
    await pool.execute(query, values);
    return this.findById(id);
  }

  /**
   * Delete match
   */
  static async delete(id) {
    const pool = getPool();
    const query = 'DELETE FROM matches WHERE match_id = ?';
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  /**
   * Start match (toss completed)
   */
  static async startMatch(matchId, tossWinnerId, tossDecision) {
    const pool = getPool();
    
    // Determine batting first team
    const match = await this.findById(matchId);
    const battingFirstId = tossDecision === 'bat' ? tossWinnerId : 
                            (tossWinnerId === match.team1_id ? match.team2_id : match.team1_id);

    const query = `
      UPDATE matches 
      SET status = 'live',
          toss_winner_team_id = ?,
          toss_decision = ?,
          batting_first_team_id = ?
      WHERE match_id = ?
    `;

    await pool.execute(query, [tossWinnerId, tossDecision, battingFirstId, matchId]);
    return this.findById(matchId);
  }

  /**
   * Complete match
   */
  static async completeMatch(matchId, winnerId, resultText) {
    const pool = getPool();
    const query = `
      UPDATE matches 
      SET status = 'completed',
          winner_team_id = ?,
          result_text = ?
      WHERE match_id = ?
    `;

    await pool.execute(query, [winnerId, resultText, matchId]);
    
    // Update tournament stats if applicable
    const match = await this.findById(matchId);
    if (match.tournament_id && winnerId) {
      await this.updateTournamentStats(match.tournament_id, winnerId);
    }
    
    return this.findById(matchId);
  }

  /**
   * Update tournament team stats after match
   */
  static async updateTournamentStats(tournamentId, winnerId) {
    const pool = getPool();
    // This would be called from service layer with full match data
    // Simplified version here
    const query = `
      UPDATE tournament_teams 
      SET played = played + 1,
          won = won + 1
      WHERE tournament_id = ? AND team_id = ?
    `;
    await pool.execute(query, [tournamentId, winnerId]);
  }

  /**
   * Get live matches
   */
  static async getLiveMatches() {
    return this.findAll({ status: 'live' });
  }

  /**
   * Get upcoming matches
   */
  static async getUpcomingMatches() {
    return this.findAll({ status: 'scheduled' });
  }

  /**
   * Get completed matches
   */
  static async getCompletedMatches() {
    return this.findAll({ status: 'completed' });
  }

  /**
   * Get matches by tournament
   */
  static async getByTournament(tournamentId) {
    return this.findAll({ tournament_id: tournamentId });
  }
}

module.exports = Match;
