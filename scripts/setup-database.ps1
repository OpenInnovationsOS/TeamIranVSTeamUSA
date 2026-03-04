# Database setup script for Team Iran vs Team USA game (PowerShell version)
# This script sets up PostgreSQL database and runs migrations

Write-Host "🗄️ Setting up database for Team Iran vs Team USA game..." -ForegroundColor Green

# Configuration
$DB_NAME = "team_iran_vs_usa"
$DB_USER = "postgres"
$DB_PASSWORD = "demo_password"
$DB_HOST = "localhost"
$DB_PORT = "5432"

# Function to print colored output
function Print-Status($message) {
    Write-Host "[INFO] $message" -ForegroundColor Green
}

function Print-Warning($message) {
    Write-Host "[WARNING] $message" -ForegroundColor Yellow
}

function Print-Error($message) {
    Write-Host "[ERROR] $message" -ForegroundColor Red
}

# Check if PostgreSQL is running
try {
    $result = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT 1;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Print-Status "PostgreSQL is running"
    } else {
        throw "PostgreSQL connection failed"
    }
} catch {
    Print-Error "PostgreSQL is not running on $DB_HOST:$DB_PORT"
    Write-Host "Please start PostgreSQL service:"
    Write-Host "  Windows: Start PostgreSQL service from Services"
    Write-Host "  Ubuntu/Debian: sudo systemctl start postgresql"
    Write-Host "  macOS: brew services start postgresql"
    exit 1
}

# Check if database exists
try {
    $result = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';" 2>$null
    if ($result -eq "1") {
        Print-Warning "Database $DB_NAME already exists"
    } else {
        Print-Status "Creating database: $DB_NAME"
        & createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
        if ($LASTEXITCODE -eq 0) {
            Print-Status "Database created successfully"
        } else {
            Print-Error "Failed to create database"
            exit 1
        }
    }
} catch {
    Print-Error "Database check failed"
    exit 1
}

# Test database connection
Print-Status "Testing database connection..."
try {
    $env:PGPASSWORD = $DB_PASSWORD
    $result = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Print-Status "Database connection successful"
    } else {
        throw "Connection failed"
    }
} catch {
    Print-Error "Database connection failed"
    exit 1
}

# Run database migrations
Print-Status "Running database migrations..."
Set-Location (Split-Path -Parent $PSScriptRoot)
$env:NODE_ENV = "production"
try {
    & npm run migrate
    if ($LASTEXITCODE -eq 0) {
        Print-Status "Database migrations completed successfully"
    } else {
        Print-Error "Database migrations failed"
        exit 1
    }
} catch {
    Print-Error "Database migrations failed"
    exit 1
}

# Seed initial data
Print-Status "Seeding initial data..."
try {
    & npm run seed
    if ($LASTEXITCODE -eq 0) {
        Print-Status "Database seeding completed successfully"
    } else {
        Print-Error "Database seeding failed"
        exit 1
    }
} catch {
    Print-Error "Database seeding failed"
    exit 1
}

# Create indexes for performance
Print-Status "Creating database indexes..."
$env:PGPASSWORD = $DB_PASSWORD
$indexes = @"
-- Critical indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_faction ON users(faction);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_battles_attacker ON battles(attacker_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_battles_defender ON battles(defender_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_battles_status ON battles(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_battles_created_at ON battles(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_territories_controlling_faction ON territories(controlling_faction);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_territories_updated_at ON territories(updated_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_missions_user_id ON user_missions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_missions_mission_id ON user_missions(mission_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_missions_completed ON user_missions(is_completed);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_missions_active ON daily_missions(is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_missions_valid_until ON daily_missions(valid_until);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_events_active ON game_events(is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_events_type ON game_events(event_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_events_user_id ON user_events(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_events_event_id ON user_events(event_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Update statistics
ANALYZE;
"@

try {
    $indexes | & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME
    if ($LASTEXITCODE -eq 0) {
        Print-Status "Database indexes created successfully"
    } else {
        Print-Warning "Some indexes may already exist (this is normal)"
    }
} catch {
    Print-Warning "Index creation failed (indexes may already exist)"
}

# Verify database setup
Print-Status "Verifying database setup..."
try {
    $tableCount = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>$null
    if ([int]$tableCount -gt 0) {
        Print-Status "Database setup completed successfully"
        Print-Status "Tables created: $tableCount"
        Print-Status "Database is ready for production use!"
    } else {
        Print-Error "Database setup verification failed"
        exit 1
    }
} catch {
    Print-Error "Database setup verification failed"
    exit 1
}

Write-Host ""
Write-Host "🎉 Database setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Database Information:" -ForegroundColor Cyan
Write-Host "  Host: $DB_HOST:$DB_PORT"
Write-Host "  Name: $DB_NAME"
Write-Host "  User: $DB_USER"
Write-Host ""
Write-Host "🔗 Connection URL:" -ForegroundColor Cyan
Write-Host "  postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
Write-Host ""
Write-Host "✅ Ready to start the application!" -ForegroundColor Green
