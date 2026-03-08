# CRICKET LIVE SCORE WEBSITE

- FOR LOCAL MATCHS OR TOURNMENTS (Gully cricket) ADMIN WILL UPDATE SCORE. 
- THE WEBSITE IS NOT DEVELOPED YET IN PROGRESS.
  
> NOTE: This website does not display any INTERNATIONAL or IPL Match Scores

## Steps To Run The Website:
1. Run `npm i ` OR `npm install` in Main, Backend and Frontend Folder.
2. Run `npm run dev` in Backend and Frontend.

## Database Setup

1. Copy `backend/.env.example` to `backend/.env` and fill in your MySQL credentials:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=cricket_live_score
   ```
2. Make sure your MySQL server is running on port **3306** (default).
3. Create the database if it does not exist yet:
   ```sql
   CREATE DATABASE IF NOT EXISTS cricket_live_score;
   ```

## Troubleshooting MySQL Connection Errors

### SQL Syntax Error: `current_user`

If you see an error like:
```
You have an error in your SQL syntax; check the manual that corresponds to your MySQL
server version for the right syntax to use near 'current_user, @@port as port' at line 1
```

**Root cause:** `current_user` is a reserved keyword in MySQL. Using it bare (without
parentheses) in a `SELECT` list causes a syntax error.

**Fix:** Always call it as a function with parentheses:
```sql
-- WRONG (causes syntax error)
SELECT current_user, @@port AS port;

-- CORRECT
SELECT CURRENT_USER() AS current_user, @@port AS port;
```

### "mysql is not recognized as an internal or external command" (Windows)

MySQL's CLI tools are not on your system `PATH`. Fix:

1. Find your MySQL installation directory, e.g.:
   ```
   C:\Program Files\MySQL\MySQL Server 8.0\bin
   ```
2. Open **System Properties → Advanced → Environment Variables**.
3. Under **System variables**, select **Path** and click **Edit**.
4. Click **New** and add the path from step 1.
5. Click **OK**, close all dialogs, then open a **new** terminal.
6. Verify: `mysql --version`

### Step-by-step connection check

```bash
# 1. Confirm MySQL is running
mysql -u root -p -e "SHOW DATABASES;"

# 2. Confirm the target database exists
mysql -u root -p -e "SHOW DATABASES LIKE 'cricket_live_score';"

# 3. Confirm the user and port used by your application
mysql -u root -p -e "SELECT CURRENT_USER() AS current_user, @@port AS port;"

# 4. Test that the application user has the correct permissions
mysql -u root -p -e "SHOW GRANTS FOR 'your_db_user'@'localhost';"
```

If all of the above commands succeed but the application still fails, double-check that
`backend/.env` exists and contains the correct values.

