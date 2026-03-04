@echo off
echo 🗄️ Setting up database for Team Iran vs Team USA game...

REM Configuration
set DB_NAME=team_iran_vs_usa
set DB_USER=postgres
set DB_PASSWORD=demo_password
set DB_HOST=localhost
set DB_PORT=5432

echo [INFO] Checking PostgreSQL installation...
where psql >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] PostgreSQL is not installed or not in PATH
    echo Please install PostgreSQL from https://www.postgresql.org/download/
    pause
    exit /b 1
)

echo [INFO] PostgreSQL found

echo [INFO] Testing PostgreSQL connection...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres -c "SELECT 1;" >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Cannot connect to PostgreSQL
    echo Please check if PostgreSQL is running and credentials are correct
    pause
    exit /b 1
)

echo [INFO] PostgreSQL connection successful

echo [INFO] Creating database if not exists...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres -c "CREATE DATABASE %DB_NAME%;" >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Database may already exist (this is normal)
) else (
    echo [INFO] Database created successfully
)

echo [INFO] Testing database connection...
set PGPASSWORD=%DB_PASSWORD%
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT 1;" >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Cannot connect to database %DB_NAME%
    pause
    exit /b 1
)

echo [INFO] Database connection successful

echo [INFO] Running database migrations...
set NODE_ENV=production
call npm run migrate
if %errorlevel% neq 0 (
    echo [ERROR] Database migrations failed
    pause
    exit /b 1
)

echo [INFO] Database migrations completed successfully

echo [INFO] Seeding initial data...
call npm run seed
if %errorlevel% neq 0 (
    echo [ERROR] Database seeding failed
    pause
    exit /b 1
)

echo [INFO] Database seeding completed successfully

echo [INFO] Creating database indexes...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);" >nul 2>&1
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_faction ON users(faction);" >nul 2>&1
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_referral_code ON users(referral_code);" >nul 2>&1
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_battles_attacker ON battles(attacker_id);" >nul 2>&1
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_battles_defender ON battles(defender_id);" >nul 2>&1
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_battles_status ON battles(status);" >nul 2>&1
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_battles_created_at ON battles(created_at);" >nul 2>&1
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);" >nul 2>&1
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_type ON transactions(type);" >nul 2>&1
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);" >nul 2>&1
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_territories_controlling_faction ON territories(controlling_faction);" >nul 2>&1
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_territories_updated_at ON territories(updated_at);" >nul 2>&1
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_missions_user_id ON user_missions(user_id);" >nul 2>&1
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_missions_mission_id ON user_missions(mission_id);" >nul 2>&1
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_missions_completed ON user_missions(is_completed);" >nul 2>&1
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_missions_active ON daily_missions(is_active);" >nul 2>&1
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_missions_valid_until ON daily_missions(valid_until);" >nul 2>&1
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_events_active ON game_events(is_active);" >nul 2>&1
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_events_type ON game_events(event_type);" >nul 2>&1
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_events_user_id ON user_events(user_id);" >nul 2>&1
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_events_event_id ON user_events(event_id);" >nul 2>&1
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);" >nul 2>&1
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);" >nul 2>&1
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "ANALYZE;" >nul 2>&1

echo [INFO] Database indexes created successfully

echo [INFO] Verifying database setup...
for /f "tokens=*" %%i in ('psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"') do set TABLE_COUNT=%%i

if %TABLE_COUNT% gtr 0 (
    echo [INFO] Database setup completed successfully
    echo [INFO] Tables created: %TABLE_COUNT%
    echo [INFO] Database is ready for production use!
) else (
    echo [ERROR] Database setup verification failed
    pause
    exit /b 1
)

echo.
echo 🎉 Database setup completed successfully!
echo.
echo 📊 Database Information:
echo   Host: %DB_HOST%:%DB_PORT%
echo   Name: %DB_NAME%
echo   User: %DB_USER%
echo.
echo 🔗 Connection URL:
echo   postgresql://%DB_USER%:%DB_PASSWORD%@%DB_HOST%:%DB_PORT%/%DB_NAME%
echo.
echo ✅ Ready to start the application!
pause
