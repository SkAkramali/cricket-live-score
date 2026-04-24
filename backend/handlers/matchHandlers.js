const db = require("../database");
const { generateMatchCode } = require("../utils/matchCode");
const { emitToMatch } = require("../config/socket");
const { deleteCache, deleteCachePattern } = require("../config/redis");

/**
 * Create a new match
 */
const createMatchHandler = async (req, res) => {
  let connection;
  try {
    const {
      team1_id,
      team2_id,
      match_date,
      venue,
      overs_per_side,
      match_type
    } = req.body;

    // Validate required fields
    if (!team1_id || !team2_id || !match_date) {
      return res.status(400).json({
        success: false,
        message: "team1_id, team2_id, and match_date are required"
      });
    }

    // Generate unique match code
    const matchCode = generateMatchCode();

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Insert match
    const [result] = await connection.execute(
      `INSERT INTO matches (match_code, team1_id, team2_id, match_date, venue, overs_per_side, match_type, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)`,
      [matchCode, team1_id, team2_id, match_date, venue, overs_per_side || 20, match_type || 't20', req.user.user_id]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Match created successfully",
      data: {
        match_id: result.insertId,
        match_code: matchCode
      }
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Create match error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to create match",
      error: err.message
    });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Get match by code (for joining match)
 */
const getMatchByCodeHandler = async (req, res) => {
  try {
    const { matchCode } = req.params;

    const [matches] = await db.execute(
      `SELECT m.*, 
              t1.team_name AS team1_name, t1.team_short_name AS team1_short,
              t2.team_name AS team2_name, t2.team_short_name AS team2_short,
              tw.team_name AS toss_winner_name,
              bt.team_name AS batting_first_name,
              wt.team_name AS winner_name
       FROM matches m
       LEFT JOIN teams t1 ON m.team1_id = t1.team_id
       LEFT JOIN teams t2 ON m.team2_id = t2.team_id
       LEFT JOIN teams tw ON m.toss_winner_team_id = tw.team_id
       LEFT JOIN teams bt ON m.batting_first_team_id = bt.team_id
       LEFT JOIN teams wt ON m.winner_team_id = wt.team_id
       WHERE m.match_code = ?`,
      [matchCode]
    );

    if (matches.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Match not found with this code"
      });
    }

    // Get innings data
    const [innings] = await db.execute(
      `SELECT i.*, 
              bt.team_name AS batting_team_name,
              bwt.team_name AS bowling_team_name
       FROM innings i
       LEFT JOIN teams bt ON i.batting_team_id = bt.team_id
       LEFT JOIN teams bwt ON i.bowling_team_id = bwt.team_id
       WHERE i.match_id = ?
       ORDER BY i.innings_number`,
      [matches[0].match_id]
    );

    res.status(200).json({
      success: true,
      data: {
        match: matches[0],
        innings: innings
      }
    });
  } catch (err) {
    console.error('Get match by code error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to get match",
      error: err.message
    });
  }
};

/**
 * Start match (toss and choose batting/bowling)
 */
const startMatchHandler = async (req, res) => {
  let connection;
  try {
    const { match_id } = req.params;
    const { toss_winner_team_id, toss_decision } = req.body;

    if (!toss_winner_team_id || !toss_decision) {
      return res.status(400).json({
        success: false,
        message: "toss_winner_team_id and toss_decision are required"
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Get match details
    const [matches] = await connection.execute(
      "SELECT * FROM matches WHERE match_id = ?",
      [match_id]
    );

    if (matches.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }

    const match = matches[0];

    // Determine which team bats first
    let batting_first_team_id;
    let bowling_first_team_id;

    if (toss_decision === 'bat') {
      batting_first_team_id = toss_winner_team_id;
      bowling_first_team_id = (toss_winner_team_id === match.team1_id) ? match.team2_id : match.team1_id;
    } else {
      bowling_first_team_id = toss_winner_team_id;
      batting_first_team_id = (toss_winner_team_id === match.team1_id) ? match.team2_id : match.team1_id;
    }

    // Update match
    await connection.execute(
      `UPDATE matches 
       SET toss_winner_team_id = ?, toss_decision = ?, batting_first_team_id = ?, status = 'live'
       WHERE match_id = ?`,
      [toss_winner_team_id, toss_decision, batting_first_team_id, match_id]
    );

    // Create first innings
    await connection.execute(
      `INSERT INTO innings (match_id, batting_team_id, bowling_team_id, innings_number)
       VALUES (?, ?, ?, 1)`,
      [match_id, batting_first_team_id, bowling_first_team_id]
    );

    await connection.commit();

    // Emit WebSocket event
    emitToMatch(match.match_code, 'match-started', {
      match_id,
      status: 'live',
      batting_team_id: batting_first_team_id,
      bowling_team_id: bowling_first_team_id
    });

    // Clear cache
    await deleteCachePattern(`match:${match_id}:*`);

    res.status(200).json({
      success: true,
      message: "Match started successfully"
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Start match error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to start match",
      error: err.message
    });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Get live match summary
 */
const getLiveMatchSummaryHandler = async (req, res) => {
  try {
    const { match_id } = req.params;

    const [matches] = await db.execute(
      `SELECT m.*, 
              t1.team_name AS team1_name, t1.team_short_name AS team1_short,
              t2.team_name AS team2_name, t2.team_short_name AS team2_short
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

    const match = matches[0];

    // Get current innings
    const [innings] = await db.execute(
      `SELECT i.*, 
              bt.team_name AS batting_team_name,
              bwt.team_name AS bowling_team_name
       FROM innings i
       LEFT JOIN teams bt ON i.batting_team_id = bt.team_id
       LEFT JOIN teams bwt ON i.bowling_team_id = bwt.team_id
       WHERE i.match_id = ?
       ORDER BY i.innings_number DESC
       LIMIT 1`,
      [match_id]
    );

    // Get current batsmen
    const [batsmen] = await db.execute(
      `SELECT bs.*, p.player_name
       FROM batting_stats bs
       JOIN players p ON bs.player_id = p.player_id
       WHERE bs.innings_id = ? AND bs.is_batting = TRUE`,
      [innings[0]?.innings_id]
    );

    // Get current bowler
    const [bowler] = await db.execute(
      `SELECT bow.*, p.player_name
       FROM bowling_stats bow
       JOIN players p ON bow.player_id = p.player_id
       WHERE bow.innings_id = ? AND bow.is_bowling = TRUE`,
      [innings[0]?.innings_id]
    );

    // Get last 6 balls
    const [recentBalls] = await db.execute(
      `SELECT * FROM ball_by_ball
       WHERE innings_id = ?
       ORDER BY ball_id DESC
       LIMIT 6`,
      [innings[0]?.innings_id]
    );

    res.status(200).json({
      success: true,
      data: {
        match,
        current_innings: innings[0] || null,
        current_batsmen: batsmen,
        current_bowler: bowler[0] || null,
        recent_balls: recentBalls.reverse()
      }
    });
  } catch (err) {
    console.error('Get live match summary error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to get match summary",
      error: err.message
    });
  }
};

/**
 * Get all matches
 */
const getAllMatchesHandler = async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT m.*, 
             t1.team_name AS team1_name, t1.team_short_name AS team1_short,
             t2.team_name AS team2_name, t2.team_short_name AS team2_short
      FROM matches m
      LEFT JOIN teams t1 ON m.team1_id = t1.team_id
      LEFT JOIN teams t2 ON m.team2_id = t2.team_id
    `;

    const params = [];

    if (status) {
      query += ` WHERE m.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY m.match_date DESC`;

    const [matches] = await db.execute(query, params);

    res.status(200).json({
      success: true,
      data: {
        matches,
        count: matches.length
      }
    });
  } catch (err) {
    console.error('Get all matches error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to get matches",
      error: err.message
    });
  }
};

module.exports = {
  createMatchHandler,
  getMatchByCodeHandler,
  startMatchHandler,
  getLiveMatchSummaryHandler,
  getAllMatchesHandler
};
