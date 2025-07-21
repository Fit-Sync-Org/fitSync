const express = require("express");
const webSocketService = require("../services/webSocketService");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.get("/status", requireAuth, (req, res) => {
  try {
    const status = webSocketService.getConnectionStatus();
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      status,
    });
  } catch (error) {
    console.error("Error getting WebSocket status:", error);
    res.status(500).json({
      error: "Failed to get WebSocket status",
      message: error.message,
    });
  }
});

router.get("/my-connection", requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const isConnected = webSocketService.isUserConnected(userId);
    const connections = webSocketService.getUserConnections(userId);

    res.json({
      success: true,
      userId,
      isConnected,
      connectionCount: connections.length,
      socketIds: connections,
    });
  } catch (error) {
    console.error("Error checking user connection:", error);
    res.status(500).json({
      error: "Failed to check connection status",
      message: error.message,
    });
  }
});

module.exports = router;
