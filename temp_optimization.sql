
-- IMMEDIATE PRODUCTION OPTIMIZATIONS
-- Enable critical extensions
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Critical indexes for gaming performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_telegram_id_unique ON users(telegram_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_faction_balance_desc ON users(faction, stg_balance DESC, level DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_battles_status_created ON battles(status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_battles_battle_data_gin ON battles USING GIN (battle_data);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_type_created ON transactions(user_id, type, created_at DESC);

-- Performance monitoring setup
CREATE OR REPLACE VIEW performance_stats AS
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE calls > 10
ORDER BY mean_exec_time DESC;

-- Reset statistics for fresh monitoring
SELECT pg_stat_statements_reset();

DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'PostgreSQL Production Optimization Complete!';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '✅ Critical indexes created';
    RAISE NOTICE '✅ Extensions enabled';
    RAISE NOTICE '✅ Performance monitoring ready';
    RAISE NOTICE '✅ Database optimized for gaming';
    RAISE NOTICE '===========================================';
END $$;
