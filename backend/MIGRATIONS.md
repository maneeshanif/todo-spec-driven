# Database Migration Guide

This guide covers how to work with database migrations using Alembic.

## Prerequisites

- PostgreSQL database (local or Neon)
- UV package manager installed
- DATABASE_URL environment variable configured

## Quick Reference

```bash
# Check current migration status
uv run alembic current

# Upgrade to latest
uv run alembic upgrade head

# Downgrade one version
uv run alembic downgrade -1

# Show migration history
uv run alembic history

# Create new migration
uv run alembic revision --autogenerate -m "description"
```

## Testing Migrations

### Automated Test Script

Run the comprehensive migration test script:

```bash
cd backend
export DATABASE_URL="your-database-url"
./scripts/test_migrations.sh
```

This script tests:
- ✅ Migration upgrade to latest
- ✅ Migration downgrade
- ✅ Re-upgrade after downgrade
- ✅ Database schema verification

### Manual Testing

#### 1. Check Current Status

```bash
uv run alembic current
```

Expected output:
```
001 (head)
```

#### 2. Test Downgrade

```bash
uv run alembic downgrade -1
```

Expected output:
```
INFO  [alembic.runtime.migration] Running downgrade 001 -> base
```

#### 3. Test Upgrade

```bash
uv run alembic upgrade head
```

Expected output:
```
INFO  [alembic.runtime.migration] Running upgrade base -> 001, initial schema
```

## Migration Files

### Current Migrations

- `001_initial_schema.py` - Creates users and tasks tables

### Migration Structure

```python
# alembic/versions/001_initial_schema.py
def upgrade():
    # Create tables
    pass

def downgrade():
    # Drop tables
    pass
```

## Common Issues

### Issue: "Target database is not up to date"

**Solution**: Run upgrade first
```bash
uv run alembic upgrade head
```

### Issue: "Can't locate revision identified by"

**Solution**: Check alembic_version table
```sql
SELECT * FROM alembic_version;
```

### Issue: Connection refused

**Solution**: Verify DATABASE_URL
```bash
echo $DATABASE_URL
```

## Creating New Migrations

### Auto-generate from model changes

```bash
# 1. Modify models in src/models/
# 2. Generate migration
uv run alembic revision --autogenerate -m "add new column"

# 3. Review generated migration in alembic/versions/
# 4. Apply migration
uv run alembic upgrade head
```

### Manual migration

```bash
# Create empty migration
uv run alembic revision -m "manual change"

# Edit the generated file
# Add upgrade() and downgrade() logic
```

## Best Practices

1. **Always review auto-generated migrations** - Alembic may miss some changes
2. **Test downgrade** - Ensure migrations can be rolled back
3. **Keep migrations small** - One logical change per migration
4. **Never modify applied migrations** - Create new ones instead
5. **Backup before production migrations** - Safety first

## Environment-Specific Migrations

### Development

```bash
export DATABASE_URL="postgresql://localhost:5432/todoapp_dev"
uv run alembic upgrade head
```

### Staging

```bash
export DATABASE_URL="<neon-staging-url>"
uv run alembic upgrade head
```

### Production

```bash
export DATABASE_URL="<neon-production-url>"
# Review migration first!
uv run alembic upgrade head
```

## Rollback Strategy

### Rollback last migration

```bash
uv run alembic downgrade -1
```

### Rollback to specific version

```bash
uv run alembic downgrade 001
```

### Rollback all migrations

```bash
uv run alembic downgrade base
```

## Troubleshooting

### Check migration history

```bash
uv run alembic history --verbose
```

### Stamp database without running migrations

```bash
uv run alembic stamp head
```

### Show SQL without executing

```bash
uv run alembic upgrade head --sql
```

## Testing Checklist

- [ ] Migration upgrades successfully
- [ ] Migration downgrades successfully
- [ ] Re-upgrade works after downgrade
- [ ] All tables created correctly
- [ ] All indexes created correctly
- [ ] Foreign keys created correctly
- [ ] No data loss during migration
- [ ] Production backup taken before migration

## Support

For migration issues:
- Check Alembic logs in `alembic.log`
- Review database logs
- Verify DATABASE_URL is correct
- Test on local database first
