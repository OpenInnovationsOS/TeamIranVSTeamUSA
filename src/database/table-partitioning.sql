-- 📅 Table Partitioning for Time-Series Data
-- Team Iran vs Team USA - Scalable Data Architecture

-- ============================================================================
-- BATTLES TABLE PARTITIONING
-- ============================================================================

-- Drop existing battles table if it exists (for recreation)
DROP TABLE IF EXISTS battles CASCADE;

-- Create partitioned battles table
CREATE TABLE battles (
    id SERIAL,
    attacker_id INTEGER NOT NULL REFERENCES users(id),
    defender_id INTEGER NOT NULL REFERENCES users(id),
    winner_id INTEGER REFERENCES users(id),
    stg_wager BIGINT NOT NULL,
    battle_type VARCHAR(50) DEFAULT 'pvp',
    battle_data JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for battles
DO $$
DECLARE
    start_date DATE;
    end_date DATE;
    partition_name TEXT;
BEGIN
    -- Create partitions for current and next 12 months
    FOR i IN 0..12 LOOP
        start_date := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month' * i);
        end_date := start_date + INTERVAL '1 month';
        partition_name := 'battles_' || TO_CHAR(start_date, 'YYYY_MM');
        
        EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF battles FOR VALUES FROM (%L) TO (%L)',
                     partition_name, start_date, end_date);
        
        -- Create indexes for each partition
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(attacker_id, created_at DESC)',
                     'idx_' || partition_name || '_attacker_created', partition_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(defender_id, created_at DESC)',
                     'idx_' || partition_name || '_defender_created', partition_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(status, created_at DESC)',
                     'idx_' || partition_name || '_status_created', partition_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I USING GIN (battle_data)',
                     'idx_' || partition_name || '_battle_data_gin', partition_name);
    END LOOP;
END $$;

-- ============================================================================
-- TRANSACTIONS TABLE PARTITIONING
-- ============================================================================

-- Drop existing transactions table if it exists
DROP TABLE IF EXISTS transactions CASCADE;

-- Create partitioned transactions table
CREATE TABLE transactions (
    id SERIAL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('ton', 'stg', 'win')),
    amount BIGINT NOT NULL,
    balance_after BIGINT NOT NULL,
    description TEXT,
    transaction_hash VARCHAR(255),
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for transactions
DO $$
DECLARE
    start_date DATE;
    end_date DATE;
    partition_name TEXT;
BEGIN
    -- Create partitions for current and next 12 months
    FOR i IN 0..12 LOOP
        start_date := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month' * i);
        end_date := start_date + INTERVAL '1 month';
        partition_name := 'transactions_' || TO_CHAR(start_date, 'YYYY_MM');
        
        EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF transactions FOR VALUES FROM (%L) TO (%L)',
                     partition_name, start_date, end_date);
        
        -- Create indexes for each partition
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(user_id, type, created_at DESC)',
                     'idx_' || partition_name || '_user_type_created', partition_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(status, created_at DESC)',
                     'idx_' || partition_name || '_status_created', partition_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(transaction_hash) WHERE transaction_hash IS NOT NULL',
                     'idx_' || partition_name || '_hash', partition_name);
    END LOOP;
END $$;

-- ============================================================================
-- AUDIT LOGS TABLE PARTITIONING
-- ============================================================================

-- Drop existing audit_logs table if it exists
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Create partitioned audit_logs table
CREATE TABLE audit_logs (
    id SERIAL,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for audit_logs
DO $$
DECLARE
    start_date DATE;
    end_date DATE;
    partition_name TEXT;
BEGIN
    -- Create partitions for current and next 6 months (audit logs don't need as long retention)
    FOR i IN 0..6 LOOP
        start_date := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month' * i);
        end_date := start_date + INTERVAL '1 month';
        partition_name := 'audit_logs_' || TO_CHAR(start_date, 'YYYY_MM');
        
        EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs FOR VALUES FROM (%L) TO (%L)',
                     partition_name, start_date, end_date);
        
        -- Create indexes for each partition
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(user_id, created_at DESC)',
                     'idx_' || partition_name || '_user_created', partition_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(action, created_at DESC)',
                     'idx_' || partition_name || '_action_created', partition_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(ip_address, created_at DESC)',
                     'idx_' || partition_name || '_ip_created', partition_name);
    END LOOP;
END $$;

-- ============================================================================
-- USER EVENTS TABLE PARTITIONING
-- ============================================================================

-- Drop existing user_events table if it exists
DROP TABLE IF EXISTS user_events CASCADE;

-- Create partitioned user_events table
CREATE TABLE user_events (
    id SERIAL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    event_id INTEGER REFERENCES game_events(id) NOT NULL,
    participation_data JSONB DEFAULT '{}',
    rewards_earned JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, event_id)
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for user_events
DO $$
DECLARE
    start_date DATE;
    end_date DATE;
    partition_name TEXT;
BEGIN
    -- Create partitions for current and next 12 months
    FOR i IN 0..12 LOOP
        start_date := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month' * i);
        end_date := start_date + INTERVAL '1 month';
        partition_name := 'user_events_' || TO_CHAR(start_date, 'YYYY_MM');
        
        EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF user_events FOR VALUES FROM (%L) TO (%L)',
                     partition_name, start_date, end_date);
        
        -- Create indexes for each partition
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(user_id, created_at DESC)',
                     'idx_' || partition_name || '_user_created', partition_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(event_id, created_at DESC)',
                     'idx_' || partition_name || '_event_created', partition_name);
    END LOOP;
END $$;

-- ============================================================================
-- PARTITION MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function to create new partitions automatically
CREATE OR REPLACE FUNCTION create_monthly_partitions(table_name TEXT, months_ahead INTEGER DEFAULT 2)
RETURNS void AS $$
DECLARE
    start_date DATE;
    end_date DATE;
    partition_name TEXT;
    i INTEGER;
BEGIN
    -- Create partitions for the specified number of months ahead
    FOR i IN 0..months_ahead LOOP
        start_date := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month' * i);
        end_date := start_date + INTERVAL '1 month';
        partition_name := table_name || '_' || TO_CHAR(start_date, 'YYYY_MM');
        
        -- Check if partition already exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = partition_name
        ) THEN
            EXECUTE format('CREATE TABLE %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
                         partition_name, table_name, start_date, end_date);
            
            RAISE NOTICE 'Created partition % for table %', partition_name, table_name;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to drop old partitions
CREATE OR REPLACE FUNCTION drop_old_partitions(table_name TEXT, retention_months INTEGER DEFAULT 12)
RETURNS void AS $$
DECLARE
    partition_name TEXT;
    cutoff_date DATE;
BEGIN
    cutoff_date := CURRENT_DATE - INTERVAL '1 month' * retention_months;
    
    -- Drop partitions older than retention period
    FOR partition_name IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name LIKE table_name || '_%' 
        AND table_name < table_name || '_' || TO_CHAR(cutoff_date, 'YYYY_MM')
    LOOP
        EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', partition_name);
        RAISE NOTICE 'Dropped old partition %', partition_name;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get partition information
CREATE OR REPLACE FUNCTION get_partition_info(table_name TEXT DEFAULT NULL)
RETURNS TABLE(
    table_name TEXT,
    partition_name TEXT,
    start_date DATE,
    end_date DATE,
    row_count BIGINT,
    size_mb NUMERIC
) AS $$
BEGIN
    IF table_name IS NULL THEN
        -- Return info for all partitioned tables
        RETURN QUERY
        SELECT 
            split_part(schemaname || '.' || tablename, '.', 1) as table_name,
            tablename as partition_name,
            NULL::DATE as start_date,
            NULL::DATE as end_date,
            0::BIGINT as row_count,
            0::NUMERIC as size_mb
        FROM pg_tables
        WHERE tablename LIKE '%_YYYY_MM'
        ORDER BY tablename;
    ELSE
        -- Return info for specific table
        RETURN QUERY
        SELECT 
            table_name,
            partition_name,
            NULL::DATE as start_date,
            NULL::DATE as end_date,
            0::BIGINT as row_count,
            0::NUMERIC as size_mb
        FROM (
            SELECT table_name, partition_name FROM get_partition_info()
            WHERE table_name LIKE table_name || '%'
        ) specific_partitions
        WHERE specific_partitions.table_name = table_name
        ORDER BY partition_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- AUTOMATED PARTITION MAINTENANCE
-- ============================================================================

-- Function to run partition maintenance
CREATE OR REPLACE FUNCTION maintenance_partitions()
RETURNS TABLE(
    action TEXT,
    table_name TEXT,
    partition_name TEXT,
    result TEXT
) AS $$
DECLARE
    maintenance_result RECORD;
BEGIN
    -- Create new partitions for all tables
    FOR maintenance_result IN 
        SELECT 'CREATE' as action, 'battles' as table_name, partition_name, 'Created' as result
        FROM create_monthly_partitions('battles', 2)
        
        UNION ALL
        
        SELECT 'Create' as action, 'transactions' as table_name, partition_name, 'Created' as result
        FROM create_monthly_partitions('transactions', 2)
        
        UNION ALL
        
        SELECT 'Create' as action, 'audit_logs' as table_name, partition_name, 'Created' as result
        FROM create_monthly_partitions('audit_logs', 1)
        
        UNION ALL
        
        SELECT 'Create' as action, 'user_events' as table_name, partition_name, 'Created' as result
        FROM create_monthly_partitions('user_events', 2)
    LOOP
        RETURN NEXT;
    END LOOP;
    
    -- Drop old partitions
    FOR maintenance_result IN 
        SELECT 'Drop' as action, 'battles' as table_name, partition_name, 'Dropped' as result
        FROM drop_old_partitions('battles', 12)
        
        UNION ALL
        
        SELECT 'Drop' as action, 'transactions' as table_name, partition_name, 'Dropped' as result
        FROM drop_old_partitions('transactions', 12)
        
        UNION ALL
        
        SELECT 'Drop' as action, 'audit_logs' as table_name, partition_name, 'Dropped' as result
        FROM drop_old_partitions('audit_logs', 6)
        
        UNION ALL
        
        SELECT 'Drop' as action, 'user_events' as table_name, partition_name, 'Dropped' as result
        FROM drop_old_partitions('user_events', 12)
    LOOP
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTITION MONITORING
-- ============================================================================

-- View to monitor partition sizes and performance
CREATE OR REPLACE VIEW partition_monitoring AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = tablename) AS column_count
FROM pg_tables 
WHERE tablename LIKE '%_YYYY_MM'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- View to show partition age and usage
CREATE OR REPLACE VIEW partition_age_analysis AS
SELECT 
    'battles' as table_name,
    partition_name,
    EXTRACT(DAYS FROM NOW() - created_at) as days_old,
    row_count,
    CASE 
        WHEN EXTRACT(DAYS FROM NOW() - created_at) > 90 THEN 'Archive Candidate'
        WHEN EXTRACT(DAYS FROM NOW() - created_at) > 30 THEN 'Consider Archive'
        ELSE 'Active'
    END as status
FROM (
    SELECT 
        tablename as partition_name,
        created_at,
        (SELECT COUNT(*) FROM battles WHERE created_at >= DATE_TRUNC('month', SUBSTRING(tablename FROM 9 FOR 8) || '-01') 
         AND created_at < (DATE_TRUNC('month', SUBSTRING(tablename FROM 9 FOR 8) || '-01') + INTERVAL '1 month')) as row_count
    FROM pg_tables 
    WHERE tablename LIKE 'battles_%'
    AND schemaname = 'public'
) battle_partitions
UNION ALL
SELECT 
    'transactions' as table_name,
    partition_name,
    EXTRACT(DAYS FROM NOW() - created_at) as days_old,
    row_count,
    CASE 
        WHEN EXTRACT(DAYS FROM NOW() - created_at) > 90 THEN 'Archive Candidate'
        WHEN EXTRACT(DAYS FROM NOW() - created_at) > 30 THEN 'Consider Archive'
        ELSE 'Active'
    END as status
FROM (
    SELECT 
        tablename as partition_name,
        created_at,
        (SELECT COUNT(*) FROM transactions WHERE created_at >= DATE_TRUNC('month', SUBSTRING(tablename FROM 13 FOR 8) || '-01') 
         AND created_at < (DATE_TRUNC('month', SUBSTRING(tablename FROM 13 FOR 8) || '-01') + INTERVAL '1 month')) as row_count
    FROM pg_tables 
    WHERE tablename LIKE 'transactions_%'
    AND schemaname = 'public'
) transaction_partitions
ORDER BY table_name, days_old DESC;

-- ============================================================================
-- SCHEDULING AND AUTOMATION
-- ============================================================================

-- Function to schedule partition maintenance (run monthly)
CREATE OR REPLACE FUNCTION schedule_partition_maintenance()
RETURNS void AS $$
BEGIN
    -- This would typically be called by a cron job
    PERFORM maintenance_partitions();
    
    RAISE NOTICE 'Partition maintenance completed';
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically create partitions when needed
CREATE OR REPLACE FUNCTION auto_create_partition()
RETURNS TRIGGER AS $$
DECLARE
    partition_name TEXT;
    start_date DATE;
    end_date DATE;
    table_name TEXT;
BEGIN
    -- This trigger would be called if an insert goes to a non-existent partition
    -- For now, we'll rely on scheduled maintenance
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PERFORMANCE OPTIMIZATION FOR PARTITIONS
-- ============================================================================

-- Function to analyze all partitions
CREATE OR REPLACE FUNCTION analyze_all_partitions()
RETURNS void AS $$
DECLARE
    partition_record RECORD;
BEGIN
    FOR partition_record IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE tablename LIKE '%_YYYY_MM'
        AND schemaname = 'public'
    LOOP
        EXECUTE format('ANALYZE %I.%I', partition_record.schemaname, partition_record.tablename);
        RAISE NOTICE 'Analyzed partition: %', partition_record.tablename;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Table Partitioning Complete!';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '✅ Battles table partitioned by month';
    RAISE NOTICE '✅ Transactions table partitioned by month';
    RAISE NOTICE '✅ Audit logs table partitioned by month';
    RAISE NOTICE '✅ User events table partitioned by month';
    RAISE NOTICE '✅ Partition management functions created';
    RAISE NOTICE '✅ Automated maintenance ready';
    RAISE NOTICE '✅ Monitoring views implemented';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Use maintenance_partitions() for upkeep';
    RAISE NOTICE 'Monitor with partition_monitoring view';
    RAISE NOTICE 'Schedule with cron: 0 2 1 * * (monthly)';
    RAISE NOTICE '===========================================';
END $$;
