-- 🏆 Materialized Views for High-Performance Leaderboards
-- Team Iran vs Team USA - Real-time Rankings

-- ============================================================================
-- GLOBAL LEADERBOARD - TOP 1000 PLAYERS
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_global_leaderboard_top1000 AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY u.stg_balance DESC, u.level DESC, u.experience DESC, u.created_at ASC) as global_rank,
    u.id as user_id,
    u.telegram_id,
    u.username,
    u.first_name,
    u.faction,
    u.stg_balance,
    u.level,
    u.experience,
    u.referral_code,
    u.created_at as join_date,
    u.last_login,
    -- Battle statistics
    COALESCE(battle_stats.total_battles, 0) as total_battles,
    COALESCE(battle_stats.won_battles, 0) as won_battles,
    COALESCE(battle_stats.lost_battles, 0) as lost_battles,
    CASE 
        WHEN COALESCE(battle_stats.total_battles, 0) > 0 
        THEN ROUND((COALESCE(battle_stats.won_battles, 0)::NUMERIC / COALESCE(battle_stats.total_battles, 0)) * 100, 2)
        ELSE 0 
    END as win_rate,
    COALESCE(battle_stats.total_wagered, 0) as total_wagered,
    COALESCE(battle_stats.avg_wager, 0) as avg_wager,
    -- Referral statistics
    COALESCE(referral_stats.referral_count, 0) as referral_count,
    COALESCE(referral_stats.referral_earnings, 0) as referral_earnings,
    -- Achievement score (weighted ranking)
    ROUND(
        (u.stg_balance * 0.4) + 
        (u.level * 1000 * 0.3) + 
        (u.experience * 0.2) + 
        (COALESCE(battle_stats.won_battles, 0) * 100 * 0.1)
    ) as achievement_score
FROM users u
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as total_battles,
        COUNT(CASE WHEN winner_id = user_id THEN 1 END) as won_battles,
        COUNT(CASE WHEN winner_id != user_id AND winner_id IS NOT NULL THEN 1 END) as lost_battles,
        SUM(stg_wager) as total_wagered,
        ROUND(AVG(stg_wager), 2) as avg_wager
    FROM (
        SELECT attacker_id as user_id, winner_id, stg_wager FROM battles
        UNION ALL
        SELECT defender_id as user_id, winner_id, stg_wager FROM battles
    ) all_battles
    WHERE status = 'completed'
    GROUP BY user_id
) battle_stats ON u.id = battle_stats.user_id
LEFT JOIN (
    SELECT 
        referred_by,
        COUNT(*) as referral_count,
        SUM(CASE WHEN t.type = 'stg' AND t.description LIKE '%referral%' THEN t.amount ELSE 0 END) as referral_earnings
    FROM users u2
    LEFT JOIN transactions t ON u2.id = t.user_id
    WHERE u2.referred_by IS NOT NULL
    GROUP BY u2.referred_by
) referral_stats ON u.id = referral_stats.referred_by
WHERE u.is_active = true
ORDER BY u.stg_balance DESC, u.level DESC, u.experience DESC, u.created_at ASC
LIMIT 1000;

-- ============================================================================
-- FACTION-SPECIFIC LEADERBOARDS
-- ============================================================================

-- Iran Faction Leaderboard - Top 500
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_iran_leaderboard_top500 AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY u.stg_balance DESC, u.level DESC, u.experience DESC) as iran_rank,
    u.id as user_id,
    u.telegram_id,
    u.username,
    u.first_name,
    u.stg_balance,
    u.level,
    u.experience,
    COALESCE(battle_stats.total_battles, 0) as total_battles,
    COALESCE(battle_stats.won_battles, 0) as won_battles,
    CASE 
        WHEN COALESCE(battle_stats.total_battles, 0) > 0 
        THEN ROUND((COALESCE(battle_stats.won_battles, 0)::NUMERIC / COALESCE(battle_stats.total_battles, 0)) * 100, 2)
        ELSE 0 
    END as win_rate,
    u.created_at as join_date,
    -- Faction-specific achievements
    COALESCE(territory_stats.territories_won, 0) as territories_won,
    COALESCE(territory_stats.territory_defense_wins, 0) as territory_defense_wins
FROM users u
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as total_battles,
        COUNT(CASE WHEN winner_id = user_id THEN 1 END) as won_battles
    FROM (
        SELECT attacker_id as user_id, winner_id FROM battles
        UNION ALL
        SELECT defender_id as user_id, winner_id FROM battles
    ) all_battles
    WHERE status = 'completed'
    GROUP BY user_id
) battle_stats ON u.id = battle_stats.user_id
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(CASE WHEN action = 'territory_capture' THEN 1 END) as territories_won,
        COUNT(CASE WHEN action = 'territory_defense' AND details->>'result' = 'success' THEN 1 END) as territory_defense_wins
    FROM audit_logs
    WHERE action IN ('territory_capture', 'territory_defense')
    AND created_at > NOW() - INTERVAL '30 days'
    GROUP BY user_id
) territory_stats ON u.id = territory_stats.user_id
WHERE u.faction = 'iran' AND u.is_active = true
ORDER BY u.stg_balance DESC, u.level DESC, u.experience DESC
LIMIT 500;

-- USA Faction Leaderboard - Top 500
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_usa_leaderboard_top500 AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY u.stg_balance DESC, u.level DESC, u.experience DESC) as usa_rank,
    u.id as user_id,
    u.telegram_id,
    u.username,
    u.first_name,
    u.stg_balance,
    u.level,
    u.experience,
    COALESCE(battle_stats.total_battles, 0) as total_battles,
    COALESCE(battle_stats.won_battles, 0) as won_battles,
    CASE 
        WHEN COALESCE(battle_stats.total_battles, 0) > 0 
        THEN ROUND((COALESCE(battle_stats.won_battles, 0)::NUMERIC / COALESCE(battle_stats.total_battles, 0)) * 100, 2)
        ELSE 0 
    END as win_rate,
    u.created_at as join_date,
    COALESCE(territory_stats.territories_won, 0) as territories_won,
    COALESCE(territory_stats.territory_defense_wins, 0) as territory_defense_wins
FROM users u
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as total_battles,
        COUNT(CASE WHEN winner_id = user_id THEN 1 END) as won_battles
    FROM (
        SELECT attacker_id as user_id, winner_id FROM battles
        UNION ALL
        SELECT defender_id as user_id, winner_id FROM battles
    ) all_battles
    WHERE status = 'completed'
    GROUP BY user_id
) battle_stats ON u.id = battle_stats.user_id
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(CASE WHEN action = 'territory_capture' THEN 1 END) as territories_won,
        COUNT(CASE WHEN action = 'territory_defense' AND details->>'result' = 'success' THEN 1 END) as territory_defense_wins
    FROM audit_logs
    WHERE action IN ('territory_capture', 'territory_defense')
    AND created_at > NOW() - INTERVAL '30 days'
    GROUP BY user_id
) territory_stats ON u.id = territory_stats.user_id
WHERE u.faction = 'usa' AND u.is_active = true
ORDER BY u.stg_balance DESC, u.level DESC, u.experience DESC
LIMIT 500;

-- ============================================================================
-- TIME-BASED LEADERBOARDS
-- ============================================================================

-- Daily Leaderboard (resets daily)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_leaderboard AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY daily_stats.score DESC, u.level DESC) as daily_rank,
    u.id as user_id,
    u.username,
    u.faction,
    daily_stats.score as daily_score,
    daily_stats.wins as daily_wins,
    daily_stats.battles as daily_battles,
    daily_stats.stg_earned as daily_stg_earned,
    u.stg_balance as current_balance
FROM users u
LEFT JOIN (
    SELECT 
        user_id,
        -- Daily scoring: wins * 100 + battles * 10 + STG earned
        (COUNT(CASE WHEN winner_id = user_id THEN 1 END) * 100 + 
         COUNT(*) * 10 + 
         COALESCE(SUM(CASE WHEN winner_id = user_id THEN stg_wager ELSE 0 END), 0)) as score,
        COUNT(CASE WHEN winner_id = user_id THEN 1 END) as wins,
        COUNT(*) as battles,
        COALESCE(SUM(CASE WHEN winner_id = user_id THEN stg_wager ELSE 0 END), 0) as stg_earned
    FROM battles
    WHERE DATE(created_at) = CURRENT_DATE
    AND status = 'completed'
    GROUP BY user_id
) daily_stats ON u.id = daily_stats.user_id
WHERE u.is_active = true
ORDER BY daily_stats.score DESC, u.level DESC;

-- Weekly Leaderboard (7-day rolling)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_weekly_leaderboard AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY weekly_stats.score DESC, u.level DESC) as weekly_rank,
    u.id as user_id,
    u.username,
    u.faction,
    weekly_stats.score as weekly_score,
    weekly_stats.wins as weekly_wins,
    weekly_stats.battles as weekly_battles,
    weekly_stats.stg_earned as weekly_stg_earned,
    weekly_stats.win_rate as weekly_win_rate
FROM users u
LEFT JOIN (
    SELECT 
        user_id,
        (COUNT(CASE WHEN winner_id = user_id THEN 1 END) * 100 + 
         COUNT(*) * 10 + 
         COALESCE(SUM(CASE WHEN winner_id = user_id THEN stg_wager ELSE 0 END), 0)) as score,
        COUNT(CASE WHEN winner_id = user_id THEN 1 END) as wins,
        COUNT(*) as battles,
        COALESCE(SUM(CASE WHEN winner_id = user_id THEN stg_wager ELSE 0 END), 0) as stg_earned,
        CASE 
            WHEN COUNT(*) > 0 
            THEN ROUND((COUNT(CASE WHEN winner_id = user_id THEN 1 END)::NUMERIC / COUNT(*)) * 100, 2)
            ELSE 0 
        END as win_rate
    FROM battles
    WHERE created_at >= NOW() - INTERVAL '7 days'
    AND status = 'completed'
    GROUP BY user_id
) weekly_stats ON u.id = weekly_stats.user_id
WHERE u.is_active = true
ORDER BY weekly_stats.score DESC, u.level DESC;

-- ============================================================================
-- SPECIALIZED LEADERBOARDS
-- ============================================================================

-- Battle Champions (most wins)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_battle_champions AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY champion_stats.total_wins DESC, champion_stats.win_rate DESC) as champion_rank,
    u.id as user_id,
    u.username,
    u.faction,
    u.level,
    champion_stats.total_wins,
    champion_stats.total_battles,
    champion_stats.win_rate,
    champion_stats.total_stg_won,
    champion_stats.avg_stg_per_battle,
    u.created_at as join_date
FROM users u
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(CASE WHEN winner_id = user_id THEN 1 END) as total_wins,
        COUNT(*) as total_battles,
        CASE 
            WHEN COUNT(*) > 0 
            THEN ROUND((COUNT(CASE WHEN winner_id = user_id THEN 1 END)::NUMERIC / COUNT(*)) * 100, 2)
            ELSE 0 
        END as win_rate,
        COALESCE(SUM(CASE WHEN winner_id = user_id THEN stg_wager ELSE 0 END), 0) as total_stg_won,
        ROUND(COALESCE(AVG(CASE WHEN winner_id = user_id THEN stg_wager ELSE NULL END), 0), 2) as avg_stg_per_battle
    FROM (
        SELECT attacker_id as user_id, winner_id, stg_wager FROM battles
        UNION ALL
        SELECT defender_id as user_id, winner_id, stg_wager FROM battles
    ) all_battles
    WHERE status = 'completed'
    AND created_at > NOW() - INTERVAL '30 days'
    GROUP BY user_id
) champion_stats ON u.id = champion_stats.user_id
WHERE u.is_active = true
AND champion_stats.total_wins > 0
ORDER BY champion_stats.total_wins DESC, champion_stats.win_rate DESC
LIMIT 100;

-- Rich Players (highest STG balance)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_richest_players AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY u.stg_balance DESC, u.level DESC) as wealth_rank,
    u.id as user_id,
    u.username,
    u.faction,
    u.stg_balance,
    u.level,
    u.experience,
    u.win_claimable,
    u.ton_wallet_address,
    COALESCE(transactions.total_deposits, 0) as total_deposits,
    COALESCE(transactions.total_withdrawals, 0) as total_withdrawals,
    u.created_at as join_date,
    -- Wealth growth rate
    CASE 
        WHEN EXTRACT(DAYS FROM NOW() - u.created_at) > 0
        THEN ROUND(u.stg_balance::NUMERIC / EXTRACT(DAYS FROM NOW() - u.created_at), 2)
        ELSE 0
    END as daily_avg_earnings
FROM users u
LEFT JOIN (
    SELECT 
        user_id,
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_deposits,
        COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as total_withdrawals
    FROM transactions
    WHERE type = 'stg'
    GROUP BY user_id
) transactions ON u.id = transactions.user_id
WHERE u.is_active = true
ORDER BY u.stg_balance DESC, u.level DESC
LIMIT 500;

-- ============================================================================
-- REFRESH FUNCTIONS WITH SCHEDULING
-- ============================================================================

-- Refresh all leaderboards
CREATE OR REPLACE FUNCTION refresh_all_leaderboards()
RETURNS TABLE(view_name TEXT, refresh_time TIMESTAMP, row_count BIGINT) AS $$
DECLARE
    start_time TIMESTAMP;
    row_count BIGINT;
BEGIN
    -- Global leaderboard
    start_time := NOW();
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_global_leaderboard_top1000;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    RETURN NEXT 'mv_global_leaderboard_top1000', start_time, row_count;
    
    -- Iran leaderboard
    start_time := NOW();
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_iran_leaderboard_top500;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    RETURN NEXT 'mv_iran_leaderboard_top500', start_time, row_count;
    
    -- USA leaderboard
    start_time := NOW();
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_usa_leaderboard_top500;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    RETURN NEXT 'mv_usa_leaderboard_top500', start_time, row_count;
    
    -- Daily leaderboard
    start_time := NOW();
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_leaderboard;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    RETURN NEXT 'mv_daily_leaderboard', start_time, row_count;
    
    -- Weekly leaderboard
    start_time := NOW();
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_weekly_leaderboard;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    RETURN NEXT 'mv_weekly_leaderboard', start_time, row_count;
    
    -- Battle champions
    start_time := NOW();
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_battle_champions;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    RETURN NEXT 'mv_battle_champions', start_time, row_count;
    
    -- Richest players
    start_time := NOW();
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_richest_players;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    RETURN NEXT 'mv_richest_players', start_time, row_count;
END;
$$ LANGUAGE plpgsql;

-- Refresh specific leaderboard with error handling
CREATE OR REPLACE FUNCTION refresh_leaderboard_safe(view_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    success BOOLEAN := FALSE;
BEGIN
    BEGIN
        CASE view_name
            WHEN 'global' THEN
                REFRESH MATERIALIZED VIEW CONCURRENTLY mv_global_leaderboard_top1000;
            WHEN 'iran' THEN
                REFRESH MATERIALIZED VIEW CONCURRENTLY mv_iran_leaderboard_top500;
            WHEN 'usa' THEN
                REFRESH MATERIALIZED VIEW CONCURRENTLY mv_usa_leaderboard_top500;
            WHEN 'daily' THEN
                REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_leaderboard;
            WHEN 'weekly' THEN
                REFRESH MATERIALIZED VIEW CONCURRENTLY mv_weekly_leaderboard;
            WHEN 'champions' THEN
                REFRESH MATERIALIZED VIEW CONCURRENTLY mv_battle_champions;
            WHEN 'richest' THEN
                REFRESH MATERIALIZED VIEW CONCURRENTLY mv_richest_players;
            ELSE
                RAISE WARNING 'Unknown leaderboard view: %', view_name;
                RETURN FALSE;
        END CASE;
        
        success := TRUE;
        RAISE NOTICE 'Leaderboard % refreshed successfully', view_name;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING 'Failed to refresh leaderboard %: %', view_name, SQLERRM;
            success := FALSE;
    END;
    
    RETURN success;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- AUTOMATED REFRESH SCHEDULING
-- ============================================================================

-- Function to schedule leaderboard refreshes
CREATE OR REPLACE FUNCTION schedule_leaderboard_refreshes()
RETURNS void AS $$
BEGIN
    -- Refresh high-frequency leaderboards every 5 minutes
    -- Daily leaderboard (changes frequently)
    PERFORM pg_notify('leaderboard_refresh', 'daily');
    
    -- Refresh medium-frequency leaderboards every 15 minutes
    -- Weekly, champions, richest
    PERFORM pg_notify('leaderboard_refresh', 'weekly,champions,richest');
    
    -- Refresh low-frequency leaderboards every hour
    -- Global, faction leaderboards
    PERFORM pg_notify('leaderboard_refresh', 'global,iran,usa');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MONITORING VIEWS
-- ============================================================================

-- View to monitor refresh status
CREATE OR REPLACE VIEW leaderboard_refresh_status AS
SELECT 
    schemaname,
    matviewname,
    ispopulated,
    definition,
    last_refresh_time
FROM pg_matviews 
WHERE schemaname = 'public'
ORDER BY matviewname;

-- View to monitor refresh performance
CREATE OR REPLACE VIEW leaderboard_refresh_performance AS
SELECT 
    view_name,
    refresh_time,
    EXTRACT(EPOCH FROM (NOW() - refresh_time)) as seconds_since_refresh,
    row_count
FROM (
    SELECT * FROM refresh_all_leaderboards()
) AS refresh_data
ORDER BY refresh_time DESC;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Materialized Views Complete!';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '✅ Global leaderboard (Top 1000)';
    RAISE NOTICE '✅ Faction leaderboards (Top 500 each)';
    RAISE NOTICE '✅ Time-based leaderboards (Daily/Weekly)';
    RAISE NOTICE '✅ Specialized leaderboards (Champions/Richest)';
    RAISE NOTICE '✅ Refresh functions with error handling';
    RAISE NOTICE '✅ Automated scheduling ready';
    RAISE NOTICE '✅ Monitoring views created';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Use refresh_leaderboard_safe() for updates';
    RAISE NOTICE 'Monitor with leaderboard_refresh_status view';
    RAISE NOTICE 'Schedule with schedule_leaderboard_refreshes()';
    RAISE NOTICE '===========================================';
END $$;
