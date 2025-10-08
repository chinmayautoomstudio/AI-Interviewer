-- Quick Backup Script for Key Tables
-- This script creates a backup of the main tables before migration
-- Run this in your Supabase SQL Editor

-- ==============================================
-- BACKUP INTERVIEWS TABLE
-- ==============================================

-- Create backup table for interviews
CREATE TABLE IF NOT EXISTS interviews_backup AS 
SELECT * FROM interviews;

-- Add timestamp to backup table name
DO $$
DECLARE
    backup_table_name TEXT;
BEGIN
    backup_table_name := 'interviews_backup_' || to_char(NOW(), 'YYYYMMDD_HH24MISS');
    EXECUTE format('CREATE TABLE %I AS SELECT * FROM interviews', backup_table_name);
    RAISE NOTICE 'Created backup table: %', backup_table_name;
END $$;

-- ==============================================
-- BACKUP CANDIDATES TABLE
-- ==============================================

-- Create backup table for candidates
DO $$
DECLARE
    backup_table_name TEXT;
BEGIN
    backup_table_name := 'candidates_backup_' || to_char(NOW(), 'YYYYMMDD_HH24MISS');
    EXECUTE format('CREATE TABLE %I AS SELECT * FROM candidates', backup_table_name);
    RAISE NOTICE 'Created backup table: %', backup_table_name;
END $$;

-- ==============================================
-- BACKUP JOB_DESCRIPTIONS TABLE
-- ==============================================

-- Create backup table for job_descriptions
DO $$
DECLARE
    backup_table_name TEXT;
BEGIN
    backup_table_name := 'job_descriptions_backup_' || to_char(NOW(), 'YYYYMMDD_HH24MISS');
    EXECUTE format('CREATE TABLE %I AS SELECT * FROM job_descriptions', backup_table_name);
    RAISE NOTICE 'Created backup table: %', backup_table_name;
END $$;

-- ==============================================
-- BACKUP AI_AGENTS TABLE
-- ==============================================

-- Create backup table for ai_agents
DO $$
DECLARE
    backup_table_name TEXT;
BEGIN
    backup_table_name := 'ai_agents_backup_' || to_char(NOW(), 'YYYYMMDD_HH24MISS');
    EXECUTE format('CREATE TABLE %I AS SELECT * FROM ai_agents', backup_table_name);
    RAISE NOTICE 'Created backup table: %', backup_table_name;
END $$;

-- ==============================================
-- VERIFY BACKUPS
-- ==============================================

-- Show all backup tables created
SELECT 
    'Backup Tables Created' as info,
    table_name,
    (SELECT COUNT(*) FROM information_schema.tables t2 WHERE t2.table_name = t1.table_name) as exists
FROM information_schema.tables t1
WHERE table_name LIKE '%_backup_%'
    AND table_schema = 'public'
ORDER BY table_name;

-- Show record counts for verification
SELECT 
    'Original Tables' as type,
    'interviews' as table_name,
    COUNT(*) as record_count
FROM interviews
UNION ALL
SELECT 
    'Original Tables' as type,
    'candidates' as table_name,
    COUNT(*) as record_count
FROM candidates
UNION ALL
SELECT 
    'Original Tables' as type,
    'job_descriptions' as table_name,
    COUNT(*) as record_count
FROM job_descriptions
UNION ALL
SELECT 
    'Original Tables' as type,
    'ai_agents' as table_name,
    COUNT(*) as record_count
FROM ai_agents;

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Quick Backup Completed Successfully!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Backup tables created with timestamp:';
    RAISE NOTICE '- interviews_backup_YYYYMMDD_HHMMSS ✓';
    RAISE NOTICE '- candidates_backup_YYYYMMDD_HHMMSS ✓';
    RAISE NOTICE '- job_descriptions_backup_YYYYMMDD_HHMMSS ✓';
    RAISE NOTICE '- ai_agents_backup_YYYYMMDD_HHMMSS ✓';
    RAISE NOTICE '';
    RAISE NOTICE 'These backup tables can be used to restore data';
    RAISE NOTICE 'if needed after the migration.';
    RAISE NOTICE '==============================================';
END $$;
