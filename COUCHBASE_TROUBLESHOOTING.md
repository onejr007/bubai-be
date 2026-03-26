# Couchbase Troubleshooting Quick Guide

## PENTING: NO FALLBACK POLICY

Aplikasi ini TIDAK menggunakan in-memory fallback. Couchbase Cloud adalah SATU-SATUNYA storage.

**Jika Couchbase tidak tersedia:**
- ❌ Server TIDAK akan start
- ❌ Semua operasi akan gagal dengan error 503
- ❌ Tidak ada data yang disimpan di memory

## Error: Server Won't Start

### Penyebab
Couchbase connection gagal saat startup.

### Solusi
1. Check environment variables di `.env`:
   ```env
   COUCHBASE_CONNECTION_STRING=couchbases://cb.xxx.cloud.couchbase.com
   COUCHBASE_USERNAME=your_username
   COUCHBASE_PASSWORD=your_password
   COUCHBASE_BUCKET=your_bucket
   ```

2. Test connectivity:
   ```bash
   ping svc-dqis-node-001.s0ukypm-djhcdpt.cloud.couchbase.com
   ```

3. Verify credentials di Couchbase Console

4. Check bucket exists dan accessible

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

## Error: 503 Service Unavailable

### Penyebab
Database tidak terkoneksi saat operasi dipanggil.

### Solusi
1. Restart server untuk reconnect ke Couchbase
2. Check Couchbase cluster status
3. Verify network tidak terputus

## Monitoring Logs

### Good Signs ✅
```
✅ Couchbase connected successfully!
✅ Primary index ensured for: hp_cam_sessions
✅ Collection ready: hp_cam_sessions
✅ Collection warmup completed
🚀 Server running successfully!
📱 Session created (Couchbase): [id]
```

### Warning Signs ⚠️
```
⚠️ get session failed (attempt 1/3), retrying...
⚠️ Collection hp_cam_sessions not ready after warmup
```

### Error Signs ❌
```
❌ Couchbase connection failed
❌ Collection metadata not ready after 3 attempts
💥 CRITICAL: Couchbase connection is REQUIRED
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
curl http://localhost:3000/health
```

Response jika OK:
```json
{
  "status": "ok",
  "timestamp": "2026-03-26T...",
  "database": "connected"
}
```

Response jika ERROR:
```json
{
  "status": "ok",
  "timestamp": "2026-03-26T...",
  "database": "disconnected"
}
```

## Stats Endpoint

Check storage info:
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

### Issue: Server crashes on startup
**Solution**: Couchbase credentials salah atau network issue. Fix credentials dan restart.

### Issue: Operations return 503
**Solution**: Database connection lost. Restart server untuk reconnect.

## Production Deployment Checklist

Sebelum deploy:
- [ ] Couchbase credentials di environment variables
- [ ] Test connection dari server ke Couchbase Cloud
- [ ] Primary indexes sudah dibuat
- [ ] Warmup berhasil di staging
- [ ] Health check endpoint accessible
- [ ] Monitoring/alerting setup untuk database unavailability
- [ ] Backup strategy untuk Couchbase data

## Emergency Procedures

### Database Down
1. Check Couchbase Cloud status
2. Verify network connectivity
3. Check credentials masih valid
4. Contact Couchbase support jika cluster issue

### High Latency
1. Check network latency ke Couchbase Cloud
2. Consider increasing timeouts
3. Monitor Couchbase cluster performance
4. Consider upgrading Couchbase plan

## Contact Support

Jika masalah persist:
1. Collect logs (last 100 lines)
2. Check Couchbase Console untuk errors
3. Verify bucket permissions
4. Test connection dengan couchbase CLI
5. Contact Couchbase support dengan error details
