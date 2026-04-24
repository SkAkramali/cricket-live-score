require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const LOG = path.join(__dirname, 'db-run-log.txt');
function log(msg) {
  const line = msg + '\n';
  process.stdout.write(line);
  fs.appendFileSync(LOG, line, 'ascii');
}

async function runSchema() {
  // Clear old log
  fs.writeFileSync(LOG, '', 'ascii');
  let connection;
  try {
    log('Connecting to MySQL...');
    const host = process.env.DB_HOST || 'localhost';
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || 'akram7282';
    const dbName = process.env.DB_NAME || 'cricket';
    log('Host: ' + host + ' | User: ' + user + ' | DB: ' + dbName);

    connection = await mysql.createConnection({
      host,
      user,
      password,
      multipleStatements: true,
    });

    log('Connected! Creating database "' + dbName + '" if not exists...');
    await connection.query('CREATE DATABASE IF NOT EXISTS `' + dbName + '`;');
    await connection.query('USE `' + dbName + '`;');

    log('Reading schema.sql...');
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    log('Schema file size: ' + schemaSql.length + ' bytes, running...');

    await connection.query(schemaSql);

    log('[SUCCESS] Schema applied successfully!');

    const [tables] = await connection.query('SHOW TABLES;');
    log('Tables (' + tables.length + '):');
    tables.forEach(t => log('  - ' + Object.values(t)[0]));

    const [views] = await connection.query(
      "SELECT TABLE_NAME FROM information_schema.VIEWS WHERE TABLE_SCHEMA = '" + dbName + "';"
    );
    log('Views (' + views.length + '):');
    views.forEach(v => log('  - ' + v.TABLE_NAME));

  } catch (err) {
    log('[ERROR] ' + err.message);
    log('Code: ' + err.code);
    log('sqlState: ' + err.sqlState);
    if (err.sql) log('SQL snippet: ' + String(err.sql).substring(0, 400));
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
    log('Done.');
  }
}

runSchema();
