// ============================================
// SCORING SERVICE
// Business logic for ball-by-ball scoring
// ============================================

const Innings = require('../models/Innings');
const Score = require('../models/Score');
const Match = require('../models/Match');
const { emitToMatch } = require('../config/socket');

class ScoringService {
  /**
   * Create a new innings
   */
  static async createInnings(inningsData) {
    try {
      const innings = await Innings.create(inningsData);
      return { success: true, data: innings };
    } catch (error) {
      throw new Error(`Failed to create innings: ${error.message}`);
    }
  }

  /**
   * Record a ball event (main scoring function)
   */
  static async recordBall(ballData) {
    let connection;
    try {
      const {
        match_id,
        innings_id,
        over_number,
        ball_number,
        batsman_id,
        bowler_id,
        non_striker_id,
        runs_scored,
        extras = 0,
        extra_type = 'none',
        is_wicket = false,
        wicket_type = 'none',
        dismissed_player_id = null,
        fielder_id = null,
        commentary = ''
      } = ballData;

      // Determine ball type
      let ball_type = 'legal';
      if (extra_type === 'wide') ball_type = 'wide';
      else if (extra_type === 'noball') ball_type = 'noball';

      // Add ball to database
      const ballResult = await Score.addBall({
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
      });

      // Update innings score
      const totalRuns = runs_scored + extras;
      const isWideOrNoBall = (extra_type === 'wide' || extra_type === 'noball');
      
      await Innings.updateScore(innings_id, {
        total_runs: totalRuns,
        total_wickets: is_wicket ? 1 : 0,
        total_overs: isWideOrNoBall ? 0 : 1/6,
        extras_total: extras,
        extras_wides: extra_type === 'wide' ? 1 : 0,
        extras_noballs: extra_type === 'noball' ? 1 : 0
      });

      // Update batsman stats
      if (batsman_id) {
        const fours = runs_scored === 4 ? 1 : 0;
        const sixes = runs_scored === 6 ? 1 : 0;
        await Score.updateBatsmanStats(innings_id, batsman_id, runs_scored, 1, fours, sixes);
      }

      // Update bowler stats
      if (bowler_id) {
        await Score.updateBowlerStats(
          innings_id, 
          bowler_id, 
          totalRuns, 
          is_wicket,
          extra_type === 'wide',
          extra_type === 'noball'
        );
      }

      // Handle wicket
      if (is_wicket && dismissed_player_id) {
        await Score.recordDismissal(
          innings_id,
          dismissed_player_id,
          wicket_type,
          bowler_id,
          fielder_id
        );
      }

      // Update partnership
      if (batsman_id && non_striker_id) {
        await Score.updatePartnership(
          innings_id,
          batsman_id,
          non_striker_id,
          totalRuns,
          isWideOrNoBall ? 0 : 1
        );
      }

      // Emit real-time update
      const currentScore = await Score.getCurrentScore(innings_id);
      emitToMatch(match_id, 'ball_updated', {
        ball_id: ballResult.ball_id,
        innings_id,
        over: over_number,
        ball: ball_number,
        runs: totalRuns,
        isWicket: is_wicket,
        score: currentScore
      });

      return {
        success: true,
        data: {
          ball_id: ballResult.ball_id,
          runs: totalRuns,
          isWicket: is_wicket
        },
        message: 'Ball recorded successfully'
      };
    } catch (error) {
      throw new Error(`Failed to record ball: ${error.message}`);
    }
  }

  /**
   * Quick scoring - add runs directly
   */
  static async addQuickRuns(inningsId, batsmanId, bowlerId, nonStrikerId, runs) {
    try {
      const innings = await Innings.findById(inningsId);
      if (!innings) {
        throw new Error('Innings not found');
      }

      const matchId = innings.match_id;
      
      // Calculate current over and ball
      const currentOvers = Math.floor(innings.total_overs);
      const currentBalls = Math.round((innings.total_overs - currentOvers) * 6);
      
      const overNumber = currentBalls >= 5 ? currentOvers + 1 : currentOvers;
      const ballNumber = currentBalls >= 5 ? 1 : currentBalls + 1;

      // Determine if it's a boundary
      const commentary = runs === 4 ? 'FOUR! Brilliant shot!' : 
                        runs === 6 ? 'SIX! Massive hit!' : 
                        `${runs} run${runs > 1 ? 's' : ''}`;

      return await this.recordBall({
        match_id: matchId,
        innings_id: inningsId,
        over_number: overNumber,
        ball_number: ballNumber,
        batsman_id: batsmanId,
        bowler_id: bowlerId,
        non_striker_id: nonStrikerId,
        runs_scored: runs,
        extras: 0,
        extra_type: 'none',
        is_wicket: false,
        commentary: commentary
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Record wicket
   */
  static async recordWicket(inningsId, batsmanId, bowlerId, nonStrikerId, wicketType, fielderId = null) {
    try {
      const innings = await Innings.findById(inningsId);
      if (!innings) {
        throw new Error('Innings not found');
      }

      const matchId = innings.match_id;
      
      // Calculate current over and ball
      const currentOvers = Math.floor(innings.total_overs);
      const currentBalls = Math.round((innings.total_overs - currentOvers) * 6);
      
      const overNumber = currentBalls >= 5 ? currentOvers + 1 : currentOvers;
      const ballNumber = currentBalls >= 5 ? 1 : currentBalls + 1;

      const commentary = `WICKET! ${wicketType.toUpperCase()}`;

      return await this.recordBall({
        match_id: matchId,
        innings_id: inningsId,
        over_number: overNumber,
        ball_number: ballNumber,
        batsman_id: batsmanId,
        bowler_id: bowlerId,
        non_striker_id: nonStrikerId,
        runs_scored: 0,
        extras: 0,
        extra_type: 'none',
        is_wicket: true,
        wicket_type: wicketType.toLowerCase(),
        dismissed_player_id: batsmanId,
        fielder_id: fielderId,
        commentary: commentary
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get innings details with all stats
   */
  static async getInningsDetails(inningsId) {
    try {
      const innings = await Innings.findById(inningsId);
      if (!innings) {
        throw new Error('Innings not found');
      }

      const battingStats = await Innings.getBattingStats(inningsId);
      const bowlingStats = await Innings.getBowlingStats(inningsId);
      const recentBalls = await Score.getRecentBalls(inningsId, 36);
      const partnership = await Innings.getCurrentPartnership(inningsId);

      return {
        success: true,
        data: {
          innings,
          battingStats,
          bowlingStats,
          recentBalls,
          partnership
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Complete innings
   */
  static async completeInnings(inningsId) {
    try {
      await Innings.complete(inningsId);
      return { success: true, message: 'Innings completed' };
    } catch (error) {
      throw new Error(`Failed to complete innings: ${error.message}`);
    }
  }

  /**
   * Delete ball (for corrections)
   */
  static async deleteBall(ballId) {
    try {
      const deleted = await Score.deleteBall(ballId);
      if (!deleted) {
        throw new Error('Failed to delete ball');
      }
      return { success: true, message: 'Ball deleted successfully' };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ScoringService;
