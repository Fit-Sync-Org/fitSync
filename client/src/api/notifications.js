import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL;
axios.defaults.withCredentials = true;

export const notificationsAPI = {
  async getNotifications(page = 1, limit = 10) {
    try {
      const response = await axios.get(`${API_BASE}/api/notifications`, {
        params: { page, limit }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch notifications"
      };
    }
  },

  async markAsRead(notificationId) {
    try {
      const response = await axios.patch(`${API_BASE}/api/notifications/${notificationId}/read`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to mark notification as read"
      };
    }
  },

  async markAllAsRead() {
    try {
      const response = await axios.patch(`${API_BASE}/api/notifications/mark-all-read`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to mark all notifications as read"
      };
    }
  },

  async deleteNotification(notificationId) {
    try {
      const response = await axios.delete(`${API_BASE}/api/notifications/${notificationId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to delete notification"
      };
    }
  }
};
