-- Migration script to update existing database to new schema
-- Run this carefully if you have existing data

-- First, backup your existing data before running this migration!

-- STEP 1: Rename logininfo table to users if it exists
-- Run this command manually if your table is named 'logininfo':
-- RENAME TABLE logininfo TO users;

-- Or use this conditional approach (MySQL 8.0+):
-- SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'logininfo');
-- SET @sql = IF(@table_exists > 0, 'RENAME TABLE logininfo TO users', 'SELECT 1');
-- PREPARE stmt FROM @sql;
-- EXECUTE stmt;
-- DEALLOCATE PREPARE stmt;

-- STEP 2: Add new columns to users table (if upgrading from logininfo)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS full_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS role ENUM('player', 'scorer', 'admin') DEFAULT 'player',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add match_code to matches table
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS match_code VARCHAR(10) UNIQUE,
ADD COLUMN IF NOT EXISTS overs_per_side INT DEFAULT 20,
ADD COLUMN IF NOT EXISTS match_type ENUM('t20', 'odi', 'test', 'custom') DEFAULT 't20',
ADD COLUMN IF NOT EXISTS batting_first_team_id INT,
ADD COLUMN IF NOT EXISTS winner_team_id INT,
ADD COLUMN IF NOT EXISTS result_text VARCHAR(255),
ADD COLUMN IF NOT EXISTS created_by INT;

-- Update matches table status values
ALTER TABLE matches 
MODIFY COLUMN status ENUM('scheduled', 'live', 'completed', 'cancelled') DEFAULT 'scheduled';

-- Generate match codes for existing matches without codes
UPDATE matches 
SET match_code = CONCAT('M', LPAD(match_id, 6, '0'))
WHERE match_code IS NULL;

-- Add indexes to matches
CREATE INDEX IF NOT EXISTS idx_match_code ON matches(match_code);
CREATE INDEX IF NOT EXISTS idx_match_status_date ON matches(status, match_date);

-- Add indexes to players
CREATE INDEX IF NOT EXISTS idx_player_name ON players(player_name);
CREATE INDEX IF NOT EXISTS idx_team_id ON players(team_id);

-- Create new tables if they don't exist
CREATE TABLE IF NOT EXISTS match_players (
    match_player_id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    player_id INT NOT NULL,
    team_id INT NOT NULL,
    is_playing_11 BOOLEAN DEFAULT TRUE,
    batting_order INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE,
    UNIQUE KEY unique_match_player (match_id, player_id),
    INDEX idx_match_id (match_id),
    INDEX idx_player_id (player_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Note: For a complete migration, review the full schema.sql file
-- and create remaining tables (batting_stats, bowling_stats, partnerships, ball_by_ball)
