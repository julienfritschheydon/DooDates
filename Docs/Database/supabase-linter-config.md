# Supabase Database Linter Configuration

## Foreign Key Index Warnings Suppression

This document explains how to handle unused index warnings for foreign key indexes in Supabase's database linter.

### Problem

The Supabase database linter reports foreign key indexes as "unused" because it only tracks SELECT query usage. However, these indexes are critical for:

- Foreign key constraint checks during DELETE/UPDATE on referenced tables
- Cascading DELETE/UPDATE operations
- Referential integrity validation

### Affected Indexes

The following indexes may appear unused but should **NOT** be removed:

1. `idx_analytics_events_user_id_fkey` - `analytics_events.user_id` → `profiles.id`
2. `idx_beta_keys_created_by_fkey` - `beta_keys.created_by` → `auth.users.id`
3. `idx_conversations_poll_id_fkey` - `conversations.poll_id` → `polls.id`
4. `idx_conversations_related_poll_id_fkey` - `conversations.related_poll_id` → `polls.id`
5. `idx_messages_user_id_fkey` - `messages.user_id` → `auth.users.id`
6. `idx_poll_options_poll_id_fkey` - `poll_options.poll_id` → `polls.id`
7. `idx_quota_tracking_journal_quota_tracking_id_fkey` - `quota_tracking_journal.quota_tracking_id` → `quota_tracking.id`
8. `idx_votes_poll_id_fkey` - `votes.poll_id` → `polls.id`
9. `idx_votes_voter_id_fkey` - `votes.voter_id` → `profiles.id`

### Solutions

#### Option 1: Configure Splinter (Recommended)

Supabase uses **Splinter** as its database linter. Create a `splinter.toml` file in your project root to suppress these warnings:

```toml
# Suppress unused_index warnings for foreign key indexes
[rules.unused_index]
level = "info"  # or "off" to completely disable

# Pattern matching for indexes ending with _fkey
[rules.unused_index.ignore]
patterns = [
  "*_fkey",  # Ignore all indexes ending with _fkey
]
```

**Action:** The `splinter.toml` file has been created in the project root. This should suppress the warnings when running the linter via Supabase CLI or dashboard.

#### Option 2: Inline Suppression Comments

Add `-- splinter-ignore-next-line unused_index` comments before each CREATE INDEX statement:

```sql
-- splinter-ignore-next-line unused_index
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id_fkey
  ON analytics_events(user_id);
```

**Action:** The `sql-scripts/add-foreign-key-indexes.sql` file has been updated with inline suppression comments.

#### Option 3: Add Index Comments

Run `sql-scripts/suppress-fk-index-warnings.sql` to add comments to these indexes explaining why they're kept. This helps with documentation and may help if Supabase adds comment-based suppression in the future.

```sql
-- Run this script to document FK indexes
\i sql-scripts/suppress-fk-index-warnings.sql
```

#### Option 4: Supabase Dashboard Suppression

If Supabase adds linter configuration in the dashboard:

1. Go to your Supabase project dashboard
2. Navigate to Database → Linter settings
3. Add these index names to the ignore list:
   - `idx_analytics_events_user_id_fkey`
   - `idx_beta_keys_created_by_fkey`
   - `idx_conversations_poll_id_fkey`
   - `idx_conversations_related_poll_id_fkey`
   - `idx_messages_user_id_fkey`
   - `idx_poll_options_poll_id_fkey`
   - `idx_quota_tracking_journal_quota_tracking_id_fkey`
   - `idx_votes_poll_id_fkey`
   - `idx_votes_voter_id_fkey`

#### Option 5: Pattern-Based Suppression (Already Configured)

If Supabase supports pattern-based suppression, configure the linter to ignore indexes matching:

- Pattern: `*_fkey`
- Rule: `unused_index`

### Verification

To verify these indexes exist and are properly documented:

```sql
-- List all foreign key indexes with their comments
SELECT
  i.indexname,
  t.tablename,
  obj_description(i.indexrelid, 'pg_class') as comment
FROM pg_indexes i
JOIN pg_class c ON c.relname = i.indexname
LEFT JOIN pg_description d ON d.objoid = c.oid
JOIN pg_tables t ON t.tablename = i.tablename
WHERE i.indexname LIKE '%_fkey'
  AND i.schemaname = 'public'
ORDER BY t.tablename, i.indexname;
```

### Related Files

- `splinter.toml` - **Splinter linter configuration** (suppresses FK index warnings)
- `sql-scripts/add-foreign-key-indexes.sql` - Creates FK indexes with inline suppression
- `sql-scripts/remove-unused-indexes.sql` - Documents which indexes to keep
- `sql-scripts/suppress-fk-index-warnings.sql` - Adds comments to FK indexes

### References

- [Supabase Database Linter Documentation](https://supabase.com/docs/guides/database/database-linter)
- [Splinter Documentation](https://supabase.github.io/splinter/) - Supabase's database linter
- [PostgreSQL Foreign Key Performance](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK)

### Quick Start

1. **Use the configuration file** (easiest): The `splinter.toml` file is already created in the project root
2. **Run migrations**: Execute `sql-scripts/add-foreign-key-indexes.sql` if indexes don't exist yet
3. **Verify**: Run `supabase db lint` to check if warnings are suppressed
