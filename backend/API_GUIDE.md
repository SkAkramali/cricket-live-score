# Cricket Live Score - API Guide

## 🎯 Complete API Reference with Examples

This guide provides detailed information about all API endpoints with request/response examples.

## 📑 Table of Contents

1. [Authentication APIs](#authentication-apis)
2. [Match Management APIs](#match-management-apis)
3. [Live Scoring APIs](#live-scoring-apis)
4. [Analytics APIs](#analytics-apis)
5. [Team & Player APIs](#team--player-apis)
6. [WebSocket Events](#websocket-events)
7. [Error Codes](#error-codes)

---

## 🔐 Authentication APIs

### 1. Register User (Signup)

**Endpoint**: `POST /api/auth/signup`

**Description**: Create a new user account

**Request Body**:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "secure123",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "role": "scorer"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "user_id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "full_name": "John Doe",
      "role": "scorer"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Login

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "secure123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "user_id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "full_name": "John Doe",
      "role": "scorer"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Refresh Token

**Endpoint**: `POST /api/auth/refresh-token`

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 4. Get Current User

**Endpoint**: `GET /api/auth/me`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "full_name": "John Doe",
      "phone": "+1234567890",
      "role": "scorer",
      "created_at": "2026-03-06T10:00:00.000Z"
    }
  }
}
```

### 5. Update Profile

**Endpoint**: `PUT /api/auth/profile`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body**:
```json
{
  "full_name": "John Smith",
  "phone": "+9876543210"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

### 6. Change Password

**Endpoint**: `PUT /api/auth/change-password`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body**:
```json
{
  "currentPassword": "secure123",
  "newPassword": "newsecure456"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## 🏏 Match Management APIs

### 1. Create Match

**Endpoint**: `POST /api/matches`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body**:
```json
{
  "team1_id": 1,
  "team2_id": 2,
  "match_date": "2026-03-15T14:00:00",
  "venue": "Local Cricket Ground",
  "overs_per_side": 20,
  "match_type": "t20"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Match created successfully",
  "data": {
    "match_id": 1,
    "match_code": "A3E7K9"
  }
}
```

### 2. Get All Matches

**Endpoint**: `GET /api/matches?status=live`

**Query Parameters**:
- `status` (optional): Filter by status (scheduled, live, completed, cancelled)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "match_id": 1,
        "match_code": "A3E7K9",
        "team1_name": "Warriors",
        "team2_name": "Titans",
        "match_date": "2026-03-15T14:00:00.000Z",
        "venue": "Local Cricket Ground",
        "status": "live",
        "overs_per_side": 20
      }
    ],
    "count": 1
  }
}
```

### 3. Join Match by Code

**Endpoint**: `GET /api/matches/code/:matchCode`

**Example**: `GET /api/matches/code/A3E7K9`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "match": {
      "match_id": 1,
      "match_code": "A3E7K9",
      "team1_name": "Warriors",
      "team2_name": "Titans",
      "status": "live",
      "venue": "Local Cricket Ground"
    },
    "innings": [
      {
        "innings_id": 1,
        "innings_number": 1,
        "batting_team_name": "Warriors",
        "bowling_team_name": "Titans",
        "total_runs": 85,
        "total_wickets": 3,
        "total_overs": 12.4
      }
    ]
  }
}
```

### 4. Get Live Match Summary

**Endpoint**: `GET /api/matches/:match_id/summary`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "match": {
      "match_id": 1,
      "match_code": "A3E7K9",
      "team1_name": "Warriors",
      "team2_name": "Titans",
      "status": "live"
    },
    "current_innings": {
      "innings_id": 1,
      "total_runs": 85,
      "total_wickets": 3,
      "total_overs": 12.4,
      "batting_team_name": "Warriors"
    },
    "current_batsmen": [
      {
        "player_id": 5,
        "player_name": "Virat Kumar",
        "runs_scored": 42,
        "balls_faced": 28,
        "fours": 5,
        "sixes": 2,
        "strike_rate": 150.00
      },
      {
        "player_id": 8,
        "player_name": "Rohit Sharma",
        "runs_scored": 15,
        "balls_faced": 12,
        "strike_rate": 125.00
      }
    ],
    "current_bowler": {
      "player_id": 15,
      "player_name": "Jasprit Singh",
      "overs_bowled": 3.4,
      "runs_conceded": 28,
      "wickets_taken": 2,
      "economy_rate": 7.64
    },
    "recent_balls": [
      { "runs_scored": 4, "extras": 0, "commentary": "Four!" },
      { "runs_scored": 1, "extras": 0, "commentary": "Single" },
      { "runs_scored": 0, "extras": 1, "extra_type": "wide" }
    ]
  }
}
```

### 5. Start Match (Toss)

**Endpoint**: `POST /api/matches/:match_id/start`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body**:
```json
{
  "toss_winner_team_id": 1,
  "toss_decision": "bat"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Match started successfully"
}
```

---

## 📊 Live Scoring APIs

**Note**: All scoring APIs require scorer or admin role.

### 1. Record a Ball

**Endpoint**: `POST /api/scoring/ball`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body** (Example: Four runs):
```json
{
  "match_id": 1,
  "innings_id": 1,
  "batsman_id": 5,
  "bowler_id": 15,
  "non_striker_id": 8,
  "runs_scored": 4,
  "extras": 0,
  "extra_type": "none",
  "is_wicket": false,
  "commentary": "Beautiful cover drive for FOUR!"
}
```

**Request Body** (Example: Wicket):
```json
{
  "match_id": 1,
  "innings_id": 1,
  "batsman_id": 5,
  "bowler_id": 15,
  "non_striker_id": 8,
  "runs_scored": 0,
  "extras": 0,
  "extra_type": "none",
  "is_wicket": true,
  "wicket_type": "caught",
  "dismissed_player_id": 5,
  "fielder_id": 20,
  "commentary": "OUT! Caught at mid-off!"
}
```

**Request Body** (Example: Wide):
```json
{
  "match_id": 1,
  "innings_id": 1,
  "batsman_id": 5,
  "bowler_id": 15,
  "non_striker_id": 8,
  "runs_scored": 0,
  "extras": 1,
  "extra_type": "wide",
  "is_wicket": false,
  "commentary": "Wide down the leg side"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Ball recorded successfully",
  "data": {
    "ball_id": 125,
    "runs_scored": 4,
    "total_runs": 89,
    "total_wickets": 3,
    "total_overs": 12.5
  }
}
```

### 2. Start Innings

**Endpoint**: `POST /api/scoring/innings/:innings_id/start`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body**:
```json
{
  "batsman1_id": 5,
  "batsman2_id": 8,
  "bowler_id": 15
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Innings started successfully"
}
```

### 3. Change Batsman

**Endpoint**: `POST /api/scoring/innings/:innings_id/batsman/change`

**Request Body**:
```json
{
  "out_batsman_id": 5,
  "new_batsman_id": 12
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Batsman changed successfully"
}
```

### 4. Change Bowler

**Endpoint**: `POST /api/scoring/innings/:innings_id/bowler/change`

**Request Body**:
```json
{
  "old_bowler_id": 15,
  "new_bowler_id": 18
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Bowler changed successfully"
}
```

### 5. End Innings

**Endpoint**: `POST /api/scoring/innings/:innings_id/end`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Innings ended successfully"
}
```

---

## 📈 Analytics APIs

### 1. Get Match Scorecard

**Endpoint**: `GET /api/analytics/match/:match_id/scorecard`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "match": {
      "match_id": 1,
      "match_code": "A3E7K9",
      "team1_name": "Warriors",
      "team2_name": "Titans",
      "status": "completed",
      "result_text": "Warriors won by 15 runs"
    },
    "innings": [
      {
        "innings": {
          "innings_number": 1,
          "batting_team_name": "Warriors",
          "total_runs": 165,
          "total_wickets": 7,
          "total_overs": 20.0
        },
        "batting": [
          {
            "player_name": "Virat Kumar",
            "runs_scored": 65,
            "balls_faced": 42,
            "fours": 7,
            "sixes": 2,
            "strike_rate": 154.76,
            "dismissal_type": "caught"
          }
        ],
        "bowling": [
          {
            "player_name": "Jasprit Singh",
            "overs_bowled": 4.0,
            "runs_conceded": 28,
            "wickets_taken": 3,
            "economy_rate": 7.00
          }
        ]
      }
    ]
  }
}
```

### 2. Get Player Career Statistics

**Endpoint**: `GET /api/analytics/player/:player_id/career`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "player": {
      "player_id": 5,
      "player_name": "Virat Kumar",
      "team_name": "Warriors",
      "role": "batsman"
    },
    "batting": {
      "matches_played": 25,
      "total_runs": 1250,
      "average_runs": 50.00,
      "highest_score": 95,
      "fifties": 8,
      "hundreds": 2,
      "strike_rate": 145.50,
      "total_fours": 120,
      "total_sixes": 45
    },
    "bowling": {
      "matches_bowled": 5,
      "total_wickets": 8,
      "bowling_average": 24.50,
      "economy_rate": 7.80
    }
  }
}
```

### 3. Get Top Batsmen

**Endpoint**: `GET /api/analytics/match/:match_id/top-batsmen?limit=3`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "batsmen": [
      {
        "player_name": "Virat Kumar",
        "runs_scored": 65,
        "balls_faced": 42,
        "strike_rate": 154.76
      },
      {
        "player_name": "Rohit Sharma",
        "runs_scored": 48,
        "balls_faced": 35,
        "strike_rate": 137.14
      }
    ]
  }
}
```

### 4. Get Top Bowlers

**Endpoint**: `GET /api/analytics/match/:match_id/top-bowlers?limit=3`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "bowlers": [
      {
        "player_name": "Jasprit Singh",
        "wickets_taken": 3,
        "runs_conceded": 28,
        "overs_bowled": 4.0,
        "economy_rate": 7.00
      }
    ]
  }
}
```

### 5. Get Match Analytics

**Endpoint**: `GET /api/analytics/match/:match_id/analytics`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "run_rates": [
      {
        "innings_number": 1,
        "total_runs": 165,
        "total_overs": 20.0,
        "run_rate": 8.25
      }
    ],
    "highest_partnership": {
      "batsman1_name": "Virat Kumar",
      "batsman2_name": "Rohit Sharma",
      "runs": 85,
      "balls": 58
    },
    "boundaries": {
      "total_fours": 15,
      "total_sixes": 8,
      "total_boundaries": 23
    },
    "extras": {
      "total_extras": 12,
      "total_wides": 7,
      "total_noballs": 3
    }
  }
}
```

### 6. Get Partnerships

**Endpoint**: `GET /api/analytics/innings/:innings_id/partnerships`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "partnerships": [
      {
        "batsman1_name": "Virat Kumar",
        "batsman2_name": "Rohit Sharma",
        "runs": 85,
        "balls": 58,
        "wicket_number": 2
      }
    ]
  }
}
```

### 7. Get Ball-by-Ball Commentary

**Endpoint**: `GET /api/analytics/innings/:innings_id/commentary?limit=20&offset=0`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "balls": [
      {
        "ball_id": 125,
        "over_number": 12,
        "ball_number": 5,
        "batsman_name": "Virat Kumar",
        "bowler_name": "Jasprit Singh",
        "runs_scored": 4,
        "extras": 0,
        "is_wicket": false,
        "commentary": "Beautiful cover drive for FOUR!",
        "timestamp": "2026-03-15T15:30:22.000Z"
      }
    ],
    "total": 125,
    "limit": 20,
    "offset": 0
  }
}
```

---

## 👥 Team & Player APIs

*(See existing team and player routes for full details)*

---

## 🔌 WebSocket Events

### Connect to Server

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token' // optional for anonymous viewing
  }
});
```

### Client → Server Events

#### 1. Join Match
```javascript
socket.emit('join-match', 'A3E7K9');
```

#### 2. Leave Match
```javascript
socket.emit('leave-match', 'A3E7K9');
```

#### 3. Get Viewers Count
```javascript
socket.emit('get-viewers-count', 'A3E7K9');
```

### Server → Client Events

#### 1. Ball Update
```javascript
socket.on('ball-update', (data) => {
  console.log('Ball update:', data);
  // data: { runs_scored, extras, is_wicket, total_runs, total_wickets, ... }
});
```

#### 2. Wicket Fallen
```javascript
socket.on('wicket-fallen', (data) => {
  console.log('Wicket!', data);
  // data: { player_name, dismissal_type, ... }
});
```

#### 3. Over Complete
```javascript
socket.on('over-complete', (data) => {
  console.log( 'Over complete:', data);
  // data: { over_number, runs_in_over, ... }
});
```

#### 4. Innings Changed
```javascript
socket.on('innings-changed', (data) => {
  console.log('Innings changed:', data);
  // data: { innings_number, batting_team, ... }
});
```

#### 5. Match Status Updated
```javascript
socket.on('match-status-updated', (data) => {
  console.log('Match status:', data);
  // data: { status, winner, result_text, ... }
});
```

#### 6. Viewers Count
```javascript
socket.on('viewers-count', (data) => {
  console.log('Viewers:', data.count);
  // data: { matchCode, count }
});
```

---

## ⚠️ Error Codes

### Common Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required",
      "value": "invalid-email"
    }
  ]
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Required role: scorer or admin"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Match not found with this code"
}
```

#### 409 Conflict
```json
{
  "success": false,
  "message": "User with this email or username already exists"
}
```

#### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## 🧪 Testing with cURL

### 1. Register User
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"test_user","email":"test@example.com","password":"test123","role":"scorer"}'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### 3. Create Match (with JWT)
```bash
curl -X POST http://localhost:5000/api/matches \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"team1_id":1,"team2_id":2,"match_date":"2026-03-15T14:00:00","venue":"Test Ground","overs_per_side":20,"match_type":"t20"}'
```

### 4. Get Live Summary
```bash
curl http://localhost:5000/api/matches/1/summary
```

---

## 📱 Complete Workflow Example

### Scenario: Creating and Scoring a Match

**Step 1: Register as Scorer**
```bash
POST /api/auth/signup
{
  "username": "scorer1",
  "email": "scorer@cricket.com",
  "password": "secure123",
  "role": "scorer"
}
```

**Step 2: Create Match**
```bash
POST /api/matches
Authorization: Bearer {token}
{
  "team1_id": 1,
  "team2_id": 2,
  "match_date": "2026-03-15T14:00:00",
  "venue": "Local Ground",
  "overs_per_side": 20
}
# Returns: { "match_code": "A3E7K9" }
```

**Step 3: Share Match Code**
- Share "A3E7K9" with players and spectators

**Step 4: Viewers Join via WebSocket**
```javascript
socket.emit('join-match', 'A3E7K9');
```

**Step 5: Start Match (Toss)**
```bash
POST /api/matches/1/start
{
  "toss_winner_team_id": 1,
  "toss_decision": "bat"
}
```

**Step 6: Start Innings**
```bash
POST /api/scoring/innings/1/start
{
  "batsman1_id": 5,
  "batsman2_id": 8,
  "bowler_id": 15
}
```

**Step 7: Record Balls**
```bash
POST /api/scoring/ball
{
  "match_id": 1,
  "innings_id": 1,
  "batsman_id": 5,
  "bowler_id": 15,
  "non_striker_id": 8,
  "runs_scored": 4,
  "commentary": "Four!"
}
# All viewers receive instant update via WebSocket
```

---

For more details, visit the interactive API documentation at:
**http://localhost:5000/api-docs**
