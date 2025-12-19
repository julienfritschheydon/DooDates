# Slow Queries Optimization Analysis

**Date:** 2025-01-11  
**Source:** Supabase Slow Queries Report

## Executive Summary

Analysis of slow queries shows:
- **45%** from system queries (dashboard, metadata) - cannot be optimized
- **19.7%** from `pg_timezone_names` - system query, needs investigation
- **18%** from conversations queries - **OPTIMIZED** ✅
- **17.3%** from other application queries - mostly acceptable

## Optimizations Implemented

### ✅ 1. Conversations Query with poll_data Filter (12.8% → Expected <5%)

**Query Pattern:**
```sql
SELECT * FROM conversations 
WHERE user_id = $1 AND poll_data IS NOT NULL
LIMIT $2 OFFSET $3
```

**Metrics:**
- 33,861 calls
- 0.9ms mean (already good, but can be better)
- 12.8% of total time

**Optimization:**
- Created composite index: `idx_conversations_user_poll_data(user_id, updated_at DESC) WHERE poll_data IS NOT NULL`
- This index covers the exact query pattern and ordering

**Expected Impact:** 30-50% reduction in query time

### ✅ 2. Conversations Query with updated_at Ordering (5.2% → Expected <2%)

**Query Pattern:**
```sql
SELECT * FROM conversations 
WHERE user_id = $1
ORDER BY updated_at DESC
LIMIT $2 OFFSET $3
```

**Metrics:**
- 4,137 calls
- 3ms mean
- 5.2% of total time

**Optimization:**
- Created composite index: `idx_conversations_user_updated_at(user_id, updated_at DESC) WHERE user_id IS NOT NULL`
- This index covers user filtering and ordering in one index

**Expected Impact:** 50-70% reduction in query time

## Queries That Cannot Be Optimized (System Queries)

### 🔴 pg_timezone_names Query (19.7% of total time)

**Query:**
```sql
SELECT name FROM pg_timezone_names
```

**Metrics:**
- 168 calls
- 278ms mean (52ms - 1115ms)
- **0% cache hit rate** ⚠️
- 200,592 rows read per call

**Analysis:**
- This is a PostgreSQL system catalog query
- Called by Supabase dashboard or system functions
- 0% cache hit indicates different query contexts
- Cannot be optimized directly

**Recommendations:**
1. **Investigate origin:** Check Supabase logs to identify caller
2. **If from dashboard:** Contact Supabase support
3. **If from application:** 
   - Cache timezone list client-side
   - Use browser's `Intl.DateTimeFormat().resolvedOptions().timeZone` instead
   - Only fetch timezones when needed

**Monitoring:**
```sql
-- Check if query is called from application
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%pg_timezone_names%'
ORDER BY total_time DESC;
```

### 🟡 Dashboard pg_proc Query (25.3% of total time)

**Query:** Complex function metadata query from Supabase dashboard

**Metrics:**
- 381 calls
- 157ms mean
- **100% cache hit rate** ✅

**Analysis:**
- System query from Supabase dashboard
- Already optimized (100% cache hit)
- No action needed

## Other Queries Analysis

### ✅ Application Queries (All Performing Well)

1. **INSERT refresh_tokens** (4.8%)
   - 5,461 calls, 2ms mean
   - 99.99% cache hit rate
   - ✅ Performance acceptable

2. **INSERT analytics_events** (3.8%)
   - 6,780 calls, 1.3ms mean
   - 99.99% cache hit rate
   - ✅ Performance excellent

3. **INSERT sessions** (2.2%)
   - 3,893 calls, 1.3ms mean
   - 99.99% cache hit rate
   - ✅ Performance excellent

4. **set_config calls** (2.9%)
   - 87,602 calls, 0.08ms mean
   - 100% cache hit rate
   - ✅ Performance excellent (PostgREST overhead)

### 🟡 Function Calls (Monitor)

1. **consume_ai_credit** (2.9%)
   - 2,840 calls, 2.4ms mean
   - 100% cache hit rate
   - ✅ Performance acceptable, monitor for degradation

2. **consume_quota_credits** (1.0%)
   - 204 calls, 11.4ms mean
   - 99.99% cache hit rate
   - ⚠️ Higher mean time, but low call count
   - Monitor if call frequency increases

3. **check_and_expire_beta_keys** (2.1%)
   - 43 calls, 113ms mean
   - 99.99% cache hit rate
   - ⚠️ Slow but infrequent (scheduled job)
   - Consider optimizing if it becomes a bottleneck

## Expected Performance Improvements

After applying optimizations:

| Query | Before | Expected After | Improvement |
|-------|--------|-----------------|-------------|
| Conversations + poll_data | 12.8% | ~5-7% | 40-50% reduction |
| Conversations + updated_at | 5.2% | ~1.5-2% | 60-70% reduction |
| **Total Application Queries** | **18%** | **~7-9%** | **50% reduction** |

## Monitoring Recommendations

### 1. Track Index Usage

```sql
-- Check if new indexes are being used
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'conversations'
ORDER BY idx_scan DESC;
```

### 2. Monitor Query Performance

```sql
-- Check slow queries after optimization
SELECT 
  query,
  calls,
  mean_exec_time,
  total_exec_time,
  (total_exec_time / sum(total_exec_time) OVER ()) * 100 as pct_total
FROM pg_stat_statements
WHERE query LIKE '%conversations%'
ORDER BY total_exec_time DESC
LIMIT 10;
```

### 3. Verify Index Effectiveness

```sql
-- Test query plans
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM conversations 
WHERE user_id = 'test-uuid' AND poll_data IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;
```

## Action Items

### Immediate (This Week)
- [x] Create composite indexes for conversations queries
- [ ] Apply migration to production
- [ ] Monitor query performance after migration
- [ ] Verify index usage with pg_stat_user_indexes

### Short Term (This Month)
- [ ] Investigate pg_timezone_names query origin
- [ ] If from application, implement client-side caching
- [ ] Review consume_quota_credits function if call frequency increases
- [ ] Set up automated monitoring for slow queries

### Long Term (Ongoing)
- [ ] Quarterly review of slow queries
- [ ] Proactive index optimization based on query patterns
- [ ] Performance regression testing

## Migration Applied

**File:** `supabase/migrations/20250111_optimize_slow_queries.sql`

**Changes:**
1. Created `idx_conversations_user_poll_data` composite index
2. Created `idx_conversations_user_updated_at` composite index
3. Created `idx_conversations_has_poll_data` partial index
4. Ran ANALYZE on conversations table

## References

- [PostgreSQL Index Types](https://www.postgresql.org/docs/current/indexes-types.html)
- [PostgreSQL Partial Indexes](https://www.postgresql.org/docs/current/indexes-partial.html)
- [Supabase Performance Tuning](https://supabase.com/docs/guides/platform/performance)
- [Query Performance Tips](https://www.postgresql.org/docs/current/performance-tips.html)

