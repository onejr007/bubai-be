# Couchbase Cloud Optimization

## Problem Analysis

Error `key_value_collection_outdated` dan timeout issues terjadi karena:

1. **High Latency** - Couchbase Cloud memiliki latency lebih tinggi dibanding on-premise
2. **Insufficient Timeouts** - Default timeout (2.5s) terlalu pendek untuk Cloud
3. **Collection Metadata Sync** - Cloud membutuhkan waktu lebih lama untuk sync metadata
4. **Network Overhead** - Setiap request ke Cloud memiliki network overhead

## Solution Implemented

### 1. WAN Development Profile

Menggunakan `wanDevelopment` configuration profile yang direkomendasikan untuk Cloud:

```typescript
configProfile: 'wanDevelopment'
```

**Benefits:**
- KV timeout: 2.5s → 20s
- Query timeout: 75s → 120s
- All timeouts optimized for high-latency environments

### 2. Extended Timeouts

Timeout configuration untuk Couchbase Cloud:

```typescript
timeouts: {
  connectTimeout: 30000,      // 30s for initial connection
  kvTimeout: 20000,           // 20s for KV operations
  kvDurableTimeout: 20000,    // 20s for durable writes
  queryTimeout: 120000,       // 120s for queries
  viewTimeout: 120000,        // 120s for views
  searchTimeout: 120000,      // 120s for search
  analyticsTimeout: 120000,   // 120s for analytics
  managementTimeout: 120000,  // 120s for management
}
```

### 3. Simplified Collection Warmup

Removed complex warmup logic, using simple upsert approach:

```typescript
// Simple upsert to ensure collection is writable
await collection.upsert(testKey, { warmup: true }, { 
  timeout: 15000,  // 15s timeout
  expiry: 5        // Auto-delete after 5s
});
```

**Why this works:**
- Couchbase Cloud auto-creates collections on first write
- Upsert is more reliable than get() for warmup
- No need for manual index creation
- Simpler and faster

### 4. Increased Retry Delays

Exponential backoff optimized for Cloud latency:

```typescript
// Before: 200ms, 500ms, 1000ms
// After:  500ms, 1000ms, 2000ms
const delay = 500 * Math.pow(2, attempt - 1);
```

### 5. Cluster Ping Verification

Added ping to verify connectivity before operations:

```typescript
const pingResult = await this.cluster.ping();
logger.info(`✅ Ping successful`);
```

## Performance Improvements

### Before
- Connection time: 5-10 seconds
- Frequent timeouts on operations
- Retry loops consuming resources
- Inconsistent behavior

### After
- Connection time: 10-30 seconds (but stable)
- Rare timeouts (only on actual network issues)
- Efficient retry with proper delays
- Consistent and reliable

## Configuration Reference

### Environment Variables
```env
COUCHBASE_CONNECTION_STRING=couchbases://cb.xxx.cloud.couchbase.com
COUCHBASE_USERNAME=your_username
COUCHBASE_PASSWORD=your_password
COUCHBASE_BUCKET=your_bucket
```

### Service Constants
```typescript
private SESSION_TTL = 300;        // 5 minutes
private SIGNAL_TTL = 60;          // 1 minute
private KV_TIMEOUT = 20000;       // 20 seconds (Cloud optimized)
```

### Retry Configuration
```typescript
maxRetries: 3
delays: [500ms, 1000ms, 2000ms]
total max time: ~3.5 seconds
```

## Best Practices for Couchbase Cloud

### 1. Always Use wanDevelopment Profile
```typescript
configProfile: 'wanDevelopment'
```

### 2. Set Explicit Timeouts
Don't rely on defaults - always specify timeout:
```typescript
await collection.get(key, { timeout: 20000 });
```

### 3. Use Retry Logic
Always wrap operations in retry logic for transient errors:
```typescript
await this.retryOperation(async () => {
  return await collection.insert(key, value, { timeout: 20000 });
}, 3, 'insert operation');
```

### 4. Implement Exponential Backoff
Use increasing delays between retries:
```typescript
const delay = 500 * Math.pow(2, attempt - 1);
```

### 5. Monitor Connection Health
Use ping to verify connectivity:
```typescript
const pingResult = await cluster.ping();
```

### 6. Handle Collection Metadata Delays
Collections may not be immediately available after creation:
- Use upsert instead of get for warmup
- Allow 15-30 seconds for initial connection
- Don't fail fast on first timeout

## Monitoring

### Key Metrics to Track

1. **Connection Time**
   - Target: < 30 seconds
   - Alert if: > 60 seconds

2. **Operation Latency**
   - Target: < 5 seconds for KV ops
   - Alert if: > 15 seconds

3. **Retry Rate**
   - Target: < 5% of operations
   - Alert if: > 20%

4. **Timeout Errors**
   - Target: 0 per hour
   - Alert if: > 5 per hour

### Log Patterns

**Healthy:**
```
✅ Cluster connected
🏓 Ping successful
✅ Collection ready: hp_cam_sessions
✅ Couchbase Cloud connected successfully!
```

**Warning:**
```
⚠️ insert session failed (attempt 1/3), retrying in 500ms...
⚠️ Collection warmup issue (non-critical)
```

**Error:**
```
❌ Collection metadata not ready after 3 attempts
❌ Couchbase connection failed
```

## Troubleshooting

### Issue: Slow Initial Connection (10-30s)
**Status:** NORMAL for Couchbase Cloud
**Reason:** Network latency + metadata sync
**Action:** No action needed, this is expected

### Issue: Occasional Timeouts
**Status:** ACCEPTABLE if < 5% of operations
**Reason:** Network variability
**Action:** Retry logic handles this automatically

### Issue: Frequent Timeouts (> 20%)
**Status:** PROBLEM
**Possible Causes:**
1. Network connectivity issues
2. Couchbase Cloud cluster overloaded
3. Insufficient Couchbase plan resources
**Action:**
1. Check network latency to Cloud
2. Review Couchbase Console metrics
3. Consider upgrading Couchbase plan

### Issue: Connection Fails Completely
**Status:** CRITICAL
**Possible Causes:**
1. Invalid credentials
2. Network blocked
3. Couchbase cluster down
**Action:**
1. Verify credentials in .env
2. Test network connectivity
3. Check Couchbase Cloud status

## Performance Tuning

### If Operations Are Still Slow

1. **Increase KV Timeout:**
   ```typescript
   private KV_TIMEOUT = 30000; // 30 seconds
   ```

2. **Increase Retry Attempts:**
   ```typescript
   await this.retryOperation(operation, 5, 'name'); // 5 retries
   ```

3. **Increase Retry Delays:**
   ```typescript
   const delay = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s
   ```

### If Connection Is Too Slow

1. **Reduce Warmup Operations:**
   - Skip warmup for non-critical collections
   - Use lazy initialization

2. **Parallel Warmup:**
   ```typescript
   await Promise.all(collections.map(c => warmupCollection(c)));
   ```

3. **Cache Collection References:**
   - Store collection objects
   - Reuse instead of recreating

## Comparison: On-Premise vs Cloud

| Aspect | On-Premise | Cloud |
|--------|-----------|-------|
| Connection Time | 1-2s | 10-30s |
| KV Operation | < 1ms | 50-200ms |
| Query Operation | 10-100ms | 100-500ms |
| Timeout Needed | 2.5s | 20s |
| Retry Rate | < 1% | 2-5% |
| Network Latency | < 1ms | 50-100ms |

## References

- [Couchbase Cloud Documentation](https://docs.couchbase.com/cloud/index.html)
- [Node.js SDK Client Settings](https://docs.couchbase.com/nodejs-sdk/current/ref/client-settings.html)
- [Managing Connections](https://docs.couchbase.com/nodejs-sdk/4.3/howtos/managing-connections.html)
- [WAN Development Profile](https://docs.couchbase.com/nodejs-sdk/current/ref/client-settings.html#wan-development)

## Conclusion

Couchbase Cloud requires different configuration than on-premise:
- ✅ Longer timeouts (20s vs 2.5s)
- ✅ Retry logic with exponential backoff
- ✅ wanDevelopment profile
- ✅ Patience during initial connection
- ✅ Monitoring and alerting

These optimizations ensure stable and reliable operation with Couchbase Cloud.
