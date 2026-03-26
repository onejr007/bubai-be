# Couchbase Troubleshooting Quick Guide

## Error: key_value_collection_outdated

### Penyebab
Collection metadata belum siap atau tidak ada primary index.

### Solusi Cepat
1. Tunggu warmup selesai (5-10 detik setelah start)
2. Restart aplikasi untuk trigger warmup ulang
3. Manual create index via Couchbase Console

### Manual Index Creation
```sql
-- Login ke Couchbase Console > Query
CREATE PRIMARY INDEX ON `your_bucket`._default.hp_cam_sessions;
CREATE PRIMARY INDEX ON `your_bucket`._default.hp_cam_signals;
```

## Error: UnambiguousTimeoutError

### Penyebab
- Network latency tinggi
- Couchbase Cloud overloaded
- Timeout terlalu pendek

### Solusi
1. Increase timeout di `database.ts`:
```typescript
timeouts: {
  kvTimeout: 20000, // dari 10000 ke 20000
  queryTimeout: 120000, // dari 75000 ke 120000
}
```

2. Check network connectivity:
```bash
ping svc-dqis-node-001.s0ukypm-djhcdpt.cloud.couchbase.com
```

## Fallback ke In-Memory

### Temporary Disable Couchbase
Di `.env`, comment out:
```env
# COUCHBASE_CONNECTION_STRING=...
# COUCHBASE_USERNAME=...
# COUCHBASE_PASSWORD=...
```

Aplikasi akan otomatis gunakan in-memory store.

### Re-enable Couchbase
1. Uncomment credentials di `.env`
2. Restart aplikasi
3. Tunggu warmup selesai

## Monitoring Logs

### Good Signs ✅
```
✅ Couchbase connected successfully!
✅ Primary index ensured for: hp_cam_sessions
✅ Collection ready: hp_cam_sessions
✅ Collection warmup completed
📱 Session created (Couchbase): [id]
```

### Warning Signs ⚠️
```
⚠️ get session failed (attempt 1/3), retrying...
⚠️ Couchbase insert failed, using in-memory
⚠️ Collection hp_cam_sessions not ready after warmup
```

### Error Signs ❌
```
❌ Couchbase connection failed
❌ Collection metadata not ready after 3 attempts
error: UnambiguousTimeoutError
```

## Performance Tuning

### Reduce Warmup Time
Di `database.ts`, kurangi delay:
```typescript
// Dari 5000ms ke 2000ms
await new Promise(resolve => setTimeout(resolve, 2000));
```

### Increase Retry Attempts
Di `service.ts`, ubah maxRetries:
```typescript
await this.retryOperation(async () => {
  // operation
}, 5, 'operation name'); // dari 3 ke 5
```

## Health Check Endpoint

Test Couchbase connection:
```bash
curl http://localhost:3000/api/hp-cam-session/stats
```

Response:
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

## Common Issues

### Issue: Warmup takes too long
**Solution**: Collections mungkin belum ada. Create manual via Console.

### Issue: Retry loop tidak berhenti
**Solution**: Check error type di log, mungkin bukan retryable error.

### Issue: In-memory fallback terus terjadi
**Solution**: Couchbase credentials salah atau network issue.

### Issue: Session hilang setelah restart
**Solution**: Normal jika pakai in-memory. Pastikan Couchbase connected.

## Contact Support

Jika masalah persist:
1. Collect logs (last 100 lines)
2. Check Couchbase Console untuk errors
3. Verify bucket permissions
4. Contact Couchbase support dengan error details
