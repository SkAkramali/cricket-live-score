const db = require("../database");
const { setCache, getCache } = require("../config/redis");

/**
 * Get player statistics for a specific match
 */
const getPlayerMatchStatsHandler = async (req, res) => {
  try {
    const { match_id, player_id } = req.params;

    const cacheKey = `player:${player_id}:match:${match_id}:stats`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        data: cached,
        cached: true
      });
    }

    // Get batting stats
    const [battingStats] = await db.execute(
      `SELECT bs.*, p.player_name, t.team_name
       FROM batting_stats bs
       JOIN players p ON bs.player_id = p.player_id
       LEFT JOIN teams t ON p.team_id = t.team_id
       WHERE bs.match_id = ? AND bs.player_id = ?`,
      [match_id, player_id]
    );

    // Get bowling stats
    const [bowlingStats] = await db.execute(
      `SELECT bow.*, p.player_name, t.team_name
       FROM bowling_stats bow
       JOIN players p ON bow.player_id = p.player_id
       LEFT JOIN teams t ON p.team_id = t.team_id
       WHERE bow.match_id = ? AND bow.player_id = ?`,
      [match_id, player_id]
    );

    const stats = {
      batting: battingStats[0] || null,
      bowling: bowlingStats[0] || null
    };

    // Cache for 5 minutes
    await setCache(cacheKey, stats, 300);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error('Get player match stats error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to get player stats",
      error: err.message
    });
  }
};

/**
 * Get player career statistics
 */
const getPlayerCareerStatsHandler = async (req, res) => {
  try {
    const { player_id } = req.params;

    const cacheKey = `player:${player_id}:career:stats`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        data: cached,
        cached: true
      });
    }

    // Get player info
    const [players] = await db.execute(
      `SELECT p.*, t.team_name 
       FROM players p
       LEFT JOIN teams t ON p.team_id = t.team_id
       WHERE p.player_id = ?`,
      [player_id]
    );

    if (players.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Player not found"
      });
    }

    // Batting statistics
    const [battingStats] = await db.execute(
      `SELECT 
         COUNT(DISTINCT bs.match_id) as matches_played,
         SUM(bs.runs_scored) as total_runs,
         SUM(bs.balls_faced) as total_balls,
         AVG(bs.runs_scored) as average_runs,
         MAX(bs.runs_scored) as highest_score,
         SUM(CASE WHEN bs.runs_scored >= 50 AND bs.runs_scored < 100 THEN 1 ELSE 0 END) as fifties,
         SUM(CASE WHEN bs.runs_scored >= 100 THEN 1 ELSE 0 END) as hundreds,
         SUM(bs.fours) as total_fours,
         SUM(bs.sixes) as total_sixes,
         ROUND(SUM(bs.runs_scored) * 100.0 / NULLIF(SUM(bs.balls_faced), 0), 2) as strike_rate,
         SUM(CASE WHEN bs.dismissal_type = 'not-out' THEN 1 ELSE 0 END) as not_outs
       FROM batting_stats bs
       WHERE bs.player_id = ?`,
      [player_id]
    );

    // Bowling statistics
    const [bowlingStats] = await db.execute(
      `SELECT 
         COUNT(DISTINCT bow.match_id) as matches_bowled,
         SUM(bow.wickets_taken) as total_wickets,
         SUM(bow.runs_conceded) as total_runs_conceded,
         SUM(bow.overs_bowled) as total_overs,
         ROUND(SUM(bow.runs_conceded) / NULLIF(SUM(bow.wickets_taken), 0), 2) as bowling_average,
         ROUND(SUM(bow.runs_conceded) / NULLIF(SUM(bow.overs_bowled), 0), 2) as economy_rate,
         SUM(bow.maidens) as total_maidens,
         MAX(bow.wickets_taken) as best_bowling_wickets
       FROM bowling_stats bow
       WHERE bow.player_id = ?`,
      [player_id]
    );

    const stats = {
      player: players[0],
      batting: battingStats[0],
      bowling: bowlingStats[0]
    };

    // Cache for 1 hour
    await setCache(cacheKey, stats, 3600);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error('Get player career stats error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to get player career stats",
      error: err.message
    });
  }
};

/**
 * Get top batsmen in a match
 */
const getTopBatsmenHandler = async (req, res) => {
  try {
    const { match_id } = req.params;
    const { limit = 5 } = req.query;

    const [batsmen] = await db.execute(
      `SELECT bs.*, p.player_name, t.team_name
       FROM batting_stats bs
       JOIN players p ON bs.player_id = p.player_id
       LEFT JOIN teams t ON p.team_id = t.team_id
       WHERE bs.match_id = ?
       ORDER BY bs.runs_scored DESC
       LIMIT ?`,
      [match_id, parseInt(limit)]
    );

    res.status(200).json({
      success: true,
      data: {
        batsmen
      }
    });
  } catch (err) {
    console.error('Get top batsmen error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to get top batsmen",
      error: err.message
    });
  }
};

/**
 * Get top bowlers in a match
 */
const getTopBowlersHandler = async (req, res) => {
  try {
    const { match_id } = req.params;
    const { limit = 5 } = req.query;

    const [bowlers] = await db.execute(
      `SELECT bow.*, p.player_name, t.team_name
       FROM bowling_stats bow
       JOIN players p ON bow.player_id = p.player_id
       LEFT JOIN teams t ON p.team_id = t.team_id
       WHERE bow.match_id = ?
       ORDER BY bow.wickets_taken DESC, bow.economy_rate ASC
       LIMIT ?`,
      [match_id, parseInt(limit)]
    );

    res.status(200).json({
      success: true,
      data: {
        bowlers
      }
    });
  } catch (err) {
    console.error('Get top bowlers error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to get top bowlers",
      error: err.message
    });
  }
};

/**
 * Get match scorecard
 */
const getMatchScorecardHandler = async (req, res) => {
  try {
    const { match_id } = req.params;

    const cacheKey = `match:${match_id}:scorecard`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        data: cached,
        cached: true
      });
    }

    // Get match details
    const [matches] = await db.execute(
      `SELECT m.*, 
              t1.team_name AS team1_name,
              t2.team_name AS team2_name
       FROM matches m
       LEFT JOIN teams t1 ON m.team1_id = t1.team_id
       LEFT JOIN teams t2 ON m.team2_id = t2.team_id
       WHERE m.match_id = ?`,
      [match_id]
    );

    if (matches.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    // Get innings
    const [innings] = await db.execute(
      `SELECT i.*, 
              bt.team_name AS batting_team_name,
              bwt.team_name AS bowling_team_name
       FROM innings i
       LEFT JOIN teams bt ON i.batting_team_id = bt.team_id
       LEFT JOIN teams bwt ON i.bowling_team_id = bwt.team_id
       WHERE i.match_id = ?
       ORDER BY i.innings_number`,
      [match_id]
    );

    // For each innings, get batting and bowling stats
    const inningsData = [];
    for (const inning of innings) {
      const [batting] = await db.execute(
        `SELECT bs.*, p.player_name
         FROM batting_stats bs
         JOIN players p ON bs.player_id = p.player_id
         WHERE bs.innings_id = ?
         ORDER BY bs.position`,
        [inning.innings_id]
      );

      const [bowling] = await db.execute(
        `SELECT bow.*, p.player_name
         FROM bowling_stats bow
         JOIN players p ON bow.player_id = p.player_id
         WHERE bow.innings_id = ?
         ORDER BY bow.wickets_taken DESC`,
        [inning.innings_id]
      );

      inningsData.push({
        innings: inning,
        batting,
        bowling
      });
    }

    const scorecard = {
      match: matches[0],
      innings: inningsData
    };

    // Cache for 5 minutes for live matches, 1 hour for completed
    const cacheTTL = matches[0].status === 'completed' ? 3600 : 300;
    await setCache(cacheKey, scorecard, cacheTTL);

    res.status(200).json({
      success: true,
      data: scorecard
    });
  } catch (err) {
    console.error('Get match scorecard error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to get match scorecard",
      error: err.message
    });
  }
};

/**
 * Get partnerships for an innings
 */
const getPartnershipsHandler = async (req, res) => {
  try {
    const { innings_id } = req.params;

    const [partnerships] = await db.execute(
      `SELECT p.*, 
              p1.player_name AS batsman1_name,
              p2.player_name AS batsman2_name
       FROM partnerships p
       JOIN players p1 ON p.batsman1_id = p1.player_id
       JOIN players p2 ON p.batsman2_id = p2.player_id
       WHERE p.innings_id = ?
       ORDER BY p.runs DESC`,
      [innings_id]
    );

    res.status(200).json({
      success: true,
      data: {
        partnerships
      }
    });
  } catch (err) {
    console.error('Get partnerships error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to get partnerships",
      error: err.message
    });
  }
};

/**
 * Get ball-by-ball commentary
 */
const getBallByBallCommentaryHandler = async (req, res) => {
  try {
    const { innings_id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const [balls] = await db.execute(
      `SELECT b.*, 
              p1.player_name AS batsman_name,
              p2.player_name AS bowler_name
       FROM ball_by_ball b
       JOIN players p1 ON b.batsman_id = p1.player_id
       JOIN players p2 ON b.bowler_id = p2.player_id
       WHERE b.innings_id = ?
       ORDER BY b.ball_id DESC
       LIMIT ? OFFSET ?`,
      [innings_id, parseInt(limit), parseInt(offset)]
    );

    // Get total count
    const [count] = await db.execute(
      `SELECT COUNT(*) as total FROM ball_by_ball WHERE innings_id = ?`,
      [innings_id]
    );

    res.status(200).json({
      success: true,
      data: {
        balls,
        total: count[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (err) {
    console.error('Get ball by ball commentary error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to get commentary",
      error: err.message
    });
  }
};

/**
 * Get match analytics/statistics
 */
const getMatchAnalyticsHandler = async (req, res) => {
  try {
    const { match_id } = req.params;

    const cacheKey = `match:${match_id}:analytics`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        data: cached,
        cached: true
      });
    }

    // Get innings run rates
    const [runRates] = await db.execute(
      `SELECT 
         innings_number,
         batting_team_id,
         total_runs,
         total_overs,
         ROUND(total_runs / NULLIF(total_overs, 0), 2) as run_rate
       FROM innings
       WHERE match_id = ?
       ORDER BY innings_number`,
      [match_id]
    );

    // Get highest partnership
    const [highestPartnership] = await db.execute(
      `SELECT p.*, 
              p1.player_name AS batsman1_name,
              p2.player_name AS batsman2_name
       FROM partnerships p
       JOIN players p1 ON p.batsman1_id = p1.player_id
       JOIN players p2 ON p.batsman2_id = p2.player_id
       WHERE p.match_id = ?
       ORDER BY p.runs DESC
       LIMIT 1`,
      [match_id]
    );

    // Get total boundaries
    const [boundaries] = await db.execute(
      `SELECT 
         SUM(fours) as total_fours,
         SUM(sixes) as total_sixes,
         SUM(fours + sixes) as total_boundaries
       FROM batting_stats
       WHERE match_id = ?`,
      [match_id]
    );

    // Get total extras
    const [extras] = await db.execute(
      `SELECT 
         SUM(extras_total) as total_extras,
         SUM(extras_wides) as total_wides,
         SUM(extras_noballs) as total_noballs
       FROM innings
       WHERE match_id = ?`,
      [match_id]
    );

    const analytics = {
      run_rates: runRates,
      highest_partnership: highestPartnership[0] || null,
      boundaries: boundaries[0],
      extras: extras[0]
    };

    // Cache for 5 minutes
    await setCache(cacheKey, analytics, 300);

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (err) {
    console.error('Get match analytics error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to get match analytics",
      error: err.message
    });
  }
};

module.exports = {
  getPlayerMatchStatsHandler,
  getPlayerCareerStatsHandler,
  getTopBatsmenHandler,
  getTopBowlersHandler,
  getMatchScorecardHandler,
  getPartnershipsHandler,
  getBallByBallCommentaryHandler,
  getMatchAnalyticsHandler
};
