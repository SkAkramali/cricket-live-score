const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const mysql = require('mysql2/promise');

// Configuration
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cricket_live_score',
};

// Connection pool (initialized after database verification)
let pool = null;

/**
 * Print configuration (hide password)
 */
const printConfig = () => {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║           MySQL CONNECTION CONFIGURATION                 ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Host:     ${DB_CONFIG.host.padEnd(45)}║`);
  console.log(`║  Port:     ${String(DB_CONFIG.port).padEnd(45)}║`);
  console.log(`║  User:     ${DB_CONFIG.user.padEnd(45)}║`);
  console.log(`║  Password: ${'*'.repeat(Math.min(DB_CONFIG.password.length, 10)).padEnd(45)}║`);
  console.log(`║  Database: ${DB_CONFIG.database.padEnd(45)}║`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');
};

/**
 * Connect to MySQL without specifying database (to create it if needed)
 */
const connectWithoutDatabase = async () => {
  return mysql.createConnection({
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
  });
};

/**
 * Ensure the target database exists
 */
const ensureDatabaseExists = async () => {
  let connection;
  try {
    console.log('Connecting to MySQL server (without database)...');
    connection = await connectWithoutDatabase();
    console.log('✓ Connected to MySQL server');

    // Show all databases
    console.log('\n========== ALL DATABASES ON SERVER ==========');
    const [databases] = await connection.execute('SHOW DATABASES');
    databases.forEach(db => {
      const dbName = Object.values(db)[0];
      const marker = dbName === DB_CONFIG.database ? ' ← TARGET' : '';
      console.log(`  - ${dbName}${marker}`);
    });
    console.log('==============================================\n');

    // Check if target database exists
    const dbExists = databases.some(db => Object.values(db)[0] === DB_CONFIG.database);

    if (!dbExists) {
      console.log(`Database "${DB_CONFIG.database}" does not exist. Creating...`);
      await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`✓ Database "${DB_CONFIG.database}" created successfully`);
    } else {
      console.log(`✓ Database "${DB_CONFIG.database}" exists`);
    }

    await connection.end();
    return true;
  } catch (err) {
    console.error('✗ Failed to connect to MySQL server:', err.message);
    console.error('\nPossible causes:');
    console.error('  1. MySQL server is not running');
    console.error('  2. Wrong host/port (check if MySQL is on a different port)');
    console.error('  3. Wrong username/password');
    console.error('  4. MySQL Workbench uses different instance than Node.js');
    console.error('\nTry these commands:');
    console.error('  - Check MySQL status: mysqladmin -u root -p status');
    console.error('  - Check port: netstat -an | grep 3306');
    if (connection) await connection.end().catch(() => {});
    throw err;
  }
};

/**
 * Create connection pool to the target database
 */
const createPool = () => {
  pool = mysql.createPool({
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
    database: DB_CONFIG.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
  return pool;
};

/**
 * Debug: Show current database info
 */
const debugDatabaseInfo = async () => {
  console.log('\n========== ACTIVE DATABASE INFO ==========');

  // Verify we're connected to the right database
  const [dbResult] = await pool.execute('SELECT DATABASE() as active_db, USER() as connected_user, @@port as port');
  console.log(`  Active Database: ${dbResult[0].active_db}`);
  console.log(`  Connected As:    ${dbResult[0].connected_user}`);
  console.log(`  MySQL Port:      ${dbResult[0].port}`);

  // Show version
  const [versionResult] = await pool.execute('SELECT VERSION() as version');
  console.log(`  MySQL Version:   ${versionResult[0].version}`);

  // Show all tables
  console.log('\n  Tables in database:');
  const [tables] = await pool.execute('SHOW TABLES');
  if (tables.length === 0) {
    console.log('    (No tables found)');
  } else {
    tables.forEach(table => {
      console.log(`    - ${Object.values(table)[0]}`);
    });
  }

  console.log('==========================================\n');
};

/**
 * Check and fix users table schema
 */
const ensureUsersTableSchema = async () => {
  // Check if users table exists
  const [tableExists] = await pool.execute(
    `SELECT COUNT(*) as count FROM information_schema.tables
     WHERE table_schema = ? AND table_name = 'users'`,
    [DB_CONFIG.database]
  );

  if (tableExists[0].count > 0) {
    console.log('Users table exists. Checking schema...');

    // Get current columns
    const [columns] = await pool.execute('DESCRIBE users');
    const columnNames = columns.map(c => c.Field);

    console.log('  Current columns:', columnNames.join(', '));

    // Check for common issues
    if (columnNames.includes('id') && !columnNames.includes('user_id')) {
      console.log('  ⚠ Found "id" instead of "user_id". Renaming...');
      try {
        await pool.execute('ALTER TABLE users CHANGE COLUMN id user_id INT AUTO_INCREMENT');
        console.log('  ✓ Renamed id → user_id');
      } catch (err) {
        console.error('  ✗ Failed to rename column:', err.message);
        console.log('  Try manually: ALTER TABLE users CHANGE COLUMN id user_id INT AUTO_INCREMENT;');
      }
    }

    // Ensure required columns exist
    const requiredColumns = {
      'username': 'VARCHAR(50) UNIQUE',
      'email': 'VARCHAR(100) UNIQUE',
      'password': 'VARCHAR(255)',
      'full_name': 'VARCHAR(100)',
      'phone': 'VARCHAR(20)',
      'role': "ENUM('player', 'scorer', 'admin') DEFAULT 'player'",
      'is_active': 'BOOLEAN DEFAULT TRUE',
      'created_at': 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    };

    for (const [colName, colDef] of Object.entries(requiredColumns)) {
      if (!columnNames.includes(colName)) {
        console.log(`  Adding missing column: ${colName}`);
        try {
          await pool.execute(`ALTER TABLE users ADD COLUMN ${colName} ${colDef}`);
          console.log(`  ✓ Added ${colName}`);
        } catch (err) {
          console.log(`  ⚠ Could not add ${colName}: ${err.message}`);
        }
      }
    }

    return true;
  }

  return false; // Table doesn't exist
};

/**
 * Create all required tables
 */
const createTables = async () => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    console.log('Reading full schema.sql to initialize database...');
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    let schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // MySQL2 pool.query can't natively execute multiple queries easily unless multipleStatements is true on a raw connection.
    // Instead of splitting strings which is dangerous due to triggers/views, we will create a temporary connection with multipleStatements=true.
    
    console.log('Connecting with multipleStatements enabled to execute full schema...');
    const connection = await mysql.createConnection({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
      database: DB_CONFIG.database,
      multipleStatements: true
    });
    
    await connection.query(schemaSql);
    await connection.end();
    
    console.log('✓ All tables created successfully based on schema.sql');
  } catch (err) {
    console.error('Failed to create tables via schema.sql', err);
  }
};

/**
 * Show final schema of users table
 */
const showUsersSchema = async () => {
  console.log('\n========== USERS TABLE SCHEMA ==========');
  try {
    const [columns] = await pool.execute('DESCRIBE users');
    console.log('  Column            | Type                      | Key');
    console.log('  ------------------|---------------------------|--------');
    columns.forEach(col => {
      const name = col.Field.padEnd(17);
      const type = col.Type.padEnd(25);
      const key = col.Key || '';
      console.log(`  ${name} | ${type} | ${key}`);
    });
  } catch (err) {
    console.log('  (Could not describe users table:', err.message, ')');
  }
  console.log('=========================================\n');
};

/**
 * Main initialization function
 */
const initializeDatabase = async () => {
  try {
    // Step 1: Print configuration
    printConfig();

    // Step 2: Ensure database exists (connect without database first)
    await ensureDatabaseExists();

    // Step 3: Create connection pool to target database
    console.log(`Connecting to database "${DB_CONFIG.database}"...`);
    createPool();

    // Step 4: Test connection
    const connection = await pool.getConnection();
    console.log('✓ Connected to database successfully');
    connection.release();

    // Step 5: Show database info
    await debugDatabaseInfo();

    // Step 6: Create/verify tables
    console.log('Initializing tables...');
    await createTables();

    // Step 7: Show final users schema
    await showUsersSchema();

    // Step 8: Final verification
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║         ✓ DATABASE INITIALIZATION COMPLETE              ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    return true;
  } catch (err) {
    console.error('\n╔══════════════════════════════════════════════════════════╗');
    console.error('║         ✗ DATABASE INITIALIZATION FAILED                ║');
    console.error('╚══════════════════════════════════════════════════════════╝');
    console.error('\nError:', err.message);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure MySQL server is running');
    console.error('2. Check .env file has correct DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    console.error('3. Verify MySQL port (default 3306)');
    console.error('4. Try connecting with MySQL Workbench using same credentials');
    console.error('5. Run: mysql -u root -p -e "SHOW DATABASES;"');
    throw err;
  }
};

// Initialize on module load
initializeDatabase().catch(err => {
  console.error('Fatal: Could not initialize database');
  console.error('The application will not function correctly without database access.');
});

// Export pool getter (returns pool or throws if not initialized)
const getPool = () => {
  if (!pool) {
    throw new Error('Database pool not initialized. Check MySQL connection.');
  }
  return pool;
};

// For backward compatibility - export functions that use pool
module.exports = {
  execute: (...args) => getPool().execute(...args),
  query: (...args) => getPool().query(...args),
  getConnection: () => getPool().getConnection(),
  getPool,
  initializeDatabase,
};
