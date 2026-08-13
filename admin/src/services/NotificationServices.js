import requests from "./httpService";
import { adaptNotification } from "./adapters";

// Back-office notification feed (backend /admin/notifications). Open to STORE_MANAGER + ADMIN.
const NotificationServices = {
  getAllNotifications: async (page = 0, size = 20) => {
    const res = await requests.get(
      `/admin/notifications?page=${page}&size=${size}`
    );
    return {
      notifications: (res.content || []).map(adaptNotification),
      totalDoc: res.totalElements ?? 0,
      totalUnreadDoc: undefined,
    };
  },

  getUnreadCount: async () => {
    const res = await requests.get("/admin/notifications/unread-count");
    return res?.count ?? 0;
  },

  updateStatusNotification: async (id) =>
    requests.patch(`/admin/notifications/${id}/read`, {}),

  markAllRead: async () => requests.patch("/admin/notifications/read-all", {}),

  deleteNotification: async (id) => requests.delete(`/admin/notifications/${id}`),
};

export default NotificationServices;
