#!/bin/bash

# Database Backup Script for Supabase
# This script creates a backup of your Supabase database

# Configuration
DB_HOST="your-project-ref.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/supabase_backup_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting database backup..."
echo "📁 Backup will be saved to: $BACKUP_FILE"

# Create backup using pg_dump
pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --verbose \
  --clean \
  --no-owner \
  --no-privileges \
  --format=plain \
  --file="$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "✅ Database backup completed successfully!"
    echo "📁 Backup file: $BACKUP_FILE"
    echo "📊 File size: $(du -h "$BACKUP_FILE" | cut -f1)"
else
    echo "❌ Database backup failed!"
    exit 1
fi

echo "🔒 Remember to store this backup in a safe location!"
