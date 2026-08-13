// The storefront no longer pushes notifications itself: back-office notifications (new order,
// low stock, …) are created server-side by the backend event listeners when an order is
// placed or stock changes. This stub stays as a no-op so nothing calls a non-existent endpoint.
const NotificationServices = {
  addNotification: async () => ({ ok: true }),
};

export default NotificationServices;
