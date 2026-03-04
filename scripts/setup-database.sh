#!/bin/bash

# Database setup script for Team Iran vs Team USA game
# This script sets up PostgreSQL database and runs migrations

set -e

echo "🗄️ Setting up database for Team Iran vs Team USA game..."

# Configuration
DB_NAME="team_iran_vs_usa"
DB_USER="postgres"
DB_PASSWORD="demo_password"
DB_HOST="localhost"
DB_PORT="5432"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if PostgreSQL is running
if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    print_error "PostgreSQL is not running on $DB_HOST:$DB_PORT"
    echo "Please start PostgreSQL service:"
    echo "  Ubuntu/Debian: sudo systemctl start postgresql"
    echo "  macOS: brew services start postgresql"
    echo "  Windows: Start PostgreSQL service"
    exit 1
fi

print_status "PostgreSQL is running"

# Check if user exists
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" > /dev/null; then
    print_status "Creating database user: $DB_USER"
    sudo -u postgres createuser -s $DB_USER
    
    # Set password for user
    sudo -u postgres psql -c "ALTER USER $DB_USER PASSWORD '$DB_PASSWORD';"
    print_status "Database user created successfully"
else
    print_status "Database user $DB_USER already exists"
fi

# Check if database exists
if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    print_status "Creating database: $DB_NAME"
    sudo -u postgres createdb -O $DB_USER $DB_NAME
    print_status "Database created successfully"
else
    print_warning "Database $DB_NAME already exists"
fi

# Test database connection
print_status "Testing database connection..."
if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    print_status "Database connection successful"
else
    print_error "Database connection failed"
    exit 1
fi

# Run database migrations
print_status "Running database migrations..."
cd "$(dirname "$0")/.."
NODE_ENV=production npm run migrate

if [ $? -eq 0 ]; then
    print_status "Database migrations completed successfully"
else
    print_error "Database migrations failed"
    exit 1
fi

# Seed initial data
print_status "Seeding initial data..."
NODE_ENV=production npm run seed

if [ $? -eq 0 ]; then
    print_status "Database seeding completed successfully"
else
    print_error "Database seeding failed"
    exit 1
fi

# Create indexes for performance
print_status "Creating database indexes..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
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
EOF

if [ $? -eq 0 ]; then
    print_status "Database indexes created successfully"
else
    print_warning "Some indexes may already exist (this is normal)"
fi

# Verify database setup
print_status "Verifying database setup..."
TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

if [ "$TABLE_COUNT" -gt 0 ]; then
    print_status "Database setup completed successfully"
    print_status "Tables created: $TABLE_COUNT"
    print_status "Database is ready for production use!"
else
    print_error "Database setup verification failed"
    exit 1
fi

echo ""
echo "🎉 Database setup completed successfully!"
echo ""
echo "📊 Database Information:"
echo "  Host: $DB_HOST:$DB_PORT"
echo "  Name: $DB_NAME"
echo "  User: $DB_USER"
echo ""
echo "🔗 Connection URL:"
echo "  postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "✅ Ready to start the application!"
