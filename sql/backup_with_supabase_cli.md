# Backup Database with Supabase CLI

## Prerequisites
1. Install Supabase CLI: `npm install -g supabase`
2. Login to Supabase: `supabase login`
3. Link your project: `supabase link --project-ref your-project-ref`

## Backup Commands

### Full Database Backup
```bash
# Create a full backup
supabase db dump --file backup_$(date +%Y%m%d_%H%M%S).sql

# Or with specific tables
supabase db dump --table interviews --table candidates --file interviews_backup.sql
```

### Schema Only Backup
```bash
# Backup only the schema (structure)
supabase db dump --schema-only --file schema_backup.sql
```

### Data Only Backup
```bash
# Backup only the data
supabase db dump --data-only --file data_backup.sql
```

## Restore from Backup
```bash
# Restore from backup file
supabase db reset --file backup_20241201_143022.sql
```
