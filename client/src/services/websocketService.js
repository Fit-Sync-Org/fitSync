import { io } from "socket.io-client";
import { auth } from "../firebase";

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.userId = null;
    this.user = null;

    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.baseReconnectDelay = 1000;
    this.maxReconnectDelay = 30000;
    this.currentReconnectDelay = 1000;
    this.tokenRefreshTimeout = null;

    this.connectionQuality = "good";
    this.lastConnectionTime = null;
    this.connectionAttemptHistory = [];
    this.networkChangeDetection = true;
    this.reconnectTimeout = null;
    this.healthCheckInterval = null;
    this.lastPongTime = null;
    this.isManualDisconnect = false;

    this.connectionMetrics = {
      successfulConnections: 0,
      failedConnections: 0,
      avgConnectionTime: 0,
      lastDisconnectReason: null,
    };
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

    this.socket.on("pong", (data) => {
      this.lastPongTime = Date.now();
      console.log("Received pong - connection healthy");
    });
  }

  handleSmartReconnection(reason, error = null) {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;

    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached. Giving up.");
      this.updateConnectionQuality("failed");
      return;
    }

    const delay = this.calculateReconnectionDelay(reason);

    console.log(
      `Smart reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms (reason: ${reason})`
    );

    this.reconnectTimeout = setTimeout(() => {
      this.attemptReconnection();
    }, delay);
  }

  // Calculate intelligent reconnection delay
  calculateReconnectionDelay(reason) {
    let baseDelay = this.baseReconnectDelay;

    switch (reason) {
      case "transport close":
      case "transport error":
        baseDelay = Math.min(
          baseDelay * Math.pow(2, this.reconnectAttempts),
          this.maxReconnectDelay
        );
        break;
      case "io server disconnect":
        baseDelay = Math.min(baseDelay * 1.5, 10000);
        break;
      case "connect_error":
        baseDelay = Math.min(
          baseDelay * Math.pow(1.8, this.reconnectAttempts),
          this.maxReconnectDelay
        );
        break;
      default:
        baseDelay = Math.min(
          baseDelay * Math.pow(2, this.reconnectAttempts),
          this.maxReconnectDelay
        );
    }

    const jitter = Math.random() * 1000;
    return baseDelay + jitter;
  }

  async attemptReconnection() {
    console.log("Attempting smart reconnection...");

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnected = false;

    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      await this.connect();
    } catch (error) {
      console.error("Reconnection attempt failed:", error);
      this.handleSmartReconnection("reconnection_failed", error);
    }
  }

  resetReconnectionState() {
    this.reconnectAttempts = 0;
    this.currentReconnectDelay = this.baseReconnectDelay;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  updateConnectionQuality(event, details = null) {
    this.connectionAttemptHistory.push({
      event,
      details,
      timestamp: Date.now(),
    });

    if (this.connectionAttemptHistory.length > 20) {
      this.connectionAttemptHistory.shift();
    }

    const recentEvents = this.connectionAttemptHistory.slice(-10);
    const failureRate =
      recentEvents.filter(
        (e) => e.event === "error" || e.event === "disconnect"
      ).length / recentEvents.length;

    if (failureRate > 0.7) {
      this.connectionQuality = "poor";
    } else if (failureRate > 0.4) {
      this.connectionQuality = "unstable";
    } else {
      this.connectionQuality = "good";
    }

    console.log(
      `Connection quality updated to: ${
        this.connectionQuality
      } (failure rate: ${Math.round(failureRate * 100)}%)`
    );
  }

  updateAvgConnectionTime(newTime) {
    const count = this.connectionMetrics.successfulConnections;
    this.connectionMetrics.avgConnectionTime =
      (this.connectionMetrics.avgConnectionTime * (count - 1) + newTime) /
      count;
  }

  setupNetworkChangeDetection() {
    if (!this.networkChangeDetection || typeof window === "undefined") return;

    window.addEventListener("online", () => {
      console.log("Network came back online - attempting reconnection");
      if (!this.isConnected && !this.isManualDisconnect) {
        this.reconnectAttempts = 0;
        this.attemptReconnection();
      }
    });

    window.addEventListener("offline", () => {
      console.log("Network went offline");
      this.updateConnectionQuality("network_offline");
    });

    document.addEventListener("visibilitychange", () => {
      if (
        document.visibilityState === "visible" &&
        this.socket &&
        !this.isConnected
      ) {
        console.log("Tab became visible - checking connection status");
        this.checkConnectionHealth();
      }
    });
  }

  startHealthCheck() {
    // Clear existing interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(() => {
      if (this.socket && this.isConnected) {
        this.socket.emit("ping", { timestamp: Date.now() });

        if (this.lastPongTime && Date.now() - this.lastPongTime > 60000) {
          console.warn(
            "Connection appears unhealthy - no pong received in 60s"
          );
          this.updateConnectionQuality("health_check_failed");

          if (Date.now() - this.lastPongTime > 120000) {
            console.error("Connection is dead - forcing reconnection");
            this.handleSmartReconnection("health_check_timeout");
          }
        }
      }
    }, 30000);
  }

  async checkConnectionHealth() {
    if (!this.socket || !this.isConnected) {
      console.log("Connection health check: Not connected");
      return false;
    }

    try {
      // Send ping and wait for pong
      const pingTime = Date.now();
      this.socket.emit("ping", { timestamp: pingTime });

      // Wait for pong response (with timeout)
      const pongReceived = await new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(false), 5000);

        const pongHandler = () => {
          clearTimeout(timeout);
          this.socket.off("pong", pongHandler);
          resolve(true);
        };

        this.socket.once("pong", pongHandler);
      });

      if (pongReceived) {
        console.log("Connection health check: Healthy");
        return true;
      } else {
        console.warn("Connection health check: No pong received");
        this.updateConnectionQuality("health_check_failed");
        return false;
      }
    } catch (error) {
      console.error("Connection health check failed:", error);
      return false;
    }
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

        if (typeof window !== "undefined" && !window.location.pathname.includes("OnboardingWizard")) {
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
    console.log("Manual disconnect initiated");
    this.isManualDisconnect = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

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

    console.log("WebSocket manually disconnected");
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
      connectionQuality: this.connectionQuality,
      lastPongTime: this.lastPongTime,
      connectionMetrics: this.connectionMetrics,
      isManualDisconnect: this.isManualDisconnect,
    };
  }

  getConnectionMetrics() {
    return {
      ...this.connectionMetrics,
      connectionQuality: this.connectionQuality,
      recentHistory: this.connectionAttemptHistory.slice(-5),
      currentReconnectDelay: this.currentReconnectDelay,
      timeSinceLastPong: this.lastPongTime
        ? Date.now() - this.lastPongTime
        : null,
      hasActiveReconnectTimeout: !!this.reconnectTimeout,
      hasActiveHealthCheck: !!this.healthCheckInterval,
    };
  }

  resetConnectionQuality() {
    this.connectionQuality = "good";
    this.connectionAttemptHistory = [];
    this.connectionMetrics = {
      successfulConnections: 0,
      failedConnections: 0,
      avgConnectionTime: 0,
      lastDisconnectReason: null,
    };
    console.log("Connection quality and metrics reset");
  }

  async forceReconnect() {
    console.log("Force reconnection requested");
    this.isManualDisconnect = false;
    this.reconnectAttempts = 0;

    if (this.socket && this.isConnected) {
      this.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    await this.connect();
  }

  cleanup() {
    console.log("Cleaning up WebSocket service...");

    this.isManualDisconnect = true;

    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
      this.tokenRefreshTimeout = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
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
    this.connectionQuality = "good";
    this.connectionAttemptHistory = [];

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
