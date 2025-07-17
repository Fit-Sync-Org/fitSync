import { io } from "socket.io-client";

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.userId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
  }

  connect(userId) {
    if (this.socket && this.isConnected) {
      console.log("WebSocket already connected");
      return;
    }

    this.userId = userId;

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
    });

    this.socket.on("auth_error", (error) => {
      console.error("WebSocket authentication error:", error);
    });

    this.socket.on("meal_updated", (mealData) => {
      console.log("Received meal update:", mealData);
      this.handleMealUpdate(mealData);
    });

    this.socket.on("workout_updated", (workoutData) => {
      console.log("Received workout update:", workoutData);
      this.handleWorkoutUpdate(workoutData);
    });
  }

  authenticate() {
    if (this.socket && this.userId) {
      this.socket.emit("authenticate", { userId: this.userId });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.userId = null;
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
}

// Create a singleton instance
const websocketService = new WebSocketService();
export default websocketService;
