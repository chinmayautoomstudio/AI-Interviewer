# Interviews Table Schema Migration

This directory contains SQL scripts to update the `interviews` table schema to match the frontend code requirements.

## 📋 **Problem**

The current `interviews` table in Supabase is missing several columns that the frontend code expects:

- `ai_agent_id` - References to AI agents
- `interview_type` - Type of interview (technical, behavioral, etc.)
- `interview_notes` - Additional notes for the interview
- `interview_duration` - Duration field (code expects this name instead of `duration`)

## 🛠️ **Solution**

The migration scripts add these missing columns and ensure data integrity.

## 📁 **Files**

### 1. `update_interviews_table_schema.sql`
**Main migration script** - Run this to update the interviews table.

**What it does:**
- ✅ Adds `ai_agent_id` column with foreign key to `ai_agents` table
- ✅ Adds `interview_type` column with enum constraint
- ✅ Adds `interview_notes` column for additional notes
- ✅ Adds `interview_duration` column (synced with existing `duration` column)
- ✅ Creates indexes for better performance
- ✅ Creates trigger to keep `duration` and `interview_duration` in sync
- ✅ Updates existing data with default values

### 2. `test_interviews_table_migration.sql`
**Test script** - Run this after the migration to verify everything works.

**What it tests:**
- ✅ Column existence verification
- ✅ Insert operation with new fields
- ✅ Update operation and column sync
- ✅ Foreign key constraints
- ✅ Query performance

### 3. `rollback_interviews_table_changes.sql`
**Rollback script** - Use this if you need to revert the changes.

**What it does:**
- ✅ Removes all added columns
- ✅ Drops triggers and indexes
- ✅ Restores table to original state

## 🚀 **How to Run**

### Step 1: Backup Your Database
```sql
-- Always backup before running migrations!
-- Use your preferred backup method
```

### Step 2: Run the Migration
```sql
-- Execute the main migration script
\i update_interviews_table_schema.sql
```

### Step 3: Test the Migration
```sql
-- Run the test script to verify everything works
\i test_interviews_table_migration.sql
```

### Step 4: Verify Results
Check the output for any "FAIL" messages. All tests should show "PASS".

## 📊 **Expected Results**

After successful migration, your `interviews` table will have these columns:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `candidate_id` | UUID | Foreign key to candidates |
| `job_description_id` | UUID | Foreign key to job_descriptions |
| `ai_agent_id` | UUID | Foreign key to ai_agents (NEW) |
| `interview_type` | VARCHAR(50) | Type of interview (NEW) |
| `interview_notes` | TEXT | Additional notes (NEW) |
| `duration` | INTEGER | Duration in minutes (existing) |
| `interview_duration` | INTEGER | Duration in minutes (NEW, synced) |
| `status` | ENUM | Interview status |
| `scheduled_at` | TIMESTAMP | When interview is scheduled |
| `started_at` | TIMESTAMP | When interview started |
| `completed_at` | TIMESTAMP | When interview completed |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Record update time |

## 🔧 **Technical Details**

### Column Constraints
- `interview_type`: Must be one of: `'technical'`, `'behavioral'`, `'hr'`, `'domain_specific'`, `'general'`
- `ai_agent_id`: References `ai_agents.id` with `ON DELETE SET NULL`
- `interview_duration`: Automatically synced with `duration` column

### Triggers
- **Sync Trigger**: Keeps `duration` and `interview_duration` columns in sync
- **Update Trigger**: Updates `updated_at` timestamp on changes

### Indexes
- `idx_interviews_ai_agent_id`: For querying by AI agent
- `idx_interviews_interview_type`: For filtering by interview type

## ⚠️ **Important Notes**

1. **Backup First**: Always backup your database before running migrations
2. **Test Environment**: Test the migration in a development environment first
3. **Dependencies**: Ensure the `ai_agents` table exists before running the migration
4. **Data Integrity**: The migration preserves all existing data
5. **Rollback**: Use the rollback script if you encounter issues

## 🐛 **Troubleshooting**

### Common Issues

1. **Foreign Key Error**: Make sure the `ai_agents` table exists
2. **Permission Error**: Ensure you have ALTER TABLE permissions
3. **Column Already Exists**: The script handles this gracefully with IF NOT EXISTS

### Getting Help

If you encounter issues:
1. Check the error messages in the migration output
2. Verify your database permissions
3. Ensure all required tables exist
4. Use the rollback script if needed

## ✅ **Verification Checklist**

After running the migration, verify:

- [ ] All new columns exist in the `interviews` table
- [ ] Foreign key constraints are working
- [ ] Insert operations work with new fields
- [ ] Update operations sync the duration columns
- [ ] Indexes are created and working
- [ ] Triggers are functioning properly
- [ ] Test script shows all "PASS" results

## 🎯 **Next Steps**

After successful migration:
1. Update your frontend code to use the new schema
2. Test the Interview Scheduling page functionality
3. Verify all interview-related features work correctly
4. Monitor performance and adjust indexes if needed

---

**Migration Status**: Ready to run
**Last Updated**: $(date)
**Version**: 1.0.0
