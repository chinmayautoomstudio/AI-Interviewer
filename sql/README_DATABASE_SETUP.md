# Database Setup Instructions

## Issue: "Could not find the 'created_by' column of 'job_descriptions' in the schema cache"

This error occurs because the `job_descriptions` table is missing the `created_by` column that the application expects.

## Solutions (Choose One):

### Option 1: Complete Fresh Setup (Recommended)
Run the complete database setup script:
```sql
-- Use: setup_complete_database.sql
-- This creates everything from scratch with all required columns
```

### Option 2: Fix Existing Schema
If you want to keep existing data, run the fix script:
```sql
-- Use: fix_job_descriptions_schema.sql
-- This adds missing columns to existing table
```

### Option 3: Add Only Missing Column
If you only need the `created_by` column:
```sql
-- Use: add_created_by_column.sql
-- This adds only the created_by column
```

## Required Columns in job_descriptions table:

- `id` (UUID, Primary Key)
- `job_description_id` (VARCHAR(20), Unique)
- `title` (TEXT, NOT NULL)
- `department` (TEXT)
- `location` (TEXT)
- `employment_type` (TEXT with CHECK constraint)
- `experience_level` (TEXT with CHECK constraint)
- `salary_min` (DECIMAL(10,2))
- `salary_max` (DECIMAL(10,2))
- `currency` (TEXT, DEFAULT 'INR')
- `description` (TEXT)
- `requirements` (TEXT[])
- `responsibilities` (TEXT[])
- `skills` (TEXT[])
- `qualifications` (TEXT[])
- `benefits` (TEXT[])
- `status` (TEXT with CHECK constraint)
- `company_name` (TEXT) ⭐ **Required**
- `work_mode` (TEXT with CHECK constraint) ⭐ **Required**
- `job_category` (TEXT) ⭐ **Required**
- `contact_email` (TEXT) ⭐ **Required**
- `application_deadline` (TIMESTAMP WITH TIME ZONE) ⭐ **Required**
- `created_by` (UUID, REFERENCES auth.users) ⭐ **Required**
- `created_at` (TIMESTAMP WITH TIME ZONE)
- `updated_at` (TIMESTAMP WITH TIME ZONE)

## Steps to Fix:

1. **Go to Supabase Dashboard** → SQL Editor
2. **Choose one of the SQL scripts** above
3. **Run the script** in the SQL Editor
4. **Refresh your application** - the error should be resolved

## Verification:

After running the script, you can verify the schema by running:
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'job_descriptions' 
ORDER BY ordinal_position;
```

This should show all the required columns including `created_by`, `company_name`, `work_mode`, `job_category`, `contact_email`, and `application_deadline`.
