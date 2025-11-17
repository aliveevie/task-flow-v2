# PostgreSQL Commands for Galaxy User

## Connect to PostgreSQL as galaxy user

```bash
psql -U galaxy -d connectiondb
```

Or if you need to specify password:
```bash
PGPASSWORD=office4321 psql -U galaxy -d connectiondb
```

## Once connected, check tables:

```sql
-- List all tables
\dt

-- Or more detailed:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Count tables
SELECT COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public';
```

## Check if you have CREATE permissions:

```sql
-- Check your current user
SELECT current_user;

-- Check schema permissions
SELECT 
    nspname as schema_name,
    nspacl as permissions
FROM pg_namespace 
WHERE nspname = 'public';
```

## Exit psql:
```sql
\q
```

