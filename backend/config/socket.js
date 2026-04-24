const { Server } = require('socket.io');
const { verifyToken } = require('../utils/jwt');

let io;

/**
 * Initialize Socket.io server
 * @param {Object} server - HTTP server instance
 * @returns {Object} Socket.io instance
 */
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware for socket connections
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        // Allow anonymous connections for viewing matches
        socket.user = { role: 'anonymous' };
        return next();
      }

      const decoded = verifyToken(token);
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}, Role: ${socket.user.role}`);

    // Join match room
    socket.on('join-match', (matchCode) => {
      socket.join(`match-${matchCode}`);
      console.log(`User ${socket.id} joined match: ${matchCode}`);
      
      socket.emit('joined-match', {
        success: true,
        matchCode,
        message: 'Successfully joined match'
      });
    });

    // Leave match room
    socket.on('leave-match', (matchCode) => {
      socket.leave(`match-${matchCode}`);
      console.log(`User ${socket.id} left match: ${matchCode}`);
    });

    // Handle score update (only authenticated scorers/admins)
    socket.on('update-score', (data) => {
      if (socket.user.role === 'anonymous') {
        socket.emit('error', {
          message: 'Authentication required to update scores'
        });
        return;
      }

      // Broadcast score update to all users in match room
      io.to(`match-${data.matchCode}`).emit('score-updated', data);
    });

    // Handle wicket event
    socket.on('wicket-update', (data) => {
      if (socket.user.role === 'anonymous') {
        return;
      }
      
      io.to(`match-${data.matchCode}`).emit('wicket-fallen', data);
    });

    // Handle over completed event
    socket.on('over-completed', (data) => {
      if (socket.user.role === 'anonymous') {
        return;
      }
      
      io.to(`match-${data.matchCode}`).emit('over-complete', data);
    });

    // Handle innings change
    socket.on('innings-change', (data) => {
      if (socket.user.role === 'anonymous') {
        return;
      }
      
      io.to(`match-${data.matchCode}`).emit('innings-changed', data);
    });

    // Handle match status change
    socket.on('match-status-change', (data) => {
      if (socket.user.role === 'anonymous') {
        return;
      }
      
      io.to(`match-${data.matchCode}`).emit('match-status-updated', data);
    });

    // Get active viewers count
    socket.on('get-viewers-count', async (matchCode) => {
      const room = io.sockets.adapter.rooms.get(`match-${matchCode}`);
      const viewersCount = room ? room.size : 0;
      
      socket.emit('viewers-count', {
        matchCode,
        count: viewersCount
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
};

/**
 * Get Socket.io instance
 * @returns {Object} Socket.io instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

/**
 * Emit event to specific match room
 * @param {String} matchCode - Match code
 * @param {String} event - Event name
 * @param {Object} data - Event data
 */
const emitToMatch = (matchCode, event, data) => {
  const io = getIO();
  io.to(`match-${matchCode}`).emit(event, data);
};

/**
 * Emit ball-by-ball update to match room
 * @param {String} matchCode - Match code
 * @param {Object} ballData - Ball data
 */
const emitBallUpdate = (matchCode, ballData) => {
  emitToMatch(matchCode, 'ball-update', ballData);
};

module.exports = {
  initializeSocket,
  getIO,
  emitToMatch,
  emitBallUpdate
};
