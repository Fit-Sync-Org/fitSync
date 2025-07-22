const { Server } = require("socket.io");
const admin = require("../firebase");
const { PrismaClient } = require("@prisma/client");
const { RetryEngine } = require("../utils/retryEngine");
const { EncryptionEngine } = require("../utils/encryptionEngine");
const { DynamicConfigEngine } = require("../utils/dynamicConfigEngine");

class WebSocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map();
    this.socketUsers = new Map();
    this.db = new PrismaClient();
    this.dynamicConfig = new DynamicConfigEngine(this);
    this.dbRetry = new RetryEngine({
      maxRetries: 3,
      baseDelay: 500,
      onFailure: (err) =>
        console.error("DB operation failed after retries:", err),
      dynamicConfig: this.dynamicConfig,
    });
    this.encryptor = new EncryptionEngine({
      secretKey: process.env.ENCRYPTION_KEY || "FitSyncDefaultSecretKey2024",
      enabled:
        process.env.NODE_ENV === "production" ||
        process.env.ENABLE_ENCRYPTION === "true",
    });
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

      socket.on("reauthenticate", (data) => {
        console.log(`Re-authentication request from socket ${socket.id}`);
        this.handleAuthentication(socket, data);
      });

      socket.on("disconnect", () => {
        this.handleDisconnection(socket);
      });

      socket.on("error", (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });

      socket.on("ping", () => {
        socket.emit("pong", { timestamp: Date.now() });
      });

      socket.on("meal_updated", async (mealData, ack) => {
        try {
          const userAgent = socket.handshake.headers["user-agent"] || "unknown";
          const userId = this.socketUsers.get(socket.id);

          if (!userId) {
            return ack({ success: false, error: "User not authenticated" });
          }

          if (!mealData || !mealData.userId || !mealData.date) {
            return ack({ success: false, error: "Invalid meal data" });
          }

          if (mealData.calories && mealData.calories > 10000) {
            return ack({
              success: false,
              error: "Calorie amount seems unusually high",
              suggestion: "Please verify the serving size",
            });
          }

          const userRetry = new RetryEngine({
            maxRetries: 3,
            baseDelay: 200,
            userId: userId,
            userAgent: userAgent,
            dynamicConfig: this.dynamicConfig,
          });

          await userRetry.start(async () => {
            await this.db.meal.update({
              where: { id: mealData.id },
              data: mealData,
            });
          });

          const encryptionParams =
            await this.dynamicConfig.calculateEncryptionParams(
              userId,
              userAgent,
              "health_critical"
            );

          const encryptedMealData = encryptionParams.shouldEncrypt
            ? this.encryptor.encryptSensitiveData(mealData)
            : mealData;

          this.io
            .to(`user_${mealData.userId}`)
            .emit("meal_updated", encryptedMealData);

          ack({ success: true });
        } catch (err) {
          console.error("Meal update error:", err);
          ack({ success: false, error: err.message });
        }
      });

      socket.on("workout_updated", async (workoutData, ack) => {
        try {
          const userAgent = socket.handshake.headers["user-agent"] || "unknown";
          const userId = this.socketUsers.get(socket.id);

          if (!userId) {
            return ack({ success: false, error: "User not authenticated" });
          }

          if (!workoutData || !workoutData.userId || !workoutData.date) {
            return ack({ success: false, error: "Invalid workout data" });
          }

          const userRetry = new RetryEngine({
            maxRetries: 3,
            baseDelay: 200,
            userId: userId,
            userAgent: userAgent,
            dynamicConfig: this.dynamicConfig,
          });

          await userRetry.start(async () => {
            await this.db.workout.update({
              where: { id: workoutData.id },
              data: workoutData,
            });
          });

          const encryptionParams =
            await this.dynamicConfig.calculateEncryptionParams(
              userId,
              userAgent,
              "health_critical"
            );

          const encryptedWorkoutData = encryptionParams.shouldEncrypt
            ? this.encryptor.encryptSensitiveData(workoutData)
            : workoutData;

          this.io
            .to(`user_${workoutData.userId}`)
            .emit("workout_updated", encryptedWorkoutData);

          ack({ success: true });
        } catch (err) {
          console.error("Workout update error:", err);
          ack({ success: false, error: err.message });
        }
      });
    });
  }

  async handleAuthentication(socket, data) {
    const { token } = data;

    if (!token) {
      socket.emit("auth_error", {
        message: "Firebase token is required",
        code: "MISSING_TOKEN",
      });
      return;
    }

    try {
      const decoded = await admin.auth().verifyIdToken(token, true); // checkRevoked = true
      const { uid, exp } = decoded;

      const expirationTime = exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;
      const fiveMinutes = 5 * 60 * 1000;

      if (timeUntilExpiration < fiveMinutes) {
        socket.emit("auth_warning", {
          message: "Token expires soon",
          expiresIn: timeUntilExpiration,
          code: "TOKEN_EXPIRING",
        });
      }

      const user = await this.db.user.findUnique({
        where: { firebaseUid: uid },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          lastLogin: true,
          hasCompletedOnboarding: true,
        },
      });

      if (!user) {
        socket.emit("auth_error", {
          message: "User not found in database",
          code: "USER_NOT_FOUND",
        });
        return;
      }

      if (!user.hasCompletedOnboarding) {
        socket.emit("auth_error", {
          message: "User onboarding not completed",
          code: "ONBOARDING_INCOMPLETE",
        });
        return;
      }

      await this.db.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

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
        tokenExpiresIn: timeUntilExpiration,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          lastLogin: user.lastLogin,
        },
      });
    } catch (error) {
      console.error("WebSocket authentication error:", error);

      let errorCode = "AUTH_FAILED";
      let errorMessage = "Authentication failed";

      if (error.code === "auth/id-token-expired") {
        errorCode = "TOKEN_EXPIRED";
        errorMessage = "Token has expired, please refresh";
      } else if (error.code === "auth/id-token-revoked") {
        errorCode = "TOKEN_REVOKED";
        errorMessage = "Token has been revoked, please sign in again";
      } else if (error.code === "auth/invalid-id-token") {
        errorCode = "TOKEN_INVALID";
        errorMessage = "Invalid token format";
      }

      socket.emit("auth_error", {
        message: errorMessage,
        code: errorCode,
        error: error.message,
      });
    }
  }

  async handleDisconnection(socket) {
    const userId = this.socketUsers.get(socket.id);

    if (userId) {
      try {
        await this.db.user.update({
          where: { id: userId },
          data: { lastLogin: new Date() },
        });

        const userSocketList = this.userSockets.get(userId);
        if (userSocketList) {
          const index = userSocketList.indexOf(socket.id);
          if (index > -1) {
            userSocketList.splice(index, 1);
          }

          if (userSocketList.length === 0) {
            this.userSockets.delete(userId);
            console.log(
              `User ${userId} fully disconnected - all devices offline`
            );

            this.io.emit("user_offline", { userId, timestamp: new Date() });
          } else {
            console.log(
              `User ${userId} still has ${userSocketList.length} active connection(s)`
            );
          }
        }

        socket.leave(`user_${userId}`);

        this.socketUsers.delete(socket.id);

        console.log(`Socket ${socket.id} disconnected for user ${userId}`);
      } catch (error) {
        console.error(
          `Error during disconnect cleanup for user ${userId}:`,
          error
        );

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
        socket.leave(`user_${userId}`);
        this.socketUsers.delete(socket.id);
      }
    } else {
      console.log(`Socket ${socket.id} disconnected (no associated user)`);
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

  async forceDisconnectUser(userId) {
    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      const socketsCopy = [...userSockets]; // this copy is to avoid modification during iteration

      for (const socketId of socketsCopy) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit("force_disconnect", {
            reason: "Administrative disconnect",
            timestamp: new Date(),
          });
          socket.disconnect(true);
        }
      }

      console.log(
        `Force disconnected user ${userId} from ${socketsCopy.length} socket(s)`
      );
      return true;
    }
    return false;
  }

  cleanupOrphanedConnections() {
    let cleanedCount = 0;

    // Check each socket in our mapping
    for (const [socketId, userId] of this.socketUsers.entries()) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (!socket) {
        this.socketUsers.delete(socketId);

        const userSocketList = this.userSockets.get(userId);
        if (userSocketList) {
          const index = userSocketList.indexOf(socketId);
          if (index > -1) {
            userSocketList.splice(index, 1);
          }
          if (userSocketList.length === 0) {
            this.userSockets.delete(userId);
          }
        }

        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} orphaned connection(s)`);
    }

    return cleanedCount;
  }

  async gracefulShutdown() {
    console.log("Starting graceful WebSocket shutdown...");

    const connectedUserIds = Array.from(this.userSockets.keys());

    this.io.emit("server_shutdown", {
      message:
        "Server is shutting down. You will be automatically reconnected.",
      timestamp: new Date(),
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    this.io.disconnectSockets(true);

    this.userSockets.clear();
    this.socketUsers.clear();

    console.log(`Gracefully disconnected ${connectedUserIds.length} user(s)`);

    await this.db.$disconnect();

    console.log("WebSocket service shutdown complete");
  }

  getRetryMetrics() {
    return this.dbRetry.getMetrics();
  }

  getEncryptionMetrics() {
    return this.encryptor.getMetrics();
  }

  getAllMetrics() {
    return {
      retry: this.dbRetry.getMetrics(),
      encryption: this.encryptor.getMetrics(),
    };
  }

  getDynamicMetrics() {
    return {
      retry: this.dbRetry.getMetrics(),
      encryption: this.encryptor.getMetrics(),
      dynamicConfig: {
        cacheSize: this.dynamicConfig.contextCache.size,
        configVersion: "1.0",
      },
    };
  }

  setupCacheCleanup() {
    setInterval(() => {
      this.dynamicConfig.cleanupCache();
    }, 10 * 60 * 1000); // Every 10 minutes
  }
}

module.exports = new WebSocketService();
