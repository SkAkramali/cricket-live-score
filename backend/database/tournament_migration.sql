-- ============================================
-- TOURNAMENT MANAGEMENT MIGRATION
-- Add tournament support to existing database
-- ============================================

-- Create tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
    tournament_id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_name VARCHAR(150) NOT NULL,
    description TEXT,
    location VARCHAR(200),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('upcoming', 'active', 'completed', 'cancelled') DEFAULT 'upcoming',
    format ENUM('t20', 'odi', 'test', 'custom') DEFAULT 't20',
    overs_per_side INT DEFAULT 20,
    total_teams INT DEFAULT 0,
    total_matches INT DEFAULT 0,
    created_by INT,
    prize_money DECIMAL(10, 2),
    sponsor_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_tournament_name (tournament_name),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add tournament_id to teams table
ALTER TABLE teams 
ADD COLUMN tournament_id INT AFTER logo_url,
ADD FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id) ON DELETE SET NULL,
ADD INDEX idx_tournament_id (tournament_id);

-- Create tournament_teams junction table
CREATE TABLE IF NOT EXISTS tournament_teams (
    tournament_team_id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT NOT NULL,
    team_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    points INT DEFAULT 0,
    played INT DEFAULT 0,
    won INT DEFAULT 0,
    lost INT DEFAULT 0,
    tied INT DEFAULT 0,
    no_result INT DEFAULT 0,
    runs_for INT DEFAULT 0,
    runs_against INT DEFAULT 0,
    wickets_for INT DEFAULT 0,
    wickets_against INT DEFAULT 0,
    net_run_rate DECIMAL(6, 3) DEFAULT 0.000,
    position INT,
    UNIQUE KEY unique_tournament_team (tournament_id, team_id),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE,
    INDEX idx_tournament_id (tournament_id),
    INDEX idx_team_id (team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add tournament_id to matches table if not exists
ALTER TABLE matches 
ADD COLUMN tournament_id INT AFTER match_code,
ADD FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id) ON DELETE SET NULL,
ADD INDEX idx_tournament_id_matches (tournament_id);
