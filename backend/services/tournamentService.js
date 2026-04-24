// ============================================
// TOURNAMENT SERVICE
// Business logic for tournament operations
// ============================================

const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const Match = require('../models/Match');

class TournamentService {
  /**
   * Create a new tournament
   */
  static async createTournament(tournamentData) {
    try {
      const tournament = await Tournament.create(tournamentData);
      return { success: true, data: tournament };
    } catch (error) {
      throw new Error(`Failed to create tournament: ${error.message}`);
    }
  }

  /**
   * Get tournament by ID
   */
  static async getTournament(id) {
    try {
      const tournament = await Tournament.findById(id);
      if (!tournament) {
        throw new Error('Tournament not found');
      }
      return { success: true, data: tournament };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all tournaments
   */
  static async getAllTournaments(filters = {}) {
    try {
      const tournaments = await Tournament.findAll(filters);
      return { success: true, data: tournaments };
    } catch (error) {
      throw new Error(`Failed to fetch tournaments: ${error.message}`);
    }
  }

  /**
   * Update tournament
   */
  static async updateTournament(id, updates) {
    try {
      const tournament = await Tournament.update(id, updates);
      if (!tournament) {
        throw new Error('Tournament not found');
      }
      return { success: true, data: tournament, message: 'Tournament updated successfully' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete tournament
   */
  static async deleteTournament(id) {
    try {
      const deleted = await Tournament.delete(id);
      if (!deleted) {
        throw new Error('Failed to delete tournament');
      }
      return { success: true, message: 'Tournament deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add team to tournament
   */
  static async addTeamToTournament(tournamentId, teamId) {
    try {
      // Verify tournament exists
      const tournament = await Tournament.findById(tournamentId);
      if (!tournament) {
        throw new Error('Tournament not found');
      }

      // Verify team exists
      const team = await Team.findById(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      // Add team to tournament
      await Tournament.addTeam(tournamentId, teamId);
      
      // Update team's tournament_id
      await Team.update(teamId, { tournament_id: tournamentId });

      return { success: true, message: 'Team added to tournament successfully' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove team from tournament
   */
  static async removeTeamFromTournament(tournamentId, teamId) {
    try {
      await Tournament.removeTeam(tournamentId, teamId);
      await Team.update(teamId, { tournament_id: null });
      
      return { success: true, message: 'Team removed from tournament successfully' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get teams in tournament
   */
  static async getTournamentTeams(tournamentId) {
    try {
      const teams = await Tournament.getTeams(tournamentId);
      return { success: true, data: teams };
    } catch (error) {
      throw new Error(`Failed to fetch teams: ${error.message}`);
    }
  }

  /**
   * Get points table for tournament
   */
  static async getPointsTable(tournamentId) {
    try {
      const pointsTable = await Tournament.getPointsTable(tournamentId);
      return { success: true, data: pointsTable };
    } catch (error) {
      throw new Error(`Failed to fetch points table: ${error.message}`);
    }
  }

  /**
   * Update team stats after match
   */
  static async updateTeamStatsAfterMatch(tournamentId, winningTeamId, losingTeamId, matchData) {
    try {
      // Update winner stats
      if (winningTeamId) {
        await Tournament.updateTeamStats(tournamentId, winningTeamId, {
          points: 2,
          played: 1,
          won: 1,
          runs_for: matchData.winnerRuns || 0,
          wickets_for: matchData.winnerWickets || 0,
          runs_against: matchData.loserRuns || 0,
          wickets_against: matchData.loserWickets || 0
        });

        // Update loser stats
        if (losingTeamId) {
          await Tournament.updateTeamStats(tournamentId, losingTeamId, {
            points: 0,
            played: 1,
            lost: 1,
            runs_for: matchData.loserRuns || 0,
            wickets_for: matchData.loserWickets || 0,
            runs_against: matchData.winnerRuns || 0,
            wickets_against: matchData.winnerWickets || 0
          });
        }
      } else {
        // Tie or no result - both teams get 1 point
        if (matchData.isTie) {
          await Tournament.updateTeamStats(tournamentId, winningTeamId, {
            points: 1,
            played: 1,
            tied: 1
          });
          await Tournament.updateTeamStats(tournamentId, losingTeamId, {
            points: 1,
            played: 1,
            tied: 1
          });
        } else {
          // No result
          await Tournament.updateTeamStats(tournamentId, winningTeamId, {
            points: 1,
            played: 1,
            no_result: 1
          });
          await Tournament.updateTeamStats(tournamentId, losingTeamId, {
            points: 1,
            played: 1,
            no_result: 1
          });
        }
      }

      return { success: true, message: 'Team stats updated successfully' };
    } catch (error) {
      throw new Error(`Failed to update team stats: ${error.message}`);
    }
  }

  /**
   * Get tournament with full details
   */
  static async getTournamentDetails(tournamentId) {
    try {
      const tournament = await Tournament.findById(tournamentId);
      if (!tournament) {
        throw new Error('Tournament not found');
      }

      const teams = await this.getTournamentTeams(tournamentId);
      const matches = await Match.getByTournament(tournamentId);
      const pointsTable = await this.getPointsTable(tournamentId);

      return {
        success: true,
        data: {
          tournament,
          teams: teams.data,
          matches,
          pointsTable: pointsTable.data
        }
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = TournamentService;
