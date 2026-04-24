require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const LOG = path.join(__dirname, 'db-inspect-log.txt');
function log(msg) {
  fs.appendFileSync(LOG, msg + '\n', 'ascii');
}

async function inspect() {
  fs.writeFileSync(LOG, '', 'ascii');
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'akram7282',
      database: process.env.DB_NAME || 'cricket',
      multipleStatements: true,
    });

    log('=== TABLES ===');
    const [tables] = await connection.query('SHOW TABLES;');
    tables.forEach(t => log(Object.values(t)[0]));

    log('\n=== FOREIGN KEYS on each table ===');
    const [fks] = await connection.query(`
      SELECT TABLE_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'cricket'}'
        AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY TABLE_NAME;
    `);
    fks.forEach(r => log(r.TABLE_NAME + ' -> ' + r.REFERENCED_TABLE_NAME + ' [' + r.CONSTRAINT_NAME + ']'));

  } catch (err) {
    log('[ERROR] ' + err.message);
  } finally {
    if (connection) await connection.end();
    log('Done.');
  }
}

inspect();
