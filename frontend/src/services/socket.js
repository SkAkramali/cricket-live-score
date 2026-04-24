import { io } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = localStorage.getItem('accessToken');
    
    this.socket = io(WS_URL, {
      auth: {
        token: token || '',
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket.id);
      this.connected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // Join a specific match room
  joinMatch(matchId) {
    if (this.socket?.connected) {
      this.socket.emit('join-match', matchId);
      console.log(`Joined match room: ${matchId}`);
    }
  }

  // Leave a specific match room
  leaveMatch(matchId) {
    if (this.socket?.connected) {
      this.socket.emit('leave-match', matchId);
      console.log(`Left match room: ${matchId}`);
    }
  }

  // Listen for ball updates
  onBallUpdate(callback) {
    if (this.socket) {
      this.socket.on('ball-update', callback);
    }
  }

  // Listen for wicket events
  onWicketFallen(callback) {
    if (this.socket) {
      this.socket.on('wicket-fallen', callback);
    }
  }

  // Listen for over completion
  onOverComplete(callback) {
    if (this.socket) {
      this.socket.on('over-complete', callback);
    }
  }

  // Listen for innings changes
  onInningsChanged(callback) {
    if (this.socket) {
      this.socket.on('innings-changed', callback);
    }
  }

  // Listen for match status updates
  onMatchStatusUpdate(callback) {
    if (this.socket) {
      this.socket.on('match-status-updated', callback);
    }
  }

  // Listen for viewers count
  onViewersCount(callback) {
    if (this.socket) {
      this.socket.on('viewers-count', callback);
    }
  }

  // Remove all event listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  // Remove specific event listener
  off(event) {
    if (this.socket) {
      this.socket.off(event);
    }
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
