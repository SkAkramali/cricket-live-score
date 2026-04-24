# 🏏 Cricket Live Score - Deployment & Quick Start Guide

## 🚀 Quick Start (5 Minutes)

### Prerequisites Check
```bash
node --version  # Should be 16+
mysql --version # Should be 8.0+
```

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Setup Database
```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE cricket_live_score;
exit;

# Import schema
mysql -u root -p cricket_live_score < database/schema.sql
```

### 4. Start Server
```bash
npm run dev
```

✅ Server running at: `http://localhost:5000`
📚 API Docs at: `http://localhost:5000/api-docs`

---

## 📦 Project Structure

```
backend/
├── config/                    # Configuration files
│   ├── redis.js              # Redis cache setup
│   └── socket.js             # WebSocket configuration
├── database/                 # Database files
│   ├── schema.sql            # Complete database schema
│   └── migration.sql         # Migration scripts
├── handlers/                 # Business logic
│   ├── aouthHandlers.js      # Authentication
│   ├── matchHandlers.js      # Match management
│   ├── scoringHandlers.js    # Live scoring
│   └── analyticsHandlers.js  # Statistics
├── middleware/               # Express middleware
│   ├── auth.js               # JWT authentication
│   ├── validator.js          # Input validation
│   └── errorHandler.js       # Error handling
├── routes/                   # API endpoints
│   ├── aouth.js              # Auth routes
│   ├── matchs.js             # Match routes
│   ├── scoring.js            # Scoring routes
│   └── analytics.js          # Analytics routes
├── utils/                    # Utilities
│   ├── jwt.js                # JWT helpers
│   └── matchCode.js          # Code generator
├── .env.example              # Environment template
├── database.js               # DB connection pool
├── server.js                 # Main server file
├── package.json              # Dependencies
├── README.md                 # Full documentation
├── ARCHITECTURE.md           # Architecture details
└── API_GUIDE.md              # API reference
```

---

## 🗄️ Database Tables Overview

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User accounts | user_id, email, password, role |
| `teams` | Cricket teams | team_id, team_name |
| `players` | Player profiles | player_id, team_id, role |
| `matches` | Match details | match_id, match_code, status |
| `innings` | Innings data | innings_id, total_runs, total_wickets |
| `batting_stats` | Batsman performance | runs_scored, balls_faced, strike_rate |
| `bowling_stats` | Bowler performance | wickets_taken, economy_rate |
| `partnerships` | Partnerships | batsman1_id, batsman2_id, runs |
| `ball_by_ball` | Ball-by-ball records | ball_id, runs_scored, is_wicket |

---

## 🔑 Key Features Implemented

### ✅ Authentication & Authorization
- JWT-based authentication
- Access & refresh tokens
- Role-based access control (Player, Scorer, Admin)
- Password hashing with bcrypt
- Secure token validation

### ✅ Match Management
- Create matches with unique codes
- Toss management
- Live match status
- Match code sharing system
- Multiple innings support

### ✅ Live Scoring System
- Real-time score updates via WebSocket
- Ball-by-ball recording
- Wicket tracking (all dismissal types)
- Extras tracking (wides, no-balls, byes, leg-byes)
- Strike rate & economy calculations
- Partnership tracking
- Auto-calculation of overs

### ✅ Player Statistics
- Individual batting stats
- Individual bowling stats
- Career statistics
- Match-specific performance
- Strike rate, average, economy rate

### ✅ Match Analytics
- Complete scorecard
- Top batsmen and bowlers
- Run rate analysis
- Partnership analysis
- Boundary statistics
- Ball-by-ball commentary

### ✅ Real-time Communication
- Socket.io integration
- Room-based broadcasting
- Live viewer count
- Instant score updates
- Event-driven architecture

### ✅ Performance Optimization
- Redis caching (optional)
- Database connection pooling
- Query optimization with indexes
- Response compression
- Rate limiting

### ✅ Security Features
- Helmet.js security headers
- CORS configuration
- Input validation
- SQL injection protection
- XSS protection

---

## 📡 API Endpoints Summary

### Authentication
```
POST   /api/auth/signup           # Register
POST   /api/auth/login            # Login
POST   /api/auth/refresh-token    # Refresh token
GET    /api/auth/me               # Get current user
PUT    /api/auth/profile          # Update profile
PUT    /api/auth/change-password  # Change password
```

### Matches
```
GET    /api/matches               # All matches
POST   /api/matches               # Create match
GET    /api/matches/code/:code    # Join by code
GET    /api/matches/:id/summary   # Live summary
POST   /api/matches/:id/start     # Start match
```

### Live Scoring (Protected)
```
POST   /api/scoring/ball                      # Record ball
POST   /api/scoring/innings/:id/start         # Start innings
POST   /api/scoring/innings/:id/batsman/change # Change batsman
POST   /api/scoring/innings/:id/bowler/change  # Change bowler
POST   /api/scoring/innings/:id/end            # End innings
```

### Analytics
```
GET    /api/analytics/match/:id/scorecard    # Scorecard
GET    /api/analytics/match/:id/analytics    # Statistics
GET    /api/analytics/match/:id/top-batsmen  # Top batsmen
GET    /api/analytics/match/:id/top-bowlers  # Top bowlers
GET    /api/analytics/player/:id/career      # Career stats
GET    /api/analytics/innings/:id/partnerships # Partnerships
GET    /api/analytics/innings/:id/commentary   # Commentary
```

---

## 🔌 WebSocket Events

### Client Events
- `join-match` - Join a match room
- `leave-match` - Leave match room
- `get-viewers-count` - Get viewer count

### Server Events
- `ball-update` - Score updated
- `wicket-fallen` - Wicket taken
- `over-complete` - Over finished
- `innings-changed` - New innings
- `match-status-updated` - Match status change
- `viewers-count` - Current viewers

---

## 🧪 Testing the System

### 1. Test Server Health
```bash
curl http://localhost:5000/health
```

### 2. Register User
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"scorer1","email":"scorer@test.com","password":"test123","role":"scorer"}'
```

### 3. Create Match
First login to get token, then:
```bash
curl -X POST http://localhost:5000/api/matches \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"team1_id":1,"team2_id":2,"match_date":"2026-03-15T14:00:00","venue":"Test Ground","overs_per_side":20}'
```

### 4. Test WebSocket
Use the interactive API docs at `/api-docs` to test WebSocket connections.

---

## 📊 Performance Benchmarks

### Expected Performance
- **API Response Time**: < 200ms (95th percentile)
- **WebSocket Latency**: < 100ms
- **Database Queries**: < 50ms
- **Concurrent Users**: 10,000+
- **Concurrent Matches**: 1,000+

### Load Testing (Optional)
```bash
npm install -g artillery
artillery quick --count 100 --num 10 http://localhost:5000/health
```

---

## 🚀 Production Deployment

### Environment Variables (Production)
```env
NODE_ENV=production
PORT=5000
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=strong-password
JWT_SECRET=very-strong-secret-key
REDIS_HOST=your-redis-host
FRONTEND_URL=https://yourdomain.com
```

### Recommended Hosting
- **Backend**: AWS EC2, DigitalOcean, Heroku
- **Database**: AWS RDS (MySQL), DigitalOcean Managed Database
- **Redis**: AWS ElastiCache, Redis Cloud
- **Load Balancer**: AWS ALB, Nginx

### PM2 (Process Manager)
```bash
npm install -g pm2
pm2 start server.js --name cricket-api
pm2 save
pm2 startup
```

### Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u root -p -e "SELECT 1"
```

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### Redis Connection Issues
```bash
# Check Redis is running
redis-cli ping

# Should return: PONG
```

---

## 📈 Scalability Options

### Horizontal Scaling
1. Deploy multiple server instances
2. Use load balancer (Nginx/HAProxy)
3. Share Redis across instances
4. Enable Socket.io Redis adapter

### Vertical Scaling  
1. Increase server resources
2. Optimize database queries
3. Enable all caching
4. Increase connection pool

### Database Optimization
1. Add read replicas for analytics
2. Partition large tables
3. Archive old matches
4. Regular index maintenance

---

## 🤝 Support & Documentation

- **README.md** - Complete feature documentation
- **ARCHITECTURE.md** - System architecture details
- **API_GUIDE.md** - API reference with examples
- **Swagger UI** - Interactive API testing at `/api-docs`

---

## 📝 License

MIT License - Open source and free to use

---

## 🎯 Next Steps

### For Development
1. Install dependencies: `npm install`
2. Setup database: Run `schema.sql`
3. Configure `.env` file
4. Start server: `npm run dev`
5. Test APIs: Visit `/api-docs`

### For Production
1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Enable Redis caching
4. Setup SSL/HTTPS
5. Configure PM2
6. Setup monitoring (e.g., New Relic)
7. Regular database backups
8. Rate limiting configuration

---

**🏏 Ready to score some cricket matches! 🎉**

For issues or questions, refer to the comprehensive documentation files included in this project.
