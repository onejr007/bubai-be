# HP Camera Session - Perbaikan Backend

## Masalah yang Diperbaiki

### 1. Couchbase Connection Timeout
**Error:**
```
Connection timeout
⚠️ Couchbase connection failed, continuing without database
```

**Solusi:**
- Menambahkan pengecekan kredensial sebelum mencoba koneksi
- Jika kredensial tidak dikonfigurasi, skip koneksi tanpa error
- Backend tetap berjalan meskipun Couchbase tidak tersedia

### 2. Session Management Tanpa Database
**Masalah:** FE membutuhkan session dari BE, tapi service bergantung pada Couchbase

**Solusi:** Implementasi **In-Memory Fallback Storage**

## Perubahan yang Dilakukan

### 1. Database Service (`BE/src/core/database.ts`)
- Menambahkan pengecekan kredensial sebelum koneksi
- Skip koneksi jika `COUCHBASE_CONNECTION_STRING` atau `COUCHBASE_USERNAME` kosong
- Tidak throw error jika kredensial tidak ada

### 2. In-Memory Store (`BE/src/modules/hp-cam-session/inMemoryStore.ts`)
**Fitur:**
- Menyimpan sessions dan signals di memory
- Auto-cleanup expired sessions/signals setiap 1 menit
- Index pairing code untuk pencarian cepat
- TTL otomatis (sessions: 5 menit, signals: 1 menit)

**API:**
```typescript
// Session operations
saveSession(session: HpCamSession): void
getSession(sessionId: string): HpCamSession | undefined
getSessionByPairingCode(pairingCode: string): HpCamSession | undefined
updateSession(sessionId: string, updates: Partial<HpCamSession>): HpCamSession | undefined
deleteSession(sessionId: string): void

// Signal operations
saveSignal(signal: WebRTCSignal): void
getSignals(sessionId: string, forDevice: 'mobile' | 'viewer', since?: Date): WebRTCSignal[]
markSignalDelivered(signalId: string): void

// Stats
getStats(): { sessions: number, signals: number, activeSessions: number }
```

### 3. Session Service (`BE/src/modules/hp-cam-session/service.ts`)
**Perubahan:**
- Menambahkan method `useCouchbase()` untuk deteksi storage
- Semua operasi sekarang support dual-mode:
  - Jika Couchbase tersedia → gunakan Couchbase
  - Jika tidak → gunakan in-memory store
- Menambahkan method `getStats()` untuk monitoring

**Methods yang diupdate:**
- `createSession()` - Support in-memory
- `joinSession()` - Support in-memory dengan pairing code lookup
- `getSessionStatus()` - Support in-memory
- `sendSignal()` - Support in-memory
- `getSignals()` - Support in-memory dengan auto-delivery marking
- `endSession()` - Support in-memory dengan auto-delete
- `cleanupExpiredSessions()` - Support in-memory (auto-handled)

### 4. Controller & Routes
**Endpoint baru:**
```
GET /api/v1/hp-cam-session/stats
```

Response:
```json
{
  "status": "success",
  "data": {
    "storage": "memory",  // atau "couchbase"
    "sessions": 5,
    "signals": 12,
    "activeSessions": 3
  }
}
```

## Cara Penggunaan

### Development (Tanpa Couchbase)
1. Tidak perlu konfigurasi Couchbase di `.env`
2. Backend akan otomatis menggunakan in-memory store
3. Session akan hilang saat restart server

### Production (Dengan Couchbase)
1. Konfigurasi kredensial Couchbase di `.env`:
```env
COUCHBASE_CONNECTION_STRING=couchbases://your-cluster.cloud.couchbase.com
COUCHBASE_USERNAME=your-username
COUCHBASE_PASSWORD=your-password
COUCHBASE_BUCKET=your-bucket
```
2. Backend akan otomatis menggunakan Couchbase
3. Session persistent dan scalable

## Testing

### 1. Cek Health & Storage Mode
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/v1/hp-cam-session/stats
```

### 2. Test Session Flow
```bash
# Create session (mobile)
curl -X POST http://localhost:3000/api/v1/hp-cam-session/create \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "mobile-123"}'

# Response: { "sessionId": "...", "pairingCode": "123456", ... }

# Join session (viewer)
curl -X POST http://localhost:3000/api/v1/hp-cam-session/join \
  -H "Content-Type: application/json" \
  -d '{"pairingCode": "123456", "deviceId": "viewer-456"}'

# Get status
curl http://localhost:3000/api/v1/hp-cam-session/{sessionId}/status
```

### 3. Test WebRTC Signaling
```bash
# Send signal
curl -X POST http://localhost:3000/api/v1/hp-cam-session/signal \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "...",
    "type": "offer",
    "from": "mobile",
    "data": {"sdp": "..."}
  }'

# Get signals
curl "http://localhost:3000/api/v1/hp-cam-session/signal/{sessionId}?forDevice=viewer"
```

## Keuntungan

1. **Zero Configuration** - Bisa langsung jalan tanpa setup database
2. **Automatic Fallback** - Otomatis switch ke in-memory jika Couchbase gagal
3. **Development Friendly** - Tidak perlu Couchbase untuk development
4. **Production Ready** - Tetap support Couchbase untuk production
5. **Transparent** - FE tidak perlu tahu storage yang digunakan
6. **Auto Cleanup** - Expired sessions/signals otomatis dibersihkan

## Limitasi In-Memory Mode

1. **Not Persistent** - Data hilang saat restart
2. **Single Instance** - Tidak bisa scale horizontal
3. **Memory Limited** - Terbatas RAM server
4. **No Backup** - Tidak ada backup/recovery

**Rekomendasi:** Gunakan Couchbase untuk production!

## Monitoring

Gunakan endpoint `/stats` untuk monitoring:
- Jumlah sessions aktif
- Jumlah signals pending
- Storage mode yang digunakan

## Deployment

### Railway/Render/Vercel (Tanpa Database)
Tidak perlu environment variables Couchbase, langsung deploy!

### Dengan Couchbase
Set environment variables:
```
COUCHBASE_CONNECTION_STRING=...
COUCHBASE_USERNAME=...
COUCHBASE_PASSWORD=...
COUCHBASE_BUCKET=...
```

## Troubleshooting

### Backend masih error koneksi?
- Pastikan tidak ada `COUCHBASE_CONNECTION_STRING` di `.env`
- Atau set ke empty string: `COUCHBASE_CONNECTION_STRING=`

### Session tidak persistent?
- Normal untuk in-memory mode
- Gunakan Couchbase untuk persistence

### Stats menunjukkan storage: "memory"?
- Backend menggunakan in-memory store
- Konfigurasi Couchbase jika ingin persistent storage
