const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/**
 * Verifies the database connection by running a lightweight diagnostic query.
 *
 * Root cause of the SQL syntax error that prompted this fix:
 *   Using bare `current_user` (a reserved keyword) in a SELECT list without
 *   parentheses causes MySQL to raise:
 *     "You have an error in your SQL syntax … near 'current_user, @@port as port'"
 *   The fix is to call it as a function: CURRENT_USER().
 *
 * Correct diagnostic query:
 *   SELECT CURRENT_USER() AS current_user, @@port AS port
 */
const testConnection = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    // CURRENT_USER() must be called with parentheses – bare `current_user`
    // is a reserved keyword and causes a SQL syntax error in MySQL.
    const [rows] = await connection.execute(
      'SELECT CURRENT_USER() AS current_user, @@port AS port'
    );
    console.log(
      `Database connected successfully — user: ${rows[0].current_user}, port: ${rows[0].port}`
    );
  } catch (err) {
    console.error('Fatal: Could not initialize database.');
    console.error(`Error: ${err.message}`);
    console.error('The application will not function correctly without database access.');
    console.error('\nTroubleshooting suggestions:');
    console.error('  1. Ensure MySQL server is running.');
    console.error('  2. Check your .env file has the correct DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME values.');
    console.error('  3. Verify MySQL is listening on the expected port (default: 3306).');
    console.error('  4. Try connecting with MySQL Workbench using the same credentials.');
    console.error('  5. Run: mysql -u root -p -e "SHOW DATABASES;"');
    console.error('     If you get "mysql is not recognized", add the MySQL bin directory to your PATH:');
    console.error('       Windows: Add C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin to System PATH,');
    console.error('       then open a new terminal and retry.');
    process.exit(1);
  } finally {
    if (connection) connection.release();
  }
};

testConnection().catch((err) => {
  console.error('Unexpected error during database initialization:', err.message);
  process.exit(1);
});

module.exports = pool;
