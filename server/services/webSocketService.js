const { Server } = require("socket.io");

class WebSocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map();
    this.socketUsers = new Map();
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: ["https://fitsync-5tf7.onrender.com", "http://localhost:5173"],
        credentials: true,
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
    });

    this.setupEventHandlers();
    console.log("WebSocket service initialized");
  }

  setupEventHandlers() {
    this.io.on("connection", (socket) => {
      console.log(`New WebSocket connection: ${socket.id}`);

      socket.on("authenticate", (data) => {
        this.handleAuthentication(socket, data);
      });

      socket.on("disconnect", () => {
        this.handleDisconnection(socket);
      });

      socket.on("error", (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }

  handleAuthentication(socket, data) {
    const { userId, token } = data;

    if (!userId) {
      socket.emit("auth_error", { message: "User ID is required" });
      return;
    }

    this.socketUsers.set(socket.id, userId);

    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, []);
    }
    this.userSockets.get(userId).push(socket.id);

    socket.join(`user_${userId}`);

    console.log(`User ${userId} authenticated on socket ${socket.id}`);
    socket.emit("authenticated", { userId, socketId: socket.id });
  }

  handleDisconnection(socket) {
    const userId = this.socketUsers.get(socket.id);

    if (userId) {
      const userSocketList = this.userSockets.get(userId);
      if (userSocketList) {
        const index = userSocketList.indexOf(socket.id);
        if (index > -1) {
          userSocketList.splice(index, 1);
        }

        if (userSocketList.length === 0) {
          this.userSockets.delete(userId);
        }
      }

      this.socketUsers.delete(socket.id);

      console.log(`User ${userId} disconnected from socket ${socket.id}`);
    }
  }

  broadcastMealUpdate(userId, mealData) {
    if (this.userSockets.has(userId)) {
      this.io.to(`user_${userId}`).emit("meal_updated", mealData);
      console.log(`Broadcasted meal update to user ${userId}`);
    }
  }

  broadcastWorkoutUpdate(userId, workoutData) {
    if (this.userSockets.has(userId)) {
      this.io.to(`user_${userId}`).emit("workout_updated", workoutData);
      console.log(`Broadcasted workout update to user ${userId}`);
    }
  }

  getConnectedUsersCount() {
    return this.userSockets.size;
  }

  getTotalConnectionsCount() {
    return this.socketUsers.size;
  }

  getUserConnections(userId) {
    return this.userSockets.get(userId) || [];
  }
}

module.exports = new WebSocketService();
