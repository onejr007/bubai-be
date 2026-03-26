# HP Camera Session - Test Commands

## Quick Start

```bash
# Start backend
cd BE
npm run dev
```

## Health Check

```bash
# Check API health
curl http://localhost:3000/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2026-03-26T...",
#   "database": "disconnected"  # or "connected" if Couchbase available
# }
```

## Storage Stats

```bash
# Check storage mode and statistics
curl http://localhost:3000/api/v1/hp-cam-session/stats

# Expected response (in-memory mode):
# {
#   "status": "success",
#   "data": {
#     "storage": "memory",
#     "sessions": 0,
#     "signals": 0,
#     "activeSessions": 0
#   }
# }
```

## Session Flow Test

### 1. Create Session (Mobile Device)

```bash
curl -X POST http://localhost:3000/api/v1/hp-cam-session/create \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "mobile-device-123"}'

# Expected response:
# {
#   "status": "success",
#   "data": {
#     "sessionId": "550e8400-e29b-41d4-a716-446655440000",
#     "pairingCode": "123456",
#     "expiresAt": "2026-03-26T14:00:00.000Z"
#   }
# }
```

**Save the sessionId and pairingCode for next steps!**

### 2. Get Session Status

```bash
# Replace {sessionId} with actual sessionId from step 1
curl http://localhost:3000/api/v1/hp-cam-session/{sessionId}/status

# Expected response:
# {
#   "status": "success",
#   "data": {
#     "sessionId": "550e8400-e29b-41d4-a716-446655440000",
#     "status": "waiting",
#     "hasViewer": false,
#     "createdAt": "2026-03-26T13:55:00.000Z"
#   }
# }
```

### 3. Join Session (Viewer)

```bash
# Replace {pairingCode} with actual code from step 1
curl -X POST http://localhost:3000/api/v1/hp-cam-session/join \
  -H "Content-Type: application/json" \
  -d '{"pairingCode": "123456", "deviceId": "viewer-device-456"}'

# Expected response:
# {
#   "status": "success",
#   "data": {
#     "sessionId": "550e8400-e29b-41d4-a716-446655440000",
#     "status": "paired",
#     "pairedAt": "2026-03-26T13:56:00.000Z"
#   }
# }
```

### 4. Check Status Again

```bash
curl http://localhost:3000/api/v1/hp-cam-session/{sessionId}/status

# Expected response:
# {
#   "status": "success",
#   "data": {
#     "sessionId": "550e8400-e29b-41d4-a716-446655440000",
#     "status": "paired",
#     "hasViewer": true,
#     "createdAt": "2026-03-26T13:55:00.000Z",
#     "pairedAt": "2026-03-26T13:56:00.000Z"
#   }
# }
```

## WebRTC Signaling Test

### 5. Send Signal (Mobile → Viewer)

```bash
curl -X POST http://localhost:3000/api/v1/hp-cam-session/signal \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "type": "offer",
    "from": "mobile",
    "data": {
      "sdp": "v=0\r\no=- 123456 2 IN IP4 127.0.0.1\r\n...",
      "type": "offer"
    }
  }'

# Expected response:
# {
#   "status": "success",
#   "data": {
#     "message": "Signal sent"
#   }
# }
```

### 6. Get Signals (Viewer)

```bash
curl "http://localhost:3000/api/v1/hp-cam-session/signal/{sessionId}?forDevice=viewer"

# Expected response:
# {
#   "status": "success",
#   "data": {
#     "signals": [
#       {
#         "id": "signal-uuid",
#         "sessionId": "550e8400-e29b-41d4-a716-446655440000",
#         "type": "offer",
#         "from": "mobile",
#         "to": "viewer",
#         "data": {
#           "sdp": "v=0\r\no=- 123456 2 IN IP4 127.0.0.1\r\n...",
#           "type": "offer"
#         },
#         "timestamp": "2026-03-26T13:57:00.000Z",
#         "delivered": false
#       }
#     ]
#   }
# }
```

### 7. Send Answer (Viewer → Mobile)

```bash
curl -X POST http://localhost:3000/api/v1/hp-cam-session/signal \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "type": "answer",
    "from": "viewer",
    "data": {
      "sdp": "v=0\r\no=- 789012 2 IN IP4 127.0.0.1\r\n...",
      "type": "answer"
    }
  }'
```

### 8. Get Signals (Mobile)

```bash
curl "http://localhost:3000/api/v1/hp-cam-session/signal/{sessionId}?forDevice=mobile"

# Expected response:
# {
#   "status": "success",
#   "data": {
#     "signals": [
#       {
#         "id": "signal-uuid-2",
#         "sessionId": "550e8400-e29b-41d4-a716-446655440000",
#         "type": "answer",
#         "from": "viewer",
#         "to": "mobile",
#         "data": {
#           "sdp": "v=0\r\no=- 789012 2 IN IP4 127.0.0.1\r\n...",
#           "type": "answer"
#         },
#         "timestamp": "2026-03-26T13:58:00.000Z",
#         "delivered": false
#       }
#     ]
#   }
# }
```

### 9. Send ICE Candidate

```bash
curl -X POST http://localhost:3000/api/v1/hp-cam-session/signal \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "type": "ice-candidate",
    "from": "mobile",
    "data": {
      "candidate": "candidate:1 1 UDP 2130706431 192.168.1.100 54321 typ host",
      "sdpMLineIndex": 0,
      "sdpMid": "0"
    }
  }'
```

## End Session

### 10. End Session

```bash
curl -X POST http://localhost:3000/api/v1/hp-cam-session/end \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "550e8400-e29b-41d4-a716-446655440000"}'

# Expected response:
# {
#   "status": "success",
#   "data": {
#     "message": "Session ended"
#   }
# }
```

## Error Cases

### Invalid Pairing Code

```bash
curl -X POST http://localhost:3000/api/v1/hp-cam-session/join \
  -H "Content-Type: application/json" \
  -d '{"pairingCode": "999999", "deviceId": "viewer-device-456"}'

# Expected response:
# {
#   "status": "error",
#   "message": "Invalid pairing code or session expired"
# }
```

### Session Not Found

```bash
curl http://localhost:3000/api/v1/hp-cam-session/invalid-session-id/status

# Expected response:
# {
#   "status": "error",
#   "message": "Session not found or expired"
# }
```

## Automated Test Script

Save as `test-session.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000/api/v1/hp-cam-session"

echo "1. Creating session..."
CREATE_RESPONSE=$(curl -s -X POST $BASE_URL/create \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "mobile-test"}')

SESSION_ID=$(echo $CREATE_RESPONSE | jq -r '.data.sessionId')
PAIRING_CODE=$(echo $CREATE_RESPONSE | jq -r '.data.pairingCode')

echo "Session ID: $SESSION_ID"
echo "Pairing Code: $PAIRING_CODE"

echo -e "\n2. Checking status..."
curl -s $BASE_URL/$SESSION_ID/status | jq

echo -e "\n3. Joining session..."
curl -s -X POST $BASE_URL/join \
  -H "Content-Type: application/json" \
  -d "{\"pairingCode\": \"$PAIRING_CODE\", \"deviceId\": \"viewer-test\"}" | jq

echo -e "\n4. Checking status after join..."
curl -s $BASE_URL/$SESSION_ID/status | jq

echo -e "\n5. Sending signal..."
curl -s -X POST $BASE_URL/signal \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID\", \"type\": \"offer\", \"from\": \"mobile\", \"data\": {\"test\": \"data\"}}" | jq

echo -e "\n6. Getting signals..."
curl -s "$BASE_URL/signal/$SESSION_ID?forDevice=viewer" | jq

echo -e "\n7. Ending session..."
curl -s -X POST $BASE_URL/end \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID\"}" | jq

echo -e "\n8. Checking stats..."
curl -s $BASE_URL/stats | jq
```

Run with:
```bash
chmod +x test-session.sh
./test-session.sh
```

## PowerShell Test Script (Windows)

Save as `test-session.ps1`:

```powershell
$BaseUrl = "http://localhost:3000/api/v1/hp-cam-session"

Write-Host "1. Creating session..." -ForegroundColor Green
$createResponse = Invoke-RestMethod -Uri "$BaseUrl/create" -Method Post -ContentType "application/json" -Body '{"deviceId": "mobile-test"}'
$sessionId = $createResponse.data.sessionId
$pairingCode = $createResponse.data.pairingCode

Write-Host "Session ID: $sessionId"
Write-Host "Pairing Code: $pairingCode"

Write-Host "`n2. Checking status..." -ForegroundColor Green
Invoke-RestMethod -Uri "$BaseUrl/$sessionId/status" | ConvertTo-Json

Write-Host "`n3. Joining session..." -ForegroundColor Green
$joinBody = @{
    pairingCode = $pairingCode
    deviceId = "viewer-test"
} | ConvertTo-Json
Invoke-RestMethod -Uri "$BaseUrl/join" -Method Post -ContentType "application/json" -Body $joinBody | ConvertTo-Json

Write-Host "`n4. Checking status after join..." -ForegroundColor Green
Invoke-RestMethod -Uri "$BaseUrl/$sessionId/status" | ConvertTo-Json

Write-Host "`n5. Sending signal..." -ForegroundColor Green
$signalBody = @{
    sessionId = $sessionId
    type = "offer"
    from = "mobile"
    data = @{ test = "data" }
} | ConvertTo-Json
Invoke-RestMethod -Uri "$BaseUrl/signal" -Method Post -ContentType "application/json" -Body $signalBody | ConvertTo-Json

Write-Host "`n6. Getting signals..." -ForegroundColor Green
Invoke-RestMethod -Uri "$BaseUrl/signal/$sessionId?forDevice=viewer" | ConvertTo-Json

Write-Host "`n7. Ending session..." -ForegroundColor Green
$endBody = @{ sessionId = $sessionId } | ConvertTo-Json
Invoke-RestMethod -Uri "$BaseUrl/end" -Method Post -ContentType "application/json" -Body $endBody | ConvertTo-Json

Write-Host "`n8. Checking stats..." -ForegroundColor Green
Invoke-RestMethod -Uri "$BaseUrl/stats" | ConvertTo-Json
```

Run with:
```powershell
.\test-session.ps1
```

## Swagger UI

Open browser:
```
http://localhost:3000/api-docs
```

Test all endpoints interactively!
