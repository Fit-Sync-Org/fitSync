import { io } from "socket.io-client";
import { auth } from "../firebase";

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.userId = null;
    this.user = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.tokenRefreshTimeout = null;
  }

  async connect() {
    if (this.socket && this.isConnected) {
      console.log("WebSocket already connected");
      return;
    }

    if (!auth.currentUser) {
      console.error("No authenticated Firebase user found");
      return;
    }

    this.socket = io(import.meta.env.VITE_API_URL || "http://localhost:3001", {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 20000,
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("WebSocket connected:", this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;

      this.authenticate();
    });

    this.socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
      this.isConnected = false;

      if (reason === "io server disconnect") {
        this.socket.connect();
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      this.isConnected = false;
      this.reconnectAttempts++;

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
        console.log(
          `Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms`
        );
      }
    });

    this.socket.on("authenticated", (data) => {
      console.log("WebSocket authenticated:", data);
      this.userId = data.userId;
      this.user = data.user;

      if (data.tokenExpiresIn) {
        this.scheduleTokenRefresh(data.tokenExpiresIn);
      }
    });

    this.socket.on("auth_error", (error) => {
      console.error("WebSocket authentication error:", error);
      this.handleAuthError(error);
    });

    this.socket.on("auth_warning", (warning) => {
      console.warn("WebSocket authentication warning:", warning);
      if (warning.code === "TOKEN_EXPIRING") {
        this.refreshAuthentication();
      }
    });

    this.socket.on("pong", (data) => {
      console.log("Received pong:", data);
    });

    this.socket.on("meal_updated", (mealData) => {
      console.log("Received meal update:", mealData);
      this.handleMealUpdate(mealData);
    });

    this.socket.on("workout_updated", (workoutData) => {
      console.log("Received workout update:", workoutData);
      this.handleWorkoutUpdate(workoutData);
    });

    this.socket.on("force_disconnect", (data) => {
      console.warn("Forced disconnect from server:", data);
      if (window.showNotification) {
        window.showNotification(
          "Connection terminated by server: " + data.reason,
          "warning"
        );
      }
      this.disconnect();
    });

    this.socket.on("server_shutdown", (data) => {
      console.warn("Server shutting down:", data);
      if (window.showNotification) {
        window.showNotification(data.message, "info");
      }
    });

    this.socket.on("user_offline", (data) => {
      console.log("User went offline:", data);
      // This might be used for presence indicators in the UI
      // Just logging it for now
    });
  }

  async authenticate() {
    if (this.socket && auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken(true);
        this.socket.emit("authenticate", { token });
      } catch (error) {
        console.error(
          "Failed to get Firebase token for WebSocket auth:",
          error
        );
        this.handleAuthError({
          code: "TOKEN_FETCH_FAILED",
          message: "Failed to get authentication token",
          error: error.message,
        });
      }
    }
  }

  async refreshAuthentication() {
    if (this.socket && auth.currentUser) {
      try {
        console.log("Refreshing WebSocket authentication...");
        const token = await auth.currentUser.getIdToken(true);
        this.socket.emit("reauthenticate", { token });
      } catch (error) {
        console.error("Failed to refresh WebSocket authentication:", error);
        this.handleAuthError({
          code: "TOKEN_REFRESH_FAILED",
          message: "Failed to refresh authentication token",
          error: error.message,
        });
      }
    }
  }

  scheduleTokenRefresh(expiresIn) {
    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
    }

    const refreshTime = Math.max(expiresIn - 2 * 60 * 1000, 30000);

    this.tokenRefreshTimeout = setTimeout(() => {
      console.log("Scheduled token refresh triggered");
      this.refreshAuthentication();
    }, refreshTime);
  }

  handleAuthError(error) {
    console.error("WebSocket auth error:", error);

    switch (error.code) {
      case "TOKEN_EXPIRED":
      case "TOKEN_REVOKED":
        this.refreshAuthentication();
        break;

      case "ONBOARDING_INCOMPLETE":
        if (typeof window !== "undefined") {
          window.location.href = "/OnboardingWizard";
        }
        break;

      case "USER_NOT_FOUND":
        if (typeof window !== "undefined") {
          window.location.href = "/register";
        }
        break;

      default:
        this.disconnect();
        break;
    }
  }

  ping() {
    if (this.socket && this.isConnected) {
      this.socket.emit("ping");
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.userId = null;
      this.user = null;
    }

    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
      this.tokenRefreshTimeout = null;
    }
  }

  handleMealUpdate(mealData) {
    console.log("Default meal update handler:", mealData);
  }

  handleWorkoutUpdate(workoutData) {
    console.log("Default workout update handler:", workoutData);
  }

  onMealUpdate(handler) {
    this.handleMealUpdate = handler;
  }

  onWorkoutUpdate(handler) {
    this.handleWorkoutUpdate = handler;
  }

  isSocketConnected() {
    return this.socket && this.isConnected;
  }

  getSocketId() {
    return this.socket ? this.socket.id : null;
  }

  getCurrentUser() {
    return this.user;
  }

  getCurrentUserId() {
    return this.userId;
  }

  isAuthenticated() {
    return this.isConnected && this.userId && this.user;
  }

  getConnectionHealth() {
    return {
      isConnected: this.isConnected,
      isAuthenticated: this.isAuthenticated(),
      socketId: this.getSocketId(),
      userId: this.userId,
      user: this.user,
      reconnectAttempts: this.reconnectAttempts,
      hasTokenRefresh: !!this.tokenRefreshTimeout,
    };
  }

  cleanup() {
    console.log("Cleaning up WebSocket service...");

    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
      this.tokenRefreshTimeout = null;
    }

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnected = false;
    this.userId = null;
    this.user = null;
    this.reconnectAttempts = 0;

    console.log("WebSocket service cleanup complete");
  }

  setupPageUnloadHandler() {
    const handlePageUnload = () => {
      // Quick disconnect without waiting for cleanup
      if (this.socket && this.isConnected) {
        this.socket.disconnect();
      }
    };

    window.addEventListener("beforeunload", handlePageUnload);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        console.log("Page hidden - WebSocket connection remains active");
      } else if (document.visibilityState === "visible") {
        if (this.socket && !this.isConnected) {
          console.log("Page visible - attempting to reconnect WebSocket");
          this.connect();
        }
      }
    });

    return () => {
      window.removeEventListener("beforeunload", handlePageUnload);
    };
  }
}

const websocketService = new WebSocketService();
export default websocketService;
