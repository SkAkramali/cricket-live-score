require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  try {
    console.log('Connecting to MySQL...');
    // Connect without database first to create it
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'akram7282',
      multipleStatements: true
    });

    const dbName = process.env.DB_NAME || 'cricket';
    
    console.log(`Creating database ${dbName} if not exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.query(`USE \`${dbName}\`;`);

    console.log('Reading schema.sql...');
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    let schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // We must remove the CREATE INDEX statements because they will throw "Duplicate key"
    // if the table already existed, halting execution!
    schemaSql = schemaSql.replace(/CREATE INDEX.*?;/g, '');

    console.log('Executing schema.sql...');
    await connection.query(schemaSql);
    
    console.log('Database tables created successfully!');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.log('Error setting up database:');
    console.log(error);
    process.exit(1);
  }
}

setupDatabase();
