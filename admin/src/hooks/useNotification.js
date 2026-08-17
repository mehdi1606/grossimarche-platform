import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const TOPIC = "/topic/admin/notifications";

/**
 * Live back-office notifications. The backend already pushes every NEW_ORDER / LOW_STOCK
 * event on the STOMP topic above (NotificationService.record); until now nothing listened,
 * so the bell only updated on a page reload.
 *
 * `updated` flips to true on each push — the header re-fetches the list and the unread count
 * from that flag, so the transport stays out of the rendering logic. The subscription needs
 * the JWT: the WebSocket interceptor authenticates the CONNECT frame and only lets
 * ADMIN/STORE_MANAGER subscribe to this topic.
 */
const useNotification = () => {
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    const cookie = Cookies.get("adminInfo");
    if (!cookie) return undefined;

    let token;
    try {
      token = JSON.parse(cookie)?.token;
    } catch {
      return undefined;
    }
    if (!token) return undefined;

    const client = new Client({
      // The gateway serves the backend at the same origin, so a relative path is enough and
      // the socket follows whatever host the back-office is opened on.
      webSocketFactory: () => new SockJS("/ws"),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(TOPIC, () => setUpdated(true));
      },
      // Silent by default: a dropped socket must never spam the console of a live back-office.
      onStompError: () => {},
      onWebSocketError: () => {},
    });

    client.activate();
    return () => {
      client.deactivate();
    };
  }, []);

  return { updated, setUpdated };
};

export default useNotification;
