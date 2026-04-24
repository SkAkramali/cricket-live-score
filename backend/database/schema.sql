-- ============================================================
--  Cricket Live Score — Schema
--  Table order respects FK dependencies (no forward references).
--  Safe to re-run: CREATE TABLE IF NOT EXISTS everywhere.
-- ============================================================

-- ── 1. Users ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  user_id    INT AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(50)  UNIQUE NOT NULL,
  email      VARCHAR(100) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  full_name  VARCHAR(100),
  phone      VARCHAR(20),
  role       ENUM('player','scorer','admin') DEFAULT 'player',
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── 2. Tournaments ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tournaments (
  tournament_id   INT AUTO_INCREMENT PRIMARY KEY,
  tournament_name VARCHAR(150) NOT NULL,
  description     TEXT,
  location        VARCHAR(150),
  start_date      DATE,
  end_date        DATE,
  format          ENUM('t20','odi','test','t10','custom') DEFAULT 't20',
  overs_per_side  INT DEFAULT 20,
  status          ENUM('upcoming','live','completed') DEFAULT 'upcoming',
  join_code       VARCHAR(8) UNIQUE,
  prize_money     DECIMAL(12,2),
  sponsor_name    VARCHAR(100),
  total_teams     INT DEFAULT 0,
  created_by      INT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ── 3. Teams ───────────────────────────────────────────────────
--  Must come BEFORE tournament_teams (which FKs into teams).
CREATE TABLE IF NOT EXISTS teams (
  team_id         INT AUTO_INCREMENT PRIMARY KEY,
  team_name       VARCHAR(100) NOT NULL,
  team_short_name VARCHAR(10),
  logo_url        VARCHAR(255),
  coach_name      VARCHAR(100),
  home_ground     VARCHAR(150),
  tournament_id   INT,
  created_by      INT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id) ON DELETE SET NULL,
  FOREIGN KEY (created_by)    REFERENCES users(user_id)             ON DELETE SET NULL
);

-- ── 4. Tournament Teams (standings) ───────────────────────────
--  Now teams exists, so FKs resolve.
CREATE TABLE IF NOT EXISTS tournament_teams (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  tournament_id   INT NOT NULL,
  team_id         INT NOT NULL,
  points          INT DEFAULT 0,
  played          INT DEFAULT 0,
  won             INT DEFAULT 0,
  lost            INT DEFAULT 0,
  tied            INT DEFAULT 0,
  no_result       INT DEFAULT 0,
  runs_for        INT DEFAULT 0,
  runs_against    INT DEFAULT 0,
  wickets_for     INT DEFAULT 0,
  wickets_against INT DEFAULT 0,
  net_run_rate    DECIMAL(8,3) DEFAULT 0.000,
  position        INT DEFAULT 0,
  joined_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_team_tournament (tournament_id, team_id),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id) ON DELETE CASCADE,
  FOREIGN KEY (team_id)       REFERENCES teams(team_id)             ON DELETE CASCADE
);

-- ── 5. Players ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS players (
  player_id      INT AUTO_INCREMENT PRIMARY KEY,
  player_name    VARCHAR(100) NOT NULL,
  team_id        INT,
  role           ENUM('batsman','bowler','all-rounder','wicketkeeper') DEFAULT 'batsman',
  batting_style  ENUM('right-hand','left-hand') DEFAULT 'right-hand',
  bowling_style  VARCHAR(50),
  jersey_number  INT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE SET NULL
);

-- ── 6. Matches ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matches (
  match_id        INT AUTO_INCREMENT PRIMARY KEY,
  match_code      VARCHAR(10) UNIQUE,
  tournament_id   INT,
  team1_id        INT,
  team2_id        INT,
  match_date      DATETIME,
  venue           VARCHAR(150),
  status          ENUM('scheduled','live','completed','abandoned') DEFAULT 'scheduled',
  toss_winner     INT,
  toss_decision   ENUM('bat','bowl'),
  winner_team_id  INT,
  result          VARCHAR(255),
  result_text     VARCHAR(255),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id)  REFERENCES tournaments(tournament_id) ON DELETE SET NULL,
  FOREIGN KEY (team1_id)       REFERENCES teams(team_id),
  FOREIGN KEY (team2_id)       REFERENCES teams(team_id),
  FOREIGN KEY (toss_winner)    REFERENCES teams(team_id),
  FOREIGN KEY (winner_team_id) REFERENCES teams(team_id)
);

-- ── 7. Innings ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS innings (
  innings_id      INT AUTO_INCREMENT PRIMARY KEY,
  match_id        INT NOT NULL,
  innings_number  INT NOT NULL,
  batting_team_id INT,
  bowling_team_id INT,
  total_runs      INT DEFAULT 0,
  total_wickets   INT DEFAULT 0,
  total_overs     DECIMAL(5,1) DEFAULT 0.0,
  total_balls     INT DEFAULT 0,
  extras          INT DEFAULT 0,
  extras_total    INT DEFAULT 0,
  extras_wides    INT DEFAULT 0,
  extras_noballs  INT DEFAULT 0,
  extras_byes     INT DEFAULT 0,
  extras_legbyes  INT DEFAULT 0,
  target_runs     INT DEFAULT 0,
  is_completed    BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id)        REFERENCES matches(match_id) ON DELETE CASCADE,
  FOREIGN KEY (batting_team_id) REFERENCES teams(team_id),
  FOREIGN KEY (bowling_team_id) REFERENCES teams(team_id)
);

-- ── 8. Ball by Ball ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ball_by_ball (
  ball_id             INT AUTO_INCREMENT PRIMARY KEY,
  match_id            INT,
  innings_id          INT,
  over_number         INT,
  ball_number         INT,
  batsman_id          INT,
  non_striker_id      INT,
  bowler_id           INT,
  runs_scored         INT DEFAULT 0,
  extras              INT DEFAULT 0,
  extra_type          ENUM('none','wide','no-ball','bye','leg-bye') DEFAULT 'none',
  ball_type           ENUM('legal','wide','noball') DEFAULT 'legal',
  is_wicket           BOOLEAN DEFAULT FALSE,
  wicket_type         ENUM('bowled','caught','lbw','run-out','stumped','hit-wicket','retired') DEFAULT NULL,
  dismissed_player_id INT,
  fielder_id          INT,
  commentary          VARCHAR(255),
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id)             REFERENCES matches(match_id)   ON DELETE CASCADE,
  FOREIGN KEY (innings_id)           REFERENCES innings(innings_id) ON DELETE CASCADE,
  FOREIGN KEY (batsman_id)           REFERENCES players(player_id)  ON DELETE SET NULL,
  FOREIGN KEY (bowler_id)            REFERENCES players(player_id)  ON DELETE SET NULL,
  FOREIGN KEY (dismissed_player_id)  REFERENCES players(player_id)  ON DELETE SET NULL
);

-- ── 9. Batting Stats ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS batting_stats (
  id                     INT AUTO_INCREMENT PRIMARY KEY,
  innings_id             INT NOT NULL,
  match_id               INT NOT NULL,
  player_id              INT NOT NULL,
  runs_scored            INT DEFAULT 0,
  balls_faced            INT DEFAULT 0,
  fours                  INT DEFAULT 0,
  sixes                  INT DEFAULT 0,
  strike_rate            DECIMAL(6,2) DEFAULT 0.00,
  is_batting             BOOLEAN DEFAULT FALSE,
  position               INT DEFAULT 1,
  dismissal_type         VARCHAR(50),
  dismissed_by_player_id INT,
  fielder_player_id      INT,
  UNIQUE KEY uq_batting (innings_id, player_id),
  FOREIGN KEY (innings_id) REFERENCES innings(innings_id) ON DELETE CASCADE,
  FOREIGN KEY (match_id)   REFERENCES matches(match_id)   ON DELETE CASCADE,
  FOREIGN KEY (player_id)  REFERENCES players(player_id)  ON DELETE CASCADE
);

-- ── 10. Bowling Stats ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bowling_stats (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  innings_id    INT NOT NULL,
  match_id      INT NOT NULL,
  player_id     INT NOT NULL,
  overs_bowled  DECIMAL(5,1) DEFAULT 0.0,
  runs_conceded INT DEFAULT 0,
  wickets_taken INT DEFAULT 0,
  maidens       INT DEFAULT 0,
  wides         INT DEFAULT 0,
  noballs       INT DEFAULT 0,
  economy_rate  DECIMAL(6,2) DEFAULT 0.00,
  is_bowling    BOOLEAN DEFAULT FALSE,
  UNIQUE KEY uq_bowling (innings_id, player_id),
  FOREIGN KEY (innings_id) REFERENCES innings(innings_id) ON DELETE CASCADE,
  FOREIGN KEY (match_id)   REFERENCES matches(match_id)   ON DELETE CASCADE,
  FOREIGN KEY (player_id)  REFERENCES players(player_id)  ON DELETE CASCADE
);

-- ── 11. Partnerships ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partnerships (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  innings_id    INT NOT NULL,
  match_id      INT NOT NULL,
  batsman1_id   INT,
  batsman2_id   INT,
  runs          INT DEFAULT 0,
  balls         INT DEFAULT 0,
  wicket_number INT DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (innings_id) REFERENCES innings(innings_id) ON DELETE CASCADE,
  FOREIGN KEY (match_id)   REFERENCES matches(match_id)   ON DELETE CASCADE
);

-- ── 12. Match History View ────────────────────────────────────
CREATE OR REPLACE VIEW vw_match_history AS
SELECT
  m.match_id,
  m.match_code,
  m.match_date,
  m.venue,
  m.status,
  m.result,
  m.result_text,
  t1.team_name  AS team1,
  t2.team_name  AS team2,
  tr.tournament_name
FROM matches m
LEFT JOIN teams       t1 ON m.team1_id      = t1.team_id
LEFT JOIN teams       t2 ON m.team2_id      = t2.team_id
LEFT JOIN tournaments tr ON m.tournament_id = tr.tournament_id;
