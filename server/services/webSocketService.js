const { Server } = require("socket.io");
const admin = require("../firebase");
const { PrismaClient } = require("@prisma/client");

class WebSocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map();
    this.socketUsers = new Map();
    this.db = new PrismaClient();
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

  async handleAuthentication(socket, data) {
    const { token } = data;

    if (!token) {
      socket.emit("auth_error", { message: "Firebase token is required" });
      return;
    }

    try {
      const decoded = await admin.auth().verifyIdToken(token);
      const { uid } = decoded;

      const user = await this.db.user.findUnique({
        where: { firebaseUid: uid },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      if (!user) {
        socket.emit("auth_error", { message: "User not found" });
        return;
      }

      this.socketUsers.set(socket.id, user.id);

      if (!this.userSockets.has(user.id)) {
        this.userSockets.set(user.id, []);
      }
      this.userSockets.get(user.id).push(socket.id);

      socket.join(`user_${user.id}`);

      console.log(
        `User ${user.id} (${user.email}) authenticated on socket ${socket.id}`
      );
      socket.emit("authenticated", {
        userId: user.id,
        socketId: socket.id,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error) {
      console.error("WebSocket authentication error:", error);
      socket.emit("auth_error", {
        message: "Authentication failed",
        error: error.message,
      });
    }
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

  isUserConnected(userId) {
    return (
      this.userSockets.has(userId) && this.userSockets.get(userId).length > 0
    );
  }

  getConnectedUsers() {
    return Array.from(this.userSockets.keys());
  }

  getConnectionStatus() {
    const users = Array.from(this.userSockets.entries()).map(
      ([userId, sockets]) => ({
        userId,
        connectionCount: sockets.length,
        socketIds: sockets,
      })
    );

    return {
      totalUsers: this.userSockets.size,
      totalConnections: this.socketUsers.size,
      users,
    };
  }
}

module.exports = new WebSocketService();
