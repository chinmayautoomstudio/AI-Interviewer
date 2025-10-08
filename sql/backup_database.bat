@echo off
REM Database Backup Script for Supabase (Windows)
REM This script creates a backup of your Supabase database

REM Configuration
set DB_HOST=your-project-ref.supabase.co
set DB_PORT=5432
set DB_NAME=postgres
set DB_USER=postgres
set BACKUP_DIR=.\backups
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=%BACKUP_DIR%\supabase_backup_%TIMESTAMP%.sql

REM Create backup directory if it doesn't exist
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo 🔄 Starting database backup...
echo 📁 Backup will be saved to: %BACKUP_FILE%

REM Create backup using pg_dump
pg_dump ^
  --host="%DB_HOST%" ^
  --port="%DB_PORT%" ^
  --username="%DB_USER%" ^
  --dbname="%DB_NAME%" ^
  --verbose ^
  --clean ^
  --no-owner ^
  --no-privileges ^
  --format=plain ^
  --file="%BACKUP_FILE%"

REM Check if backup was successful
if %errorlevel% equ 0 (
    echo ✅ Database backup completed successfully!
    echo 📁 Backup file: %BACKUP_FILE%
    for %%A in ("%BACKUP_FILE%") do echo 📊 File size: %%~zA bytes
) else (
    echo ❌ Database backup failed!
    exit /b 1
)

echo 🔒 Remember to store this backup in a safe location!
pause
