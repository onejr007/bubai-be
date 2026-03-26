# HP Camera Session Module

Module untuk mengelola session temporary HP Camera dengan Couchbase Cloud.

## 📋 Features

- ✅ Create session dengan pairing code
- ✅ Join session dengan pairing code
- ✅ WebRTC signaling (offer, answer, ICE candidates)
- ✅ Auto-expire sessions (5 minutes TTL)
- ✅ Auto-expire signals (1 minute TTL)
- ✅ Session status tracking
- ✅ Real-time signal delivery

## 🗄️ Database

- **Collection:** `hp_cam_sessions` (sessions)
- **Collection:** `hp_cam_signals` (WebRTC signals)
- **TTL:** 300 seconds (5 minutes) for sessions
- **TTL:** 60 seconds (1 minute) for signals
- **Scope:** `_default`
- **Bucket:** Configured in `.env`

## 📝 Data Structure

### Session Document
```typescript
{
  sessionId: string;        // UUID
  pairingCode: string;      // 6-digit code
  deviceId: string;         // Mobile device ID
  status: 'waiting' | 'paired' | 'active' | 'ended';
  hasViewer: boolean;
  viewerDeviceId?: string;
  createdAt: string;        // ISO timestamp
  pairedAt?: string;        // ISO timestamp
  expiresAt: string;        // ISO timestamp
  lastActivity: string;     // ISO timestamp
}
```

### Signal Document
```typescript
{
  id: string;               // UUID
  sessionId: string;
  type: 'offer' | 'answer' | 'ice-candidate';
  from: 'mobile' | 'viewer';
  to: 'mobile' | 'viewer';
  data: any;                // WebRTC data
  timestamp: string;        // ISO timestamp
  delivered: boolean;
}
```

## 🔗 Endpoints

### Create Session
```bash
POST /api/v1/hp-cam-session/create
Content-Type: application/json

{
  "deviceId": "mobile-device-123"
}

Response:
{
  "status": "success",
  "data": {
    "sessionId": "uuid",
    "pairingCode": "123456",
    "expiresAt": "2026-03-26T..."
  }
}
```

### Join Session
```bash
POST /api/v1/hp-cam-session/join
Content-Type: application/json

{
  "pairingCode": "123456",
  "deviceId": "viewer-device-456"
}

Response:
{
  "status": "success",
  "data": {
    "sessionId": "uuid",
    "status": "paired",
    "pairedAt": "2026-03-26T..."
  }
}
```

### Get Session Status
```bash
GET /api/v1/hp-cam-session/{sessionId}/status

Response:
{
  "status": "success",
  "data": {
    "sessionId": "uuid",
    "status": "paired",
    "hasViewer": true,
    "createdAt": "2026-03-26T...",
    "pairedAt": "2026-03-26T..."
  }
}
```

### Send Signal
```bash
POST /api/v1/hp-cam-session/signal
Content-Type: application/json

{
  "sessionId": "uuid",
  "type": "offer",
  "from": "mobile",
  "data": { ... }
}

Response:
{
  "status": "success",
  "data": {
    "message": "Signal sent"
  }
}
```

### Get Signals
```bash
GET /api/v1/hp-cam-session/signal/{sessionId}?forDevice=viewer&since=2026-03-26T...

Response:
{
  "status": "success",
  "data": {
    "signals": [
      {
        "id": "uuid",
        "type": "offer",
        "from": "mobile",
        "data": { ... },
        "timestamp": "2026-03-26T..."
      }
    ]
  }
}
```

### End Session
```bash
POST /api/v1/hp-cam-session/end
Content-Type: application/json

{
  "sessionId": "uuid"
}

Response:
{
  "status": "success",
  "data": {
    "message": "Session ended"
  }
}
```

## 🔄 Session Flow

1. **Mobile creates session:**
   - POST `/create` with deviceId
   - Get sessionId and pairingCode
   - Display QR code with sessionId

2. **Viewer scans QR:**
   - Extract sessionId from QR
   - POST `/join` with pairingCode
   - Session status changes to 'paired'

3. **WebRTC Signaling:**
   - Mobile sends offer: POST `/signal`
   - Viewer polls: GET `/signal/{sessionId}?forDevice=viewer`
   - Viewer sends answer: POST `/signal`
   - Mobile polls: GET `/signal/{sessionId}?forDevice=mobile`
   - Exchange ICE candidates

4. **Session ends:**
   - POST `/end` with sessionId
   - Or auto-expires after 5 minutes

## ⏱️ TTL (Time To Live)

### Sessions
- **TTL:** 300 seconds (5 minutes)
- **Auto-delete:** Yes, by Couchbase
- **Refresh:** On every status check or signal

### Signals
- **TTL:** 60 seconds (1 minute)
- **Auto-delete:** Yes, by Couchbase
- **Delivered:** Marked after retrieval

## 🧪 Testing

```bash
# Create session
curl -X POST http://localhost:3000/api/v1/hp-cam-session/create \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"mobile-123"}'

# Join session
curl -X POST http://localhost:3000/api/v1/hp-cam-session/join \
  -H "Content-Type: application/json" \
  -d '{"pairingCode":"123456","deviceId":"viewer-456"}'

# Get status
curl http://localhost:3000/api/v1/hp-cam-session/{sessionId}/status

# Send signal
curl -X POST http://localhost:3000/api/v1/hp-cam-session/signal \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"uuid","type":"offer","from":"mobile","data":{}}'

# Get signals
curl "http://localhost:3000/api/v1/hp-cam-session/signal/{sessionId}?forDevice=viewer"

# End session
curl -X POST http://localhost:3000/api/v1/hp-cam-session/end \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"uuid"}'
```

## 💡 Implementation Notes

- Sessions auto-expire after 5 minutes (no cleanup needed)
- Signals auto-expire after 1 minute (no cleanup needed)
- Pairing codes are 6-digit random numbers
- WebRTC signaling uses polling (1 second interval recommended)
- All timestamps in ISO 8601 format
- Session status updated on every activity

## 🔒 Security

- Pairing codes are random 6-digit numbers
- Sessions expire automatically
- Signals are deleted after delivery
- No persistent storage of video data
- End-to-end WebRTC encryption

## 📊 Couchbase Indexes (Recommended)

```sql
-- Index for pairing code lookup
CREATE INDEX idx_pairing_code 
ON `ai-collaborative`._default.hp_cam_sessions(pairingCode) 
WHERE status = 'waiting';

-- Index for session signals
CREATE INDEX idx_session_signals 
ON `ai-collaborative`._default.hp_cam_signals(sessionId, to, delivered, timestamp);
```

---

**Module ready for HP Camera WebRTC signaling!** 🎥
