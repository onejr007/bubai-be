# NO FALLBACK POLICY - Couchbase Only

## Policy Overview

Aplikasi ini mengimplementasikan **NO FALLBACK POLICY** untuk database storage. Semua data HARUS disimpan di Couchbase Cloud. Tidak ada in-memory fallback.

## Why No Fallback?

### Production-Ready Architecture
- Data persistence guaranteed
- No data loss on restart
- Consistent behavior across environments
- Clear failure modes

### Data Integrity
- Single source of truth
- No sync issues between memory and database
- Predictable data lifecycle
- Proper TTL and expiry handling

### Operational Clarity
- Clear monitoring: database up = service up
- No ambiguous states
- Easier troubleshooting
- Proper alerting

## Implementation

### Server Startup
```typescript
// Server will NOT start if Couchbase unavailable
await db.connect(); // Throws error if fails
// No try-catch, no fallback
```

**Result:**
- ✅ Couchbase connected → Server starts
- ❌ Couchbase failed → Server exits with error code 1

### Service Operations
```typescript
// All operations check database availability
if (!this.useCouchbase()) {
  throw new AppError(503, 'Database not connected. Couchbase is required.');
}
```

**Result:**
- ✅ Database connected → Operation proceeds
- ❌ Database unavailable → HTTP 503 error

### Removed Code
- ❌ `inMemoryStore` imports removed
- ❌ All `if/else` fallback logic removed
- ❌ Memory storage branches deleted
- ❌ Fallback logging removed

## Error Responses

### Server Won't Start
```
❌ Failed to start server: [error details]
💥 CRITICAL: Couchbase connection is REQUIRED. Server cannot start without database.
Please check:
  1. COUCHBASE_CONNECTION_STRING is correct in .env
  2. COUCHBASE_USERNAME and COUCHBASE_PASSWORD are valid
  3. Network connectivity to Couchbase Cloud
  4. Bucket exists and is accessible
```

### Operation Fails (503)
```json
{
  "status": "error",
  "statusCode": 503,
  "message": "Database not connected. Couchbase is required."
}
```

### Operation Fails (500)
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Failed to create session: [specific error]"
}
```

## Health Check

### Endpoint
```bash
GET /health
```

### Response
```json
{
  "status": "ok",
  "timestamp": "2026-03-26T...",
  "database": "connected"  // or "disconnected"
}
```

### Stats Endpoint
```bash
GET /api/hp-cam-session/stats
```

### Response
```json
{
  "status": "success",
  "data": {
    "storage": "couchbase",
    "connected": true,
    "bucket": "your_bucket"
  }
}
```

## Deployment Requirements

### Environment Variables (REQUIRED)
```env
COUCHBASE_CONNECTION_STRING=couchbases://cb.xxx.cloud.couchbase.com
COUCHBASE_USERNAME=your_username
COUCHBASE_PASSWORD=your_password
COUCHBASE_BUCKET=your_bucket
```

### Pre-Deployment Checklist
- [ ] Couchbase credentials configured
- [ ] Network connectivity tested
- [ ] Bucket exists and accessible
- [ ] Primary indexes created
- [ ] Test connection successful
- [ ] Monitoring/alerting configured

### Post-Deployment Verification
1. Check server starts successfully
2. Verify warmup completes
3. Test create session
4. Test get session
5. Test join session
6. Monitor logs for errors

## Monitoring & Alerting

### Critical Alerts
- Server fails to start
- Database connection lost
- High error rate (503/500)
- Timeout errors increasing

### Metrics to Track
- Database connection status
- Operation success rate
- Response times
- Retry attempts
- Error rates by type

### Log Patterns

**Success:**
```
✅ Couchbase connected successfully!
✅ Collection warmup completed
🚀 Server running successfully!
```

**Warning:**
```
⚠️ [operation] failed (attempt X/3), retrying...
```

**Error:**
```
❌ Couchbase connection failed
💥 CRITICAL: Couchbase connection is REQUIRED
```

## Troubleshooting

### Server Won't Start
1. Check environment variables
2. Test network connectivity
3. Verify Couchbase credentials
4. Check bucket exists
5. Review Couchbase Console logs

### Operations Return 503
1. Check database connection status
2. Restart server to reconnect
3. Verify Couchbase cluster health
4. Check network stability

### High Timeout Errors
1. Increase timeout values
2. Check network latency
3. Monitor Couchbase performance
4. Consider upgrading Couchbase plan

## Comparison: Before vs After

### Before (With Fallback)
```typescript
try {
  await couchbase.insert(data);
} catch (error) {
  // Fallback to memory
  inMemoryStore.save(data);
}
```

**Issues:**
- Data inconsistency
- Lost data on restart
- Unclear failure modes
- Hard to debug

### After (No Fallback)
```typescript
if (!db.isReady()) {
  throw new AppError(503, 'Database required');
}
await couchbase.insert(data);
```

**Benefits:**
- Clear failure modes
- Data persistence guaranteed
- Easy to monitor
- Production-ready

## Migration Notes

### Removed Files
- `BE/src/modules/hp-cam-session/inMemoryStore.ts` - still exists but not used

### Modified Files
- `BE/src/modules/hp-cam-session/service.ts` - removed all fallback logic
- `BE/src/index.ts` - removed startup fallback
- `BE/src/core/database.ts` - enhanced warmup

### Breaking Changes
- Server will NOT start without Couchbase
- No graceful degradation
- All operations require database

## Support

### Common Questions

**Q: What if Couchbase is temporarily unavailable?**
A: Server will not start. Fix Couchbase connection and restart.

**Q: Can I use in-memory for development?**
A: No. Use Couchbase for all environments to match production.

**Q: What about testing?**
A: Use test Couchbase bucket or mock the database layer.

**Q: How to handle maintenance windows?**
A: Schedule downtime or use Couchbase cluster failover.

### Getting Help
1. Check logs for specific errors
2. Review troubleshooting guide
3. Verify Couchbase Console
4. Contact Couchbase support
5. Review this documentation

## Conclusion

NO FALLBACK POLICY ensures:
- ✅ Production-ready architecture
- ✅ Data integrity and persistence
- ✅ Clear operational model
- ✅ Easier monitoring and debugging
- ✅ Predictable behavior

**Trade-off:** Less fault tolerance, but more reliability and clarity.
