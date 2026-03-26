# Perbaikan Couchbase Timeout Error

## Masalah
Error `AmbiguousTimeoutError` dengan retry reason `key_value_collection_outdated` terjadi saat melakukan operasi ke Couchbase Cloud. Ini adalah masalah umum yang terjadi karena:

1. Metadata collection belum sepenuhnya tersinkronisasi setelah koneksi
2. Latency jaringan ke Couchbase Cloud
3. Timeout default terlalu pendek untuk operasi cloud

## Solusi yang Diterapkan

### 1. Retry Logic dengan Exponential Backoff
Menambahkan method `retryOperation()` di `service.ts` yang:
- Mencoba ulang operasi hingga 3 kali
- Menggunakan exponential backoff (100ms, 200ms, 400ms)
- Hanya retry untuk error yang bersifat transient (timeout, collection_outdated)

### 2. Timeout Configuration
Menambahkan timeout eksplisit untuk semua operasi:
- KV operations: 10 detik
- Query operations: 75 detik
- Setiap operasi insert/get/replace menggunakan `timeout: 10000`

### 3. Collection Warmup
Menambahkan `warmupCollections()` di `database.ts` yang:
- Mengakses collection setelah koneksi untuk memuat metadata
- Mencoba operasi dummy untuk memastikan collection siap
- Menunggu 1 detik untuk propagasi metadata

### 4. Graceful Fallback
Jika Couchbase gagal, sistem otomatis fallback ke in-memory store:
- Session tetap bisa dibuat
- Aplikasi tidak crash
- Log warning untuk monitoring

## File yang Dimodifikasi

1. `BE/src/core/database.ts`
   - Menambahkan timeout configuration
   - Menambahkan `warmupCollections()` method

2. `BE/src/modules/hp-cam-session/service.ts`
   - Menambahkan `retryOperation()` method
   - Menambahkan timeout ke semua operasi Couchbase
   - Menambahkan retry logic ke semua operasi critical

## Testing
Setelah deploy, test dengan:
1. Create session - harus berhasil tanpa timeout
2. Join session - harus bisa pair dengan pairing code
3. Send signal - harus bisa kirim WebRTC signal
4. Get signals - harus bisa retrieve signals

## Monitoring
Perhatikan log untuk:
- `⚠️ [operation] failed (attempt X/3), retrying...` - menunjukkan retry sedang terjadi
- `⚠️ Couchbase insert failed, using in-memory` - menunjukkan fallback ke memory
- `✅ Collection warmed up: [name]` - menunjukkan warmup berhasil

## Referensi
- Couchbase SDK Timeout: https://docs.couchbase.com/nodejs-sdk/current/howtos/managing-connections.html
- Retry Strategies: https://docs.couchbase.com/nodejs-sdk/current/howtos/error-handling.html
