const db = require("../database");
const { emitBallUpdate, emitToMatch } = require("../config/socket");
const { deleteCachePattern } = require("../config/redis");

/**
 * Record a ball (main live scoring function)
 */
const recordBallHandler = async (req, res) => {
  let connection;
  try {
    const {
      match_id,
      innings_id,
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
      commentary
    } = req.body;

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Get current innings info
    const [innings] = await connection.execute(
      "SELECT * FROM innings WHERE innings_id = ?",
      [innings_id]
    );

    if (innings.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Innings not found"
      });
    }

    const currentInnings = innings[0];
    const currentOver = Math.floor(currentInnings.total_overs);
    const currentBall = Math.round((currentInnings.total_overs - currentOver) * 10);

    // Determine ball type
    let ballType = 'legal';
    if (extra_type === 'wide' || extra_type === 'noball') {
      ballType = extra_type;
    }

    // Calculate next ball number
    let nextBall = currentBall + 1;
    let nextOver = currentOver;

    // Only increment over for legal deliveries
    if (ballType === 'legal') {
      if (nextBall >= 6) {
        nextOver++;
        nextBall = 0;
      }
    }

    // Insert ball record
    const [ballResult] = await connection.execute(
      `INSERT INTO ball_by_ball 
       (match_id, innings_id, over_number, ball_number, batsman_id, bowler_id, non_striker_id, 
        runs_scored, extras, extra_type, is_wicket, wicket_type, dismissed_player_id, fielder_id, 
        ball_type, commentary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        match_id, innings_id, currentOver, currentBall, batsman_id, bowler_id, non_striker_id,
        runs_scored || 0, extras || 0, extra_type || 'none', is_wicket || false,
        wicket_type || 'none', dismissed_player_id, fielder_id, ballType, commentary
      ]
    );

    // Calculate total runs for this ball
    const totalRunsThisBall = (runs_scored || 0) + (extras || 0);

    // Update innings stats
    const newTotalRuns = currentInnings.total_runs + totalRunsThisBall;
    const newTotalWickets = currentInnings.total_wickets + (is_wicket ? 1 : 0);
    
    // Calculate new overs (only increment for legal balls)
    let newTotalOvers = currentInnings.total_overs;
    if (ballType === 'legal') {
      const balls = Math.round(currentInnings.total_overs * 10) % 10;
      if (balls === 5) {
        newTotalOvers = Math.ceil(currentInnings.total_overs);
      } else {
        newTotalOvers = currentInnings.total_overs + 0.1;
      }
      newTotalOvers = Math.round(newTotalOvers * 10) / 10;
    }

    // Update extras
    let extrasUpdate = '';
    switch (extra_type) {
      case 'wide':
        extrasUpdate = `, extras_wides = extras_wides + ${extras}`;
        break;
      case 'noball':
        extrasUpdate = `, extras_noballs = extras_noballs + ${extras}`;
        break;
      case 'bye':
        extrasUpdate = `, extras_byes = extras_byes + ${extras}`;
        break;
      case 'legbye':
        extrasUpdate = `, extras_legbyes = extras_legbyes + ${extras}`;
        break;
    }

    await connection.execute(
      `UPDATE innings 
       SET total_runs = ?, total_wickets = ?, total_overs = ?, 
           extras_total = extras_total + ?${extrasUpdate}
       WHERE innings_id = ?`,
      [newTotalRuns, newTotalWickets, newTotalOvers, extras || 0, innings_id]
    );

    // Update batsman stats (only for legal balls and runs)
    if (ballType === 'legal' || runs_scored > 0) {
      await connection.execute(
        `INSERT INTO batting_stats (innings_id, match_id, player_id, runs_scored, balls_faced, fours, sixes)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           runs_scored = runs_scored + ?,
           balls_faced = balls_faced + ?,
           fours = fours + ?,
           sixes = sixes + ?,
           strike_rate = CASE 
             WHEN (balls_faced + ?) > 0 THEN ROUND((runs_scored + ?) * 100.0 / (balls_faced + ?), 2)
             ELSE 0 
           END`,
        [
          innings_id, match_id, batsman_id, runs_scored || 0, 
          ballType === 'legal' ? 1 : 0,
          runs_scored === 4 ? 1 : 0,
          runs_scored === 6 ? 1 : 0,
          // ON DUPLICATE UPDATE
          runs_scored || 0,
          ballType === 'legal' ? 1 : 0,
          runs_scored === 4 ? 1 : 0,
          runs_scored === 6 ? 1 : 0,
          ballType === 'legal' ? 1 : 0,
          runs_scored || 0,
          ballType === 'legal' ? 1 : 0
        ]
      );
    }

    // Handle wicket
    if (is_wicket) {
      await connection.execute(
        `UPDATE batting_stats 
         SET dismissal_type = ?, dismissed_by_player_id = ?, fielder_player_id = ?, is_batting = FALSE
         WHERE innings_id = ? AND player_id = ?`,
        [wicket_type, bowler_id, fielder_id, innings_id, dismissed_player_id || batsman_id]
      );

      // Update bowler wicket count
      await connection.execute(
        `UPDATE bowling_stats
         SET wickets_taken = wickets_taken + 1
         WHERE innings_id = ? AND player_id = ?`,
        [innings_id, bowler_id]
      );
    }

    // Update bowler stats
    const bowlerOversIncrement = ballType === 'legal' ? 0.1 : 0;
    await connection.execute(
      `INSERT INTO bowling_stats (innings_id, match_id, player_id, overs_bowled, runs_conceded, wides, noballs)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         overs_bowled = ROUND((overs_bowled + ?) * 10) / 10,
         runs_conceded = runs_conceded + ?,
         wides = wides + ?,
         noballs = noballs + ?,
         economy_rate = CASE 
           WHEN (overs_bowled + ?) > 0 THEN ROUND((runs_conceded + ?) / (overs_bowled + ?), 2)
           ELSE 0 
         END`,
      [
        innings_id, match_id, bowler_id, bowlerOversIncrement, totalRunsThisBall,
        extra_type === 'wide' ? 1 : 0,
        extra_type === 'noball' ? 1 : 0,
        // ON DUPLICATE UPDATE
        bowlerOversIncrement,
        totalRunsThisBall,
        extra_type === 'wide' ? 1 : 0,
        extra_type === 'noball' ? 1 : 0,
        bowlerOversIncrement,
        totalRunsThisBall,
        bowlerOversIncrement
      ]
    );

    // Update active partnership
    await connection.execute(
      `UPDATE partnerships 
       SET runs = runs + ?, balls = balls + ?
       WHERE innings_id = ? AND is_active = TRUE`,
      [runs_scored || 0, ballType === 'legal' ? 1 : 0, innings_id]
    );

    await connection.commit();

    // Get match code for WebSocket broadcast
    const [matches] = await db.execute(
      "SELECT match_code FROM matches WHERE match_id = ?",
      [match_id]
    );

    // Broadcast ball update via WebSocket
    const ballUpdate = {
      ball_id: ballResult.insertId,
      runs_scored,
      extras,
      extra_type,
      is_wicket,
      wicket_type,
      total_runs: newTotalRuns,
      total_wickets: newTotalWickets,
      total_overs: newTotalOvers,
      commentary
    };

    emitBallUpdate(matches[0].match_code, ballUpdate);

    // Clear cache
    await deleteCachePattern(`match:${match_id}:*`);

    res.status(201).json({
      success: true,
      message: "Ball recorded successfully",
      data: ballUpdate
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Record ball error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to record ball",
      error: err.message
    });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Start innings (set opening batsmen and bowler)
 */
const startInningsHandler = async (req, res) => {
  let connection;
  try {
    const { innings_id } = req.params;
    const { batsman1_id, batsman2_id, bowler_id } = req.body;

    if (!batsman1_id || !batsman2_id || !bowler_id) {
      return res.status(400).json({
        success: false,
        message: "batsman1_id, batsman2_id, and bowler_id are required"
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Get innings info
    const [innings] = await connection.execute(
      "SELECT * FROM innings WHERE innings_id = ?",
      [innings_id]
    );

    if (innings.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Innings not found"
      });
    }

    // Create batting stats for both openers
    await connection.execute(
      `INSERT INTO batting_stats (innings_id, match_id, player_id, is_batting, position)
       VALUES (?, ?, ?, TRUE, 1), (?, ?, ?, TRUE, 2)`,
      [innings_id, innings[0].match_id, batsman1_id, innings_id, innings[0].match_id, batsman2_id]
    );

    // Create bowling stats for opening bowler
    await connection.execute(
      `INSERT INTO bowling_stats (innings_id, match_id, player_id, is_bowling)
       VALUES (?, ?, ?, TRUE)`,
      [innings_id, innings[0].match_id, bowler_id]
    );

    // Create partnership
    await connection.execute(
      `INSERT INTO partnerships (innings_id, match_id, batsman1_id, batsman2_id, wicket_number, is_active)
       VALUES (?, ?, ?, ?, 0, TRUE)`,
      [innings_id, innings[0].match_id, batsman1_id, batsman2_id]
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: "Innings started successfully"
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Start innings error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to start innings",
      error: err.message
    });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Change batsman (when wicket falls or retired)
 */
const changeBatsmanHandler = async (req, res) => {
  let connection;
  try {
    const { innings_id } = req.params;
    const { out_batsman_id, new_batsman_id } = req.body;

    if (!out_batsman_id || !new_batsman_id) {
      return res.status(400).json({
        success: false,
        message: "out_batsman_id and new_batsman_id are required"
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Get innings info
    const [innings] = await connection.execute(
      "SELECT * FROM innings WHERE innings_id = ?",
      [innings_id]
    );

    if (innings.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Innings not found"
      });
    }

    // Set old batsman as not batting
    await connection.execute(
      `UPDATE batting_stats SET is_batting = FALSE WHERE innings_id = ? AND player_id = ?`,
      [innings_id, out_batsman_id]
    );

    // Get next position
    const [positions] = await connection.execute(
      `SELECT MAX(position) as max_pos FROM batting_stats WHERE innings_id = ?`,
      [innings_id]
    );

    const nextPosition = (positions[0].max_pos || 0) + 1;

    // Add new batsman
    await connection.execute(
      `INSERT INTO batting_stats (innings_id, match_id, player_id, is_batting, position)
       VALUES (?, ?, ?, TRUE, ?)`,
      [innings_id, innings[0].match_id, new_batsman_id, nextPosition]
    );

    // End current partnership
    await connection.execute(
      `UPDATE partnerships SET is_active = FALSE, wicket_number = ?
       WHERE innings_id = ? AND is_active = TRUE`,
      [innings[0].total_wickets, innings_id]
    );

    // Get other batsman
    const [otherBatsman] = await connection.execute(
      `SELECT player_id FROM batting_stats 
       WHERE innings_id = ? AND is_batting = TRUE AND player_id != ?
       LIMIT 1`,
      [innings_id, new_batsman_id]
    );

    if (otherBatsman.length > 0) {
      // Create new partnership
      await connection.execute(
        `INSERT INTO partnerships (innings_id, match_id, batsman1_id, batsman2_id, wicket_number, is_active)
         VALUES (?, ?, ?, ?, ?, TRUE)`,
        [innings_id, innings[0].match_id, new_batsman_id, otherBatsman[0].player_id, innings[0].total_wickets + 1]
      );
    }

    await connection.commit();

    res.status(200).json({
      success: true,
      message: "Batsman changed successfully"
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Change batsman error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to change batsman",
      error: err.message
    });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Change bowler (at end of over or mid-over)
 */
const changeBowlerHandler = async (req, res) => {
  let connection;
  try {
    const { innings_id } = req.params;
    const { old_bowler_id, new_bowler_id } = req.body;

    if (!new_bowler_id) {
      return res.status(400).json({
        success: false,
        message: "new_bowler_id is required"
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Get innings info
    const [innings] = await connection.execute(
      "SELECT * FROM innings WHERE innings_id = ?",
      [innings_id]
    );

    if (innings.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Innings not found"
      });
    }

    // Set old bowler as not bowling
    if (old_bowler_id) {
      await connection.execute(
        `UPDATE bowling_stats SET is_bowling = FALSE WHERE innings_id = ? AND player_id = ?`,
        [innings_id, old_bowler_id]
      );
    }

    // Set new bowler or create entry
    await connection.execute(
      `INSERT INTO bowling_stats (innings_id, match_id, player_id, is_bowling)
       VALUES (?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE is_bowling = TRUE`,
      [innings_id, innings[0].match_id, new_bowler_id]
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: "Bowler changed successfully"
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Change bowler error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to change bowler",
      error: err.message
    });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * End innings
 */
const endInningsHandler = async (req, res) => {
  let connection;
  try {
    const { innings_id } = req.params;

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Get innings info
    const [innings] = await connection.execute(
      "SELECT * FROM innings WHERE innings_id = ?",
      [innings_id]
    );

    if (innings.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Innings not found"
      });
    }

    const currentInnings = innings[0];

    // Mark innings as completed
    await connection.execute(
      `UPDATE innings SET is_completed = TRUE WHERE innings_id = ?`,
      [innings_id]
    );

    // If this is first innings, create second innings
    if (currentInnings.innings_number === 1) {
      const target = currentInnings.total_runs + 1;
      
      await connection.execute(
        `INSERT INTO innings (match_id, batting_team_id, bowling_team_id, innings_number, target_runs)
         VALUES (?, ?, ?, 2, ?)`,
        [currentInnings.match_id, currentInnings.bowling_team_id, currentInnings.batting_team_id, target]
      );
    } else {
      // Second innings completed - match over
      // Determine winner
      const [firstInnings] = await connection.execute(
        `SELECT total_runs FROM innings WHERE match_id = ? AND innings_number = 1`,
        [currentInnings.match_id]
      );

      let winner_team_id;
      let result_text;

      if (currentInnings.total_runs > firstInnings[0].total_runs) {
        winner_team_id = currentInnings.batting_team_id;
        const wicketsRemaining = 10 - currentInnings.total_wickets;
        result_text = `Team won by ${wicketsRemaining} wickets`;
      } else if (currentInnings.total_runs < firstInnings[0].total_runs) {
        winner_team_id = currentInnings.bowling_team_id;
        const runsDifference = firstInnings[0].total_runs - currentInnings.total_runs;
        result_text = `Team won by ${runsDifference} runs`;
      } else {
        result_text = 'Match tied';
      }

      await connection.execute(
        `UPDATE matches 
         SET status = 'completed', winner_team_id = ?, result_text = ?
         WHERE match_id = ?`,
        [winner_team_id, result_text, currentInnings.match_id]
      );
    }

    await connection.commit();

    // Get match code for WebSocket
    const [matches] = await db.execute(
      "SELECT match_code FROM matches WHERE match_id = ?",
      [currentInnings.match_id]
    );

    emitToMatch(matches[0].match_code, 'innings-ended', {
      innings_number: currentInnings.innings_number
    });

    res.status(200).json({
      success: true,
      message: "Innings ended successfully"
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('End innings error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to end innings",
      error: err.message
    });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  recordBallHandler,
  startInningsHandler,
  changeBatsmanHandler,
  changeBowlerHandler,
  endInningsHandler
};
