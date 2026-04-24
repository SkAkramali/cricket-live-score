# Cricket Live Score - Architecture Documentation

## 📐 System Architecture

### Overview
The Cricket Live Score system is a production-ready, real-time application designed for tracking live cricket matches. It follows a modern, scalable architecture with clear separation of concerns.

## 🏛 Architecture Layers

### 1. Presentation Layer (Client)
- **Frontend Application** (React/Vue/Angular)
- **WebSocket Client** (Socket.io-client)
- **HTTP Client** (Axios/Fetch)

### 2. API Layer (Server)
- **REST API** (Express.js)
- **WebSocket Server** (Socket.io)
- **API Gateway** (Express routes)
- **Authentication Middleware** (JWT)
- **Rate Limiting** (express-rate-limit)
- **Request Validation** (express-validator)

### 3. Business Logic Layer
- **Handlers** (Business logic)
  - Authentication handlers
  - Match management handlers
  - Live scoring handlers
  - Analytics handlers
- **Utilities**
  - JWT utilities
  - Match code generator
  - Helper functions

### 4. Data Layer
- **Primary Database** (MySQL)
- **Cache Layer** (Redis - optional)
- **Connection Pool** (mysql2/promise)

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT APPLICATIONS                     │
│  (Web Browser, Mobile App, Desktop App)                     │
└────────────┬────────────────────────┬─────────────────────┘
             │                        │
         REST API                 WebSocket
             │                        │
┌────────────┴────────────────────────┴──────────────────────┐
│                     API GATEWAY (Express)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Rate Limiter │  │   CORS       │  │   Security      │  │
│  │              │  │              │  │   (Helmet)      │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└────────────┬────────────────────────┬─────────────────────┘
             │                        │
     ┌───────┴────────┐      ┌────────┴────────┐
     │  Authentication │      │   Socket.io     │
     │   Middleware    │      │   Handler       │
     │     (JWT)       │      └────────┬────────┘
     └───────┬────────┘               │
             │                        │
┌────────────┴────────────────────────┴─────────────────────┐
│                    BUSINESS LOGIC LAYER                    │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐  │
│  │   Auth      │  │   Match     │  │    Scoring       │  │
│  │  Handlers   │  │  Handlers   │  │   Handlers       │  │
│  └─────────────┘  └─────────────┘  └──────────────────┘  │
│                                                             │
│  ┌──────────────────────────────┐  ┌──────────────────┐  │
│  │    Analytics Handlers        │  │    Utilities     │  │
│  └──────────────────────────────┘  └──────────────────┘  │
└────────────┬───────────────────────────┬─────────────────┘
             │                           │
     ┌───────┴────────┐         ┌────────┴────────┐
     │  MySQL Pool    │         │  Redis Client   │
     │  (Primary DB)  │         │    (Cache)      │
     └───────┬────────┘         └────────┬────────┘
             │                           │
┌────────────┴───────────────────────────┴─────────────────┐
│                      DATA LAYER                           │
│                                                            │
│  ┌──────────────────┐            ┌──────────────────┐    │
│  │   MySQL 8.0+     │            │   Redis 6.0+     │    │
│  │  (Relational)    │            │  (Key-Value)     │    │
│  └──────────────────┘            └──────────────────┘    │
└───────────────────────────────────────────────────────────┘
```

## 🔄 Request Flow

### REST API Flow

```
Client Request
    │
    ├─→ Rate Limiter (Check request limit)
    │
    ├─→ CORS Middleware (Check origin)
    │
    ├─→ Body Parser (Parse JSON)
    │
    ├─→ Authentication Middleware (Verify JWT)
    │       │
    │       ├─→ Token Valid → Add user to req.user
    │       └─→ Token Invalid → Return 401 Error
    │
    ├─→ Route Handler
    │       │
    │       ├─→ Request Validation
    │       │
    │       ├─→ Business Logic Handler
    │       │       │
    │       │       ├─→ Check Redis Cache
    │       │       │       │
    │       │       │       ├─→ Cache Hit → Return cached data
    │       │       │       └─→ Cache Miss → Query database
    │       │       │
    │       │       ├─→ Database Operations
    │       │       │
    │       │       └─→ Update Cache
    │       │
    │       └─→ Response
    │
    └─→ Client receives response
```

### WebSocket Flow

```
Client Connection
    │
    ├─→ Socket.io Handshake
    │       │
    │       └─→ Authentication (Optional)
    │               │
    │               ├─→ Token Valid → Set socket.user
    │               └─→ No Token → Anonymous viewer
    │
    ├─→ join-match event
    │       │
    │       └─→ Join room (match-{matchCode})
    │
    ├─→ Listen for events
    │       │
    │       ├─→ ball-update
    │       ├─→ wicket-fallen
    │       ├─→ over-complete
    │       ├─→ innings-changed
    │       └─→ match-status-updated
    │
    └─→ Live Updates (Server → Client in real-time)
```

### Live Scoring Flow

```
Scorer Records Ball
    │
    ├─→ POST /api/scoring/ball (with JWT)
    │       │
    │       ├─→ Authenticate (Scorer/Admin only)
    │       │
    │       ├─→ Start Database Transaction
    │       │       │
    │       │       ├─→ Insert ball_by_ball record
    │       │       │
    │       │       ├─→ Update innings stats (runs, wickets, overs)
    │       │       │
    │       │       ├─→ Update batting_stats (runs, balls, SR)
    │       │       │
    │       │       ├─→ Update bowling_stats (overs, runs, wickets)
    │       │       │
    │       │       ├─→ Update partnerships
    │       │       │
    │       │       └─→ Commit Transaction
    │       │
    │       ├─→ Emit WebSocket Event
    │       │       │
    │       │       └─→ Broadcast to all viewers in match room
    │       │
    │       ├─→ Invalidate Cache
    │       │
    │       └─→ Return Success Response
    │
    └─→ All viewers receive update instantly
```

## 🗄 Database Schema Design

### Entity Relationship Diagram

```
┌──────────────┐        ┌──────────────┐
│    USERS     │───────<│   MATCHES    │
└──────────────┘        └──────┬───────┘
                               │
                        ┌──────┴───────┐
                        │              │
                    ┌───▼────┐    ┌────▼───┐
                    │ TEAMS  │    │INNINGS │
                    └───┬────┘    └────┬───┘
                        │              │
                    ┌───▼────┐    ┌────▼────────┐
                    │PLAYERS │────│BATTING_STATS│
                    └───┬────┘    └─────────────┘
                        │         ┌─────────────┐
                        └─────────│BOWLING_STATS│
                                  └─────────────┘
                                  ┌─────────────┐
                                  │PARTNERSHIPS │
                                  └─────────────┘
                                  ┌─────────────┐
                                  │BALL_BY_BALL │
                                  └─────────────┘
```

### Key Relationships

1. **User → Matches** (1:N)
   - A user creates multiple matches

2. **Match → Teams** (N:2)
   - Each match has exactly 2 teams

3. **Match → Innings** (1:2)
   - Each match has 1 or 2 innings

4. **Team → Players** (1:N)
   - A team has multiple players

5. **Innings → Batting/Bowling Stats** (1:N)
   - Each innings has stats for multiple players

6. **Innings → Partnerships** (1:N)
   - Each innings has multiple partnerships

7. **Innings → Ball_by_Ball** (1:N)
   - Detailed record of every ball

## 🔐 Security Architecture

### Authentication Flow

```
User Login
    │
    ├─→ POST /api/auth/login
    │       │
    │       ├─→ Validate email & password
    │       │
    │       ├─→ Query user from database
    │       │
    │       ├─→ Compare password with bcrypt
    │       │       │
    │       │       ├─→ Valid → Generate JWT tokens
    │       │       │       │
    │       │       │       ├─→ Access Token (7 days)
    │       │       │       └─→ Refresh Token (30 days)
    │       │       │
    │       │       └─→ Invalid → Return 401
    │       │
    │       └─→ Return tokens + user data
    │
    └─→ Client stores tokens (localStorage/cookies)

Protected Request
    │
    ├─→ Include: Authorization: Bearer {accessToken}
    │       │
    │       ├─→ JWT Middleware verifies token
    │       │       │
    │       │       ├─→ Valid → Decode payload → req.user
    │       │       │
    │       │       └─→ Invalid/Expired → 401 Error
    │       │
    │       └─→ Role-based authorization (if needed)
    │               │
    │               ├─→ Required role matches → Continue
    │               │
    │               └─→ Role mismatch → 403 Error
    │
    └─→ Process request
```

### Role-Based Access Control (RBAC)

```
┌────────────────────────────────────────────────┐
│                  USER ROLES                    │
├────────────────────────────────────────────────┤
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │  PLAYER (Default)                       │  │
│  │  - View matches                         │  │
│  │  - View own statistics                  │  │
│  │  - Join teams                           │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │  SCORER                                 │  │
│  │  - All Player permissions               │  │
│  │  - Create matches                       │  │
│  │  - Record balls                         │  │
│  │  - Update scores                        │  │
│  │  - End innings                          │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │  ADMIN                                  │  │
│  │  - All Scorer permissions               │  │
│  │  - Manage users                         │  │
│  │  - Delete matches                       │  │
│  │  - Modify any data                      │  │
│  └─────────────────────────────────────────┘  │
│                                                │
└────────────────────────────────────────────────┘
```

## 🚀 Performance Optimization Strategy

### 1. Database Optimization
- **Indexes**: All foreign keys and frequently queried columns
- **Connection Pooling**: Reuse database connections (pool of 10)
- **Query Optimization**: Use JOINs, avoid N+1 queries
- **Pagination**: Limit result sets for large queries

### 2. Caching Strategy
```
Request → Check Cache → Cache Hit? → Return cached data
                │
                └→ Cache Miss
                        │
                        ├→ Query Database
                        │
                        ├→ Store in Cache (with TTL)
                        │
                        └→ Return data

Cache Invalidation:
- On data update → Delete specific cache keys
- On pattern match → Delete multiple related keys
- TTL expiration → Automatic cleanup
```

**Cache Keys Structure:**
- `match:{match_id}:summary` (TTL: 5 min)
- `match:{match_id}:scorecard` (TTL: 5 min for live, 1 hour for completed)
- `player:{player_id}:career` (TTL: 1 hour)

### 3. WebSocket Optimization
- **Room-based architecture**: Broadcast only to interested clients
- **Selective events**: Send only necessary data
- **Compression**: Socket.io built-in compression
- **Connection pooling**: Efficient socket management

### 4. API Optimization
- **Response compression** (gzip)
- **JSON optimization**: Send only required fields
- **Rate limiting**: Prevent abuse
- **Async operations**: Non-blocking I/O

## 📈 Scalability Architecture

### Horizontal Scaling (Multiple Servers)

```
              Load Balancer
                   │
        ┌──────────┼──────────┐
        │          │          │
   Server 1    Server 2    Server 3
        │          │          │
        └──────────┼──────────┘
                   │
        ┌──────────┼──────────┐
        │                     │
   MySQL Master        Redis (Shared)
        │
   MySQL Slaves (Read Replicas)
```

**Key Points:**
- Stateless servers (JWT, no server sessions)
- Shared Redis for cache and Socket.io adapter
- Database read replicas for analytics
- Load balancer (Nginx/HAProxy)

### Vertical Scaling (Single Server)

- Increase server resources (CPU, RAM)
- Optimize database queries
- Increase connection pool size
- Enable all caching mechanisms

## 🔧 Error Handling Strategy

### Error Hierarchy

```
Global Error Handler
    │
    ├─→ Database Errors
    │       ├─→ ER_DUP_ENTRY → 409 Conflict
    │       ├─→ ER_NO_REFERENCED_ROW → 400 Bad Request
    │       └─→ Others → 500 Internal Error
    │
    ├─→ JWT Errors
    │       ├─→ JsonWebTokenError → 401 Unauthorized
    │       └─→ TokenExpiredError → 401 Unauthorized
    │
    ├─→ Validation Errors → 400 Bad Request
    │
    └─→ Unknown Errors → 500 Internal Error
```

### Error Response Format

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Technical error details",
  "stack": "Stack trace (development only)"
}
```

## 🧪 Testing Strategy

### Unit Tests
- Handler functions
- Utility functions
- Middleware

### Integration Tests
- API endpoints
- Database operations
- WebSocket events

### Load Tests
- Concurrent users
- Database performance
- WebSocket connections

## 📦 Deployment Architecture

### Development
```
Local Machine
├── Node.js Server (nodemon)
├── MySQL (localhost)
└── Redis (localhost)
```

### Production
```
Cloud Provider (AWS/Azure/GCP)
├── EC2/VM Instances (Multiple)
├── RDS/Managed MySQL (Primary + Replicas)
├── ElastiCache/Redis (Managed)
├── Load Balancer (ALB/ELB)
├── CloudWatch/Monitoring
└── S3/Cloud Storage (Logs, Backups)
```

## 🔄 Data Flow Examples

### Creating and Joining a Match

```
1. Scorer creates match
   ↓
2. System generates unique match code (e.g., "ABC123")
   ↓
3. Scorer shares code with players/spectators
   ↓
4. Users visit website and enter code
   ↓
5. System fetches match details
   ↓
6. WebSocket connection established
   ↓
7. User joins match room
   ↓
8. Real-time updates begin
```

### Recording a Ball (Real-time)

```
Scorer → Record Ball
    ↓
HTTP POST /api/scoring/ball
    ↓
Authenticate & Authorize
    ↓
Database Transaction Start
    ├→ Insert ball record
    ├→ Update innings
    ├→ Update batsman stats
    ├→ Update bowler stats
    └→ Update partnership
    ↓
Commit Transaction
    ↓
Emit WebSocket Event
    ↓
Broadcast to all viewers
    ↓
Invalidate cache
    ↓
Return success response
    ↓
All viewers see update (< 100ms)
```

## 📊 Performance Metrics

### Target Metrics
- **API Response Time**: < 200ms (95th percentile)
- **WebSocket Latency**: < 100ms
- **Database Query Time**: < 50ms
- **Cache Hit Ratio**: > 80%
- **Concurrent Users**: 10,000+
- **Concurrent Matches**: 1,000+

### Monitoring Points
- API endpoint response times
- Database query performance
- Cache hit/miss ratios
- WebSocket connection count
- Memory usage
- CPU utilization
- Error rates

---

This architecture is designed to be:
- **Scalable**: Can handle growth
- **Maintainable**: Clear structure
- **Secure**: Multiple security layers
- **Performant**: Optimized at every level
- **Reliable**: Error handling and recovery
