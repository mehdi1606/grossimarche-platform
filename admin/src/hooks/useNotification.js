import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const TOPIC = "/topic/admin/notifications";
// Remembered across sessions so muting the chime is a decision, not something to redo daily.
const SOUND_PREF_KEY = "gm_notification_sound";

/**
 * A short two-tone chime, synthesised with the Web Audio API rather than shipped as an audio
 * file: no asset to load, no format to worry about, and nothing to 404 behind the gateway.
 *
 * Browsers block audio until the page has been interacted with. That is exactly right here -
 * a back-office that nobody has clicked is a back-office nobody is watching - so a blocked
 * play is ignored rather than reported.
 */
export const playNotificationChime = async () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // A context created before the page has been interacted with starts suspended. Ask for it
    // to resume rather than giving up: after the first click anywhere the browser allows it,
    // and until then the rejection is simply ignored.
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        ctx.close().catch(() => {});
        return;
      }
    }

    const now = ctx.currentTime;
    const gain = ctx.createGain();
    // Short attack, quick decay: audible without being an alarm.
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.14, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    gain.connect(ctx.destination);

    [880, 1174.7].forEach((frequency, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, now + i * 0.12);
      osc.connect(gain);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.3);
    });

    // Release the context once the sound is done; one per notification would otherwise pile
    // up against the browser's hard limit on concurrent AudioContexts.
    setTimeout(() => ctx.close().catch(() => {}), 800);
  } catch {
    // Audio is a nicety; never let it break the feed.
  }
};

export const isNotificationSoundEnabled = () => {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(SOUND_PREF_KEY) !== "off";
};

export const setNotificationSoundEnabled = (enabled) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SOUND_PREF_KEY, enabled ? "on" : "off");
};

/**
 * Live back-office notifications. The backend already pushes every NEW_ORDER / LOW_STOCK
 * event on the STOMP topic above (NotificationService.record); until now nothing listened,
 * so the bell only updated on a page reload.
 *
 * `updated` flips to true on each push - the header re-fetches the list and the unread count
 * from that flag, so the transport stays out of the rendering logic. The subscription needs
 * the JWT: the WebSocket interceptor authenticates the CONNECT frame and only lets
 * ADMIN/STORE_MANAGER subscribe to this topic.
 *
 * Each push also rings a short chime, because a badge changing colour in a tab nobody is
 * looking at is not a notification. It can be muted from the notification panel.
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
        client.subscribe(TOPIC, () => {
          setUpdated(true);
          if (isNotificationSoundEnabled()) playNotificationChime();
        });
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
