# Perbaikan Couchbase Timeout Error

## Masalah
Error `UnambiguousTimeoutError` dan `AmbiguousTimeoutError` dengan retry reason `key_value_collection_outdated` terjadi saat melakukan operasi ke Couchbase Cloud. Ini adalah masalah umum yang terjadi karena:

1. Metadata collection belum sepenuhnya tersinkronisasi setelah koneksi
2. Collection belum memiliki primary index
3. Latency jaringan ke Couchbase Cloud
4. Timeout default terlalu pendek untuk operasi cloud

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

### 4. Graceful Fallback (Multi-Level)
Sistem memiliki fallback berlapis:
- Level 1: Retry dengan exponential backoff
- Level 2: Fallback ke in-memory store jika Couchbase gagal
- Level 3: Session tetap bisa dibuat dan aplikasi tidak crash
- Log warning untuk monitoring

### 5. Enhanced Error Handling
- `getSessionStatus()` sekarang memiliki try-catch untuk fallback ke in-memory
- Semua operasi critical memiliki retry logic
- Error logging yang lebih detail untuk debugging

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
   - Fallback ke in-memory di `getSessionStatus()`
   - Timeout 10 detik untuk semua operasi

## Root Cause
Masalah utama adalah:
1. Collection metadata belum siap saat aplikasi start
2. Tidak ada primary index, menyebabkan collection tidak queryable
3. Timeout terlalu pendek untuk cloud latency
4. Tidak ada retry mechanism untuk transient errors

## Testing
Setelah deploy, test dengan:
1. Tunggu hingga warmup selesai (lihat log "✅ Collection warmup completed")
2. Create session - harus berhasil tanpa timeout
3. Get session status - harus bisa retrieve session
4. Join session - harus bisa pair dengan pairing code
5. Send signal - harus bisa kirim WebRTC signal

## Monitoring
Perhatikan log untuk:
- `✅ Primary index ensured for: [collection]` - index berhasil dibuat
- `✅ Collection ready: [name]` - collection siap digunakan
- `⚠️ [operation] failed (attempt X/3), retrying...` - retry sedang terjadi
- `⚠️ Couchbase [operation] failed, using in-memory` - fallback ke memory
- `❌ Collection metadata not ready after 3 attempts` - collection issue serius

## Jika Masih Error
Jika masih terjadi timeout setelah perbaikan ini:

1. Periksa Couchbase Console:
   - Pastikan bucket exists dan accessible
   - Periksa apakah ada primary index di collections
   - Cek network connectivity dari server ke Couchbase Cloud

2. Increase timeout lebih lanjut:
   ```typescript
   // Di database.ts, ubah timeout menjadi:
   kvTimeout: 20000, // 20 seconds
   ```

3. Manual create primary index via Couchbase Console:
   ```sql
   CREATE PRIMARY INDEX ON `bucket_name`._default.hp_cam_sessions;
   CREATE PRIMARY INDEX ON `bucket_name`._default.hp_cam_signals;
   ```

4. Gunakan in-memory mode sementara:
   - Comment out Couchbase connection di `.env`
   - Sistem akan otomatis fallback ke in-memory

## Referensi
- Couchbase SDK Timeout: https://docs.couchbase.com/nodejs-sdk/current/howtos/managing-connections.html
- Retry Strategies: https://docs.couchbase.com/nodejs-sdk/current/howtos/error-handling.html
- Primary Index: https://docs.couchbase.com/server/current/n1ql/n1ql-language-reference/createprimaryindex.html
