# Perbaikan Couchbase Timeout Error

## Masalah
Error `UnambiguousTimeoutError` dan `AmbiguousTimeoutError` dengan retry reason `key_value_collection_outdated` terjadi saat melakukan operasi ke Couchbase Cloud. Ini adalah masalah umum yang terjadi karena:

1. Metadata collection belum sepenuhnya tersinkronisasi setelah koneksi
2. Collection belum memiliki primary index
3. Latency jaringan ke Couchbase Cloud
4. Timeout default terlalu pendek untuk operasi cloud

## PENTING: NO FALLBACK POLICY

**Aplikasi ini TIDAK menggunakan in-memory fallback.** Semua data HARUS disimpan di Couchbase Cloud. Jika Couchbase tidak tersedia:
- Server TIDAK akan start
- Semua operasi akan throw error 503 (Service Unavailable)
- Tidak ada data yang disimpan di memory

Ini memastikan:
- Data consistency dan persistence
- Tidak ada data loss saat restart
- Production-ready architecture

## Solusi yang Diterapkan

### 1. Retry Logic dengan Exponential Backoff (Enhanced)
Menambahkan method `retryOperation()` di `service.ts` yang:
- Mencoba ulang operasi hingga 3 kali
- Menggunakan exponential backoff yang lebih panjang (200ms, 500ms, 1000ms)
- Menangani `UnambiguousTimeoutError` dan `AmbiguousTimeoutError`
- Memeriksa retry_reasons di `error.cause` dan `error.context`
- Memberikan error message yang lebih informatif

### 2. Timeout Configuration (Increased)
Menambahkan timeout eksplisit untuk semua operasi:
- KV operations: 10 detik
- Query operations: 30-75 detik
- Setiap operasi insert/get/replace/upsert menggunakan `timeout: 10000`

### 3. Collection Warmup dengan Primary Index
Menambahkan `warmupCollections()` di `database.ts` yang:
- Membuat primary index untuk setiap collection (penting untuk cloud)
- Melakukan upsert test document untuk memastikan collection writable
- Retry warmup hingga 3x per collection
- Menunggu 5 detik untuk propagasi metadata
- Cleanup test document setelah warmup

### 4. Strict Database Requirement
- Server TIDAK akan start jika Couchbase tidak terkoneksi
- Semua operasi memiliki check `if (!this.useCouchbase())` yang throw error 503
- Tidak ada in-memory fallback
- Clear error messages untuk troubleshooting

### 5. Enhanced Error Handling
- Semua operasi throw descriptive errors jika gagal
- Error logging yang detail untuk debugging
- HTTP 503 untuk database unavailable
- HTTP 500 untuk operation failures

## File yang Dimodifikasi

1. `BE/src/core/database.ts`
   - Menambahkan timeout configuration yang lebih panjang
   - Enhanced `warmupCollections()` dengan primary index creation
   - Retry logic untuk warmup operations
   - Upsert test untuk verify collection readiness

2. `BE/src/modules/hp-cam-session/service.ts`
   - Enhanced `retryOperation()` dengan delay yang lebih panjang
   - Menangani `UnambiguousTimeoutError`
   - Memeriksa `error.cause.retry_reasons`
   - Removed ALL in-memory fallback code
   - Added database availability checks di semua methods
   - Timeout 10 detik untuk semua operasi

3. `BE/src/index.ts`
   - Removed fallback logic di startServer()
   - Server akan exit(1) jika Couchbase gagal connect
   - Clear error messages untuk troubleshooting

## Root Cause
Masalah utama adalah:
1. Collection metadata belum siap saat aplikasi start
2. Tidak ada primary index, menyebabkan collection tidak queryable
3. Timeout terlalu pendek untuk cloud latency
4. Tidak ada retry mechanism untuk transient errors

## Testing
Setelah deploy:
1. Server HARUS berhasil connect ke Couchbase atau akan exit
2. Tunggu hingga warmup selesai (lihat log "✅ Collection warmup completed")
3. Create session - harus berhasil tanpa timeout
4. Get session status - harus bisa retrieve session
5. Join session - harus bisa pair dengan pairing code
6. Send signal - harus bisa kirim WebRTC signal

## Monitoring
Perhatikan log untuk:
- `✅ Primary index ensured for: [collection]` - index berhasil dibuat
- `✅ Collection ready: [name]` - collection siap digunakan
- `⚠️ [operation] failed (attempt X/3), retrying...` - retry sedang terjadi
- `❌ Collection metadata not ready after 3 attempts` - collection issue serius
- `💥 CRITICAL: Couchbase connection is REQUIRED` - server tidak bisa start

## Jika Server Tidak Start

Server akan exit dengan error jika Couchbase tidak tersedia. Check:

1. **Environment Variables:**
   ```bash
   COUCHBASE_CONNECTION_STRING=couchbases://...
   COUCHBASE_USERNAME=your_username
   COUCHBASE_PASSWORD=your_password
   COUCHBASE_BUCKET=your_bucket
   ```

2. **Network Connectivity:**
   ```bash
   ping svc-dqis-node-001.s0ukypm-djhcdpt.cloud.couchbase.com
   ```

3. **Couchbase Console:**
   - Verify bucket exists
   - Check user permissions
   - Ensure cluster is running

4. **Manual Index Creation (if needed):**
   ```sql
   CREATE PRIMARY INDEX ON `bucket_name`._default.hp_cam_sessions;
   CREATE PRIMARY INDEX ON `bucket_name`._default.hp_cam_signals;
   ```

## Jika Masih Error Setelah Start

Jika server berhasil start tapi operasi masih timeout:

1. **Increase timeout lebih lanjut:**
   ```typescript
   // Di database.ts, ubah timeout menjadi:
   kvTimeout: 20000, // 20 seconds
   ```

2. **Check Couchbase Performance:**
   - Monitor di Couchbase Console
   - Check for high latency
   - Verify cluster health

3. **Increase retry attempts:**
   ```typescript
   // Di service.ts, ubah maxRetries:
   await this.retryOperation(async () => {
     // operation
   }, 5, 'operation name'); // dari 3 ke 5
   ```

## Production Checklist

Sebelum deploy ke production:
- ✅ Couchbase credentials valid
- ✅ Network connectivity tested
- ✅ Primary indexes created
- ✅ Warmup completes successfully
- ✅ Test all CRUD operations
- ✅ Monitor logs for errors
- ✅ Setup alerts for database unavailability

## Referensi
- Couchbase SDK Timeout: https://docs.couchbase.com/nodejs-sdk/current/howtos/managing-connections.html
- Retry Strategies: https://docs.couchbase.com/nodejs-sdk/current/howtos/error-handling.html
- Primary Index: https://docs.couchbase.com/server/current/n1ql/n1ql-language-reference/createprimaryindex.html
