# Database Backup Guide

This guide shows you how to backup your Supabase database before running the interviews table migration.

## 🚨 **IMPORTANT: Always Backup Before Migration!**

Database migrations can potentially cause data loss. Always create a backup before running any schema changes.

## 🛡️ **Backup Methods (Choose One)**

### **Method 1: Supabase Dashboard (Easiest)**

#### **Step 1: Access Your Project**
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your AI Interviewer project

#### **Step 2: Create Backup**
1. **Navigate to**: Settings → Database
2. **Scroll down to**: "Database Backups" section
3. **Click**: "Create Backup" button
4. **Choose**: "Full Backup" (recommended)
5. **Wait**: For backup to complete (usually 1-5 minutes)

#### **Step 3: Download Backup**
1. **Click**: "Download" button next to your backup
2. **Save**: The backup file to your local computer
3. **Store**: In a safe location (cloud storage, external drive, etc.)

**✅ Pros**: Easy, no technical setup required
**❌ Cons**: Manual process, limited to dashboard availability

---

### **Method 2: Quick SQL Backup (Fastest)**

#### **Step 1: Run Backup Script**
1. **Open**: Supabase SQL Editor
2. **Copy and paste**: The contents of `quick_backup_tables.sql`
3. **Click**: "Run" button
4. **Wait**: For backup tables to be created

#### **Step 2: Verify Backup**
- Check the output for "Backup Tables Created" message
- Verify record counts match between original and backup tables

**✅ Pros**: Very fast, creates backup tables in same database
**❌ Cons**: Backup tables consume storage space

---

### **Method 3: Command Line (Most Comprehensive)**

#### **Prerequisites**
- PostgreSQL client tools installed (`pg_dump`)
- Database connection details

#### **Step 1: Get Connection Details**
From your Supabase dashboard:
- **Host**: `your-project-ref.supabase.co`
- **Port**: `5432`
- **Database**: `postgres`
- **Username**: `postgres`
- **Password**: Your database password

#### **Step 2: Run Backup Script**
```bash
# For Linux/Mac
chmod +x sql/backup_database.sh
./sql/backup_database.sh

# For Windows
sql/backup_database.bat
```

**✅ Pros**: Complete backup, portable file
**❌ Cons**: Requires technical setup

---

### **Method 4: Supabase CLI (Developer-Friendly)**

#### **Prerequisites**
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref
```

#### **Step 1: Create Backup**
```bash
# Full database backup
supabase db dump --file backup_$(date +%Y%m%d_%H%M%S).sql

# Or specific tables only
supabase db dump --table interviews --table candidates --file interviews_backup.sql
```

**✅ Pros**: Developer-friendly, version control integration
**❌ Cons**: Requires CLI installation

---

## 📋 **Backup Checklist**

Before running the migration, ensure you have:

- [ ] **Backup created** using one of the methods above
- [ ] **Backup file downloaded** and stored safely
- [ ] **Backup verified** (check file size, record counts)
- [ ] **Backup location noted** (where you stored it)
- [ ] **Restore process understood** (how to restore if needed)

## 🔄 **How to Restore from Backup**

### **From Supabase Dashboard Backup**
1. Go to Settings → Database
2. Click "Restore from backup"
3. Upload your backup file
4. Confirm restoration

### **From SQL Backup Tables**
```sql
-- Restore interviews table
DROP TABLE IF EXISTS interviews;
CREATE TABLE interviews AS SELECT * FROM interviews_backup_YYYYMMDD_HHMMSS;

-- Restore other tables similarly
```

### **From Command Line Backup**
```bash
# Restore using psql
psql -h your-host -U postgres -d postgres -f backup_file.sql
```

## ⚠️ **Important Notes**

1. **Storage Space**: Backups consume storage space in your Supabase project
2. **Backup Frequency**: Create backups before any major changes
3. **Multiple Backups**: Keep multiple backup versions for safety
4. **Test Restore**: Periodically test your restore process
5. **Backup Location**: Store backups in multiple locations (local + cloud)

## 🚀 **Recommended Workflow**

1. **Create backup** using Supabase Dashboard (Method 1)
2. **Download and store** backup file safely
3. **Run migration** script
4. **Test migration** using test script
5. **Verify functionality** in your application
6. **Keep backup** until you're confident everything works

## 🆘 **Emergency Recovery**

If something goes wrong during migration:

1. **Don't panic** - you have a backup!
2. **Stop** any running processes
3. **Restore** from your backup
4. **Investigate** what went wrong
5. **Fix** the issue before retrying

---

**Remember**: It's better to have a backup and not need it than to need a backup and not have it! 🛡️
