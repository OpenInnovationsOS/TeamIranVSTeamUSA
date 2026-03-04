-- Database initialization script for Docker
-- This script runs when the PostgreSQL container starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for better performance
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

-- Set up database configuration for performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 'on';
ALTER SYSTEM SET pg_stat_statements.track = 'all';

-- Update configuration
SELECT pg_reload_conf();
