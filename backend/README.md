# Cricket Live Score - Backend API

## 🏏 Production-Ready Backend for Live Cricket Scoring

A comprehensive, scalable backend system for live cricket scoring with real-time updates via WebSocket. Perfect for gully/local cricket matches.

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [WebSocket Events](#websocket-events)
- [Usage Examples](#usage-examples)
- [Performance Optimization](#performance-optimization)
- [Scalability](#scalability)

## ✨ Features

### Core Features
- ✅ **JWT Authentication** - Secure user authentication with access and refresh tokens
- ✅ **Real-time Score Updates** - WebSocket integration for live match updates
- ✅ **Match Management** - Create matches with unique shareable codes
- ✅ **Ball-by-Ball Scoring** - Detailed ball tracking with commentary
- ✅ **Player Statistics** - Comprehensive batting and bowling stats
- ✅ **Match Analytics** - Run rates, partnerships, top performers
- ✅ **Role-Based Access** - Player, Scorer, and Admin roles
- ✅ **Redis Caching** - Optional caching for improved performance
- ✅ **Rate Limiting** - Protection against abuse
- ✅ **Error Handling** - Comprehensive error management

### Match Features
- Toss management (batting/bowling choice)
- Multiple innings support
- Wicket tracking with dismissal types
- Extras tracking (wides, no-balls, byes, leg-byes)
- Partnership tracking
- Over-by-over analysis
- Live viewer count

## 🛠 Technology Stack

- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Database**: MySQL 8.0+
- **Real-time**: Socket.io
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Caching**: Redis (optional)
- **API Documentation**: Swagger/OpenAPI
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: express-validator

## 🏗 Architecture

```
backend/
├── config/                 # Configuration files
│   ├── redis.js           # Redis client setup
│   └── socket.js          # Socket.io configuration
├── database/              # Database files
│   ├── schema.sql         # Complete database schema
│   └── migration.sql      # Migration scripts
├── handlers/              # Business logic
│   ├── aouthHandlers.js   # Authentication logic
│   ├── matchHandlers.js   # Match management
│   ├── scoringHandlers.js # Live scoring logic
│   └── analyticsHandlers.js # Statistics & analytics
├── middleware/            # Express middleware
│   ├── auth.js            # JWT authentication
│   ├── validator.js       # Request validation
│   └── errorHandler.js    # Error handling
├── routes/                # API routes
│   ├── aouth.js           # Auth endpoints
│   ├── matchs.js          # Match endpoints
│   ├── scoring.js         # Scoring endpoints
│   └── analytics.js       # Analytics endpoints
├── utils/                 # Utility functions
│   ├── jwt.js             # JWT utilities
│   └── matchCode.js       # Match code generator
├── database.js            # Database connection
├── server.js              # Main server file
└── package.json           # Dependencies
```

## 📦 Installation

### Prerequisites
- Node.js v16 or higher
- MySQL 8.0 or higher
- Redis (optional, for caching)

### Steps

1. **Clone the repository**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Set up the database**
```bash
# Create database
mysql -u root -p

CREATE DATABASE cricket_live_score;
exit;

# Run schema
mysql -u root -p cricket_live_score < database/schema.sql
```

5. **Start the server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## ⚙️ Configuration

Create a `.env` file in the backend directory:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cricket_live_score

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRY=7d
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRY=30d

# Server
PORT=5000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:5173

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## 🗄 Database Setup

### Tables Created
- **users** - User accounts with authentication
- **teams** - Cricket teams
- **players** - Player profiles
- **matches** - Match details with unique codes
- **innings** - Innings data (1st & 2nd)
- **batting_stats** - Batsman performance per innings
- **bowling_stats** - Bowler performance per innings
- **partnerships** - Batting partnerships
- **ball_by_ball** - Detailed ball-by-ball records
- **match_players** - Players in specific matches

### Key Features
- Proper foreign key relationships
- Indexes on frequently queried columns
- Triggers for automatic calculations
- Views for common analytics queries

## 📖 API Documentation

Once the server is running, access the interactive API documentation:

**Swagger UI**: `http://localhost:5000/api-docs`

### Main API Endpoints

#### Authentication
```
POST   /api/auth/signup          # Register new user
POST   /api/auth/login           # Login user
POST   /api/auth/refresh-token   # Refresh access token
GET    /api/auth/me              # Get current user (protected)
PUT    /api/auth/profile         # Update profile (protected)
PUT    /api/auth/change-password # Change password (protected)
```

#### Matches
```
POST   /api/matches              # Create match (protected)
GET    /api/matches              # Get all matches
GET    /api/matches/code/:code   # Join match by code
GET    /api/matches/:id/summary  # Live match summary
POST   /api/matches/:id/start    # Start match (protected)
```

#### Live Scoring (Scorer/Admin only)
```
POST   /api/scoring/ball                    # Record a ball
POST   /api/scoring/innings/:id/start       # Start innings
POST   /api/scoring/innings/:id/batsman/change  # Change batsman
POST   /api/scoring/innings/:id/bowler/change   # Change bowler
POST   /api/scoring/innings/:id/end         # End innings
```

#### Analytics
```
GET    /api/analytics/match/:id/scorecard        # Full scorecard
GET    /api/analytics/match/:id/analytics        # Match statistics
GET    /api/analytics/match/:id/top-batsmen      # Top batsmen
GET    /api/analytics/match/:id/top-bowlers      # Top bowlers
GET    /api/analytics/player/:id/career          # Career stats
GET    /api/analytics/innings/:id/partnerships   # Partnerships
GET    /api/analytics/innings/:id/commentary     # Ball commentary
```

#### Teams & Players
```
GET    /api/teams                # Get all teams
POST   /api/teams                # Create team (protected)
GET    /api/teams/:id            # Get team details
GET    /api/players              # Get all players
POST   /api/players              # Add player (protected)
GET    /api/players/:id          # Get player details
```

## 🔌 WebSocket Events

### Client → Server

```javascript
// Connect with authentication
socket.emit('join-match', matchCode);

// Get live viewer count
socket.emit('get-viewers-count', matchCode);

// Leave match
socket.emit('leave-match', matchCode);
```

### Server → Client

```javascript
// Score updated
socket.on('ball-update', (data) => {
  // { ball_id, runs_scored, extras, is_wicket, total_runs, total_wickets, ... }
});

// Wicket fallen
socket.on('wicket-fallen', (data) => {
  // { player_name, dismissal_type, ... }
});

// Over completed
socket.on('over-complete', (data) => {
  // { over_number, runs_in_over, ... }
});

// Innings changed
socket.on('innings-changed', (data) => {
  // { innings_number, batting_team, ... }
});

// Match status updated
socket.on('match-status-updated', (data) => {
  // { status, winner, result_text, ... }
});

// Viewers count
socket.on('viewers-count', (data) => {
  // { matchCode, count }
});
```

### Example Client Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token' // optional for viewing
  }
});

socket.on('connect', () => {
  console.log('Connected to server');
  socket.emit('join-match', 'ABC123');
});

socket.on('ball-update', (data) => {
  console.log('Ball update:', data);
  // Update UI with new score
});
```

## 💡 Usage Examples

### 1. User Registration and Login

```javascript
// Register
const response = await fetch('http://localhost:5000/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'john_doe',
    email: 'john@example.com',
    password: 'secure123',
    full_name: 'John Doe',
    role: 'scorer'
  })
});

const { data } = await response.json();
// data.accessToken, data.refreshToken, data.user
```

### 2. Create a Match

```javascript
const response = await fetch('http://localhost:5000/api/matches', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    team1_id: 1,
    team2_id: 2,
    match_date: '2026-03-15T14:00:00',
    venue: 'Local Ground',
    overs_per_side: 20,
    match_type: 't20'
  })
});

const { data } = await response.json();
// data.match_code (e.g., "ABC123")
// Share this code with spectators!
```

### 3. Record a Ball

```javascript
const response = await fetch('http://localhost:5000/api/scoring/ball', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${scorerToken}`
  },
  body: JSON.stringify({
    match_id: 1,
    innings_id: 1,
    batsman_id: 5,
    bowler_id: 12,
    non_striker_id: 6,
    runs_scored: 4,
    extras: 0,
    extra_type: 'none',
    is_wicket: false,
    commentary: 'Beautiful cover drive for FOUR!'
  })
});

// All connected viewers receive 'ball-update' event instantly
```

## 🚀 Performance Optimization

### 1. **Database Indexing**
- Indexes on foreign keys
- Composite indexes for common queries
- Indexes on match_code, status, timestamp

### 2. **Redis Caching**
- Match summaries cached (5 min for live, 1 hour for completed)
- Player career stats cached (1 hour)
- Scorecard cached with TTL
- Cache invalidation on updates

### 3. **Query Optimization**
- Use of JOINs instead of multiple queries
- Pagination for large result sets
- SELECT only required columns
- Connection pooling

### 4. **API Optimization**
- Response compression (gzip)
- Rate limiting to prevent abuse
- Proper HTTP caching headers
- Efficient JSON serialization

## 📈 Scalability Considerations

### Horizontal Scaling
- **Stateless Design**: JWT tokens allow any server to validate requests
- **Database Connection Pooling**: Handles multiple connections efficiently
- **Redis for Session Storage**: Can be shared across multiple instances
- **Load Balancer Ready**: No server-side session dependency

### Vertical Scaling
- Efficient database queries with indexes
- Connection pooling (max 10 connections)
- Memory-efficient ball-by-ball storage
- Paginated endpoints for large datasets

### WebSocket Scaling
- Socket.io supports Redis adapter for multi-server setups
- Room-based architecture (one room per match)
- Efficient broadcast to specific rooms only

### Future Enhancements
- Message queue (RabbitMQ/Kafka) for async operations
- Database read replicas for analytics
- CDN for static content
- Microservices architecture for very large scale

## 🔐 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with 10 salt rounds
- **Helmet.js**: Security headers
- **CORS**: Configurable origin restrictions
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: express-validator for all inputs
- **SQL Injection Protection**: Parameterized queries
- **Role-Based Access Control**: Scorer/Admin restrictions

## 🧪 Testing

```bash
# Test health endpoint
curl http://localhost:5000/health

# Test WebSocket connection
npm install -g wscat
wscat -c ws://localhost:5000
```

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests.

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Made with ❤️ for cricket enthusiasts**
