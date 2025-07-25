const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();
const prisma = new PrismaClient();
const { checkInactivity } = require("../utils/simpleProgressTracking");

router.get("/", async(req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unreadOnly = false, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {
      userId,
      ...(unreadOnly === "true" && { isRead: false }),
      ...(type && { type }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.notification.count({ where: whereClause }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.get("/stats", async(req, res) => {
  try {
    const userId = req.user.id;

    const [unreadCount, totalCount, recentCount] = await Promise.all([
      prisma.notification.count({ where: { userId, isRead: false } }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({
        where: { userId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
    ]);

    const typeStats = await prisma.notification.groupBy({
      by: ["type"],
      where: { userId },
      _count: { type: true },
    });

    res.json({
      unreadCount,
      totalCount,
      recentCount,
      typeStats: typeStats.reduce((acc, stat) => {
        acc[stat.type] = stat._count.type;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error("Get notification stats error:", error);
    res.status(500).json({ error: "Failed to fetch notification stats" });
  }
});

router.patch("/:notificationId/read", async(req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = parseInt(req.params.notificationId);

    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    res.json({
      id: updatedNotification.id,
      isRead: updatedNotification.isRead,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

router.patch("/read-all", async(req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.body;

    const whereClause = {
      userId,
      isRead: false,
      ...(type && { type }),
    };

    const result = await prisma.notification.updateMany({
      where: whereClause,
      data: { isRead: true },
    });

    res.json({
      message: `${result.count} notifications marked as read`,
      updatedCount: result.count,
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    res.status(500).json({ error: "Failed to mark notifications as read" });
  }
});

router.delete("/:notificationId", async(req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = parseInt(req.params.notificationId);

    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    await prisma.notification.delete({ where: { id: notificationId } });

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

router.delete("/cleanup/old", async(req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const result = await prisma.notification.deleteMany({
      where: {
        userId,
        createdAt: { lt: cutoffDate },
        isRead: true,
      },
    });

    res.json({
      message: `Cleaned up ${result.count} old notifications`,
      deletedCount: result.count,
      cutoffDate: cutoffDate.toISOString(),
    });
  } catch (error) {
    console.error("Cleanup notifications error:", error);
    res.status(500).json({ error: "Failed to cleanup notifications" });
  }
});

router.get("/progress-alerts", async(req, res) => {
  try {
    const userId = req.user.id;
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const progressAlerts = await prisma.notification.findMany({
      where: {
        userId,
        type: "PROGRESS_ALERT",
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      alerts: progressAlerts,
      count: progressAlerts.length,
      period: `${days} days`,
    });
  } catch (error) {
    console.error("Get progress alerts error:", error);
    res.status(500).json({ error: "Failed to fetch progress alerts" });
  }
});

router.post("/test", async(req, res) => {
  try {
    const userId = req.user.id;
    const { type = "MILESTONE", title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: "Title and message are required" });
    }

    const notification = await prisma.notification.create({
      data: { userId, type, title, message, isRead: false },
    });

    res.status(201).json({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      createdAt: notification.createdAt,
    });
  } catch (error) {
    console.error("Create test notification error:", error);
    res.status(500).json({ error: "Failed to create test notification" });
  }
});

router.post("/check-inactivity", async(req, res) => {
  await checkInactivity();
  res.json({ success: true });
});

const webSocketService = require("../services/webSocketService");

router.get("/websocket/status", (req, res) => {
  try {
    const status = webSocketService.getConnectionStatus();
    res.json({
      success: true,
      ...status,
      timestamp: new Date()
    });
  } catch (error) {
    console.error("WebSocket status error:", error);
    res.status(500).json({ error: "Failed to get WebSocket status" });
  }
});

router.get("/websocket/my-connection", (req, res) => {
  try {
    const userId = req.user.id;
    const connections = webSocketService.getUserConnections(userId);
    const isConnected = webSocketService.isUserConnected(userId);

    res.json({
      success: true,
      userId,
      isConnected,
      connectionCount: connections.length,
      socketIds: connections,
      timestamp: new Date()
    });
  } catch (error) {
    console.error("WebSocket user connection error:", error);
    res.status(500).json({ error: "Failed to get connection info" });
  }
});

router.post("/websocket/cleanup", (req, res) => {
  try {
    const cleanedCount = webSocketService.cleanupOrphanedConnections();
    res.json({
      success: true,
      cleanedConnections: cleanedCount,
      message: `Cleaned up ${cleanedCount} orphaned connection(s)`,
      timestamp: new Date()
    });
  } catch (error) {
    console.error("WebSocket cleanup error:", error);
    res.status(500).json({ error: "Failed to cleanup connections" });
  }
});

router.post("/websocket/disconnect/:userId", async(req, res) => {
  try {
    const { userId } = req.params;
    const { reason = "Administrative disconnect" } = req.body;

    const success = await webSocketService.forceDisconnectUser(userId);

    if (success) {
      res.json({
        success: true,
        message: `User ${userId} has been disconnected`,
        reason,
        timestamp: new Date()
      });
    } else {
      res.status(404).json({
        success: false,
        error: `User ${userId} is not currently connected`
      });
    }
  } catch (error) {
    console.error("WebSocket force disconnect error:", error);
    res.status(500).json({ error: "Failed to disconnect user" });
  }
});


module.exports = router;
