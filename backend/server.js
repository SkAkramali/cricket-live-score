// ============================================
// CRICKET LIVE SCORE - BACKEND SERVER
// Production-Ready Express + Socket.io Server
// ============================================

// ---------------- Imports ----------------
require('dotenv').config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Initialize Express app
const app = express();
const server = http.createServer(app);

// ---------------- Initialize Socket.io ----------------
const { initializeSocket } = require("./config/socket");
const io = initializeSocket(server);

// ---------------- Initialize Redis (optional) ----------------
const { initializeRedis } = require("./config/redis");
initializeRedis().catch(err => {
  console.warn('Redis initialization failed. Caching disabled:', err.message);
});

// ---------------- Security Middleware ----------------
app.use(helmet({
  contentSecurityPolicy: false, // Disable for Swagger UI
}));

// ---------------- Rate Limiting ----------------
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all API routes
app.use('/api/', limiter);

// ---------------- General Middleware ----------------
app.use(compression()); // Compress responses
app.use(morgan('combined')); // Logging
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---------------- CORS Configuration ----------------
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// ---------------- Import Error Handlers ----------------
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

// ---------------- Import Routes ----------------
const authRouter = require("./routes/aouth");
const teamsRouter = require("./routes/teams");
const playersRouter = require("./routes/players");
const matchsRouter = require("./routes/matchs");
const inningsRouter = require('./routes/innings');
const scoringRouter = require('./routes/scoring');
const analyticsRouter = require('./routes/analytics');
const tournamentsRouter = require('./routes/tournaments');

// ---------------- Route Mounting ----------------
app.use("/api/auth", authRouter);
app.use("/api/teams", teamsRouter);
app.use("/api/players", playersRouter);
app.use("/api/matches", matchsRouter);
app.use("/api/innings", inningsRouter);
app.use("/api/scoring", scoringRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/tournaments", tournamentsRouter);

// ---------------- Swagger API Documentation ----------------
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Cricket Live Score API",
      version: "1.0.0",
      description: "Production-ready API for live cricket scoring system with real-time updates via WebSocket",
      contact: {
        name: "API Support"
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: "Development server"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ["./routes/*.js", "./apiDoc.yaml"],
};

const specs = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// ---------------- Health Check Route ----------------
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ---------------- Root Route ----------------
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Cricket Live Score API",
    version: "1.0.0",
    documentation: "/api-docs",
    endpoints: {
      auth: "/api/auth",
      matches: "/api/matches",
      scoring: "/api/scoring",
      analytics: "/api/analytics",
      teams: "/api/teams",
      players: "/api/players"
    }
  });
});

// ---------------- 404 Handler ----------------
app.use(notFoundHandler);

// ---------------- Error Handler (must be last) ----------------
app.use(errorHandler);

// ---------------- Start Server ----------------
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║       🏏 CRICKET LIVE SCORE API - SERVER STARTED          ║
║                                                           ║
║  Server running on: http://localhost:${PORT}                ║
║  Swagger Docs:      http://localhost:${PORT}/api-docs      ║
║  WebSocket:         Ready for connections                 ║
║                                                           ║
║  Environment:       ${process.env.NODE_ENV || 'development'}                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// ---------------- Graceful Shutdown ----------------
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };
