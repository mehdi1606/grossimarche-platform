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

    // Start a hair in the future: scheduling at exactly currentTime lets the first
    // milliseconds fall in the past on a busy tab, which clips the attack off the note.
    const start = ctx.currentTime + 0.02;

    // One envelope per note. Both notes used to share a single gain that decayed from the
    // first one's attack, so by the time the second started the envelope was almost closed -
    // the chime came out as one faint blip, or nothing at all on a quiet machine.
    [880, 1174.7].forEach((frequency, i) => {
      const at = start + i * 0.16;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.3, at + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.28);
      gain.connect(ctx.destination);

      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, at);
      osc.connect(gain);
      osc.start(at);
      osc.stop(at + 0.3);
    });

    // Release the context once the sound is done; one per notification would otherwise pile
    // up against the browser's hard limit on concurrent AudioContexts.
    setTimeout(() => ctx.close().catch(() => {}), 900);
  } catch {
    // Audio is a nicety; never let it break the feed.
  }
};

/**
 * Ask the browser for permission to raise desktop notifications.
 *
 * Called from a click, because Chrome ignores a permission prompt that no gesture asked for.
 * Returns whether notifications can now be shown.
 */
export const ensureDesktopNotifications = async () => {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
};

/**
 * Raise a desktop notification - the system's own toast, with the system's own sound.
 *
 * The chime alone is not enough for a back-office: it needs the tab open, in a window that
 * has been clicked, and someone within earshot of a browser that may be muted per-application
 * in the Windows mixer. A desktop notification goes through the operating system instead, so
 * it arrives while the admin is in another window entirely - which is the whole point of
 * being told a new order came in.
 */
export const showDesktopNotification = (title, body) => {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    // `tag` collapses a burst into one toast rather than stacking five.
    const note = new Notification(title || "Market Food", {
      body: body || "",
      icon: "/admin/favicon.png",
      tag: "gm-notification",
      renotify: true,
    });
    note.onclick = () => {
      window.focus();
      note.close();
    };
  } catch {
    // A refused or unsupported notification must never break the feed.
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
    /**
     * The access token as it stands *now*.
     *
     * Read on every connection attempt, never captured once: the token lives 15 minutes, the
     * HTTP layer silently renews it in this same cookie, and a socket that pinned the first
     * one kept retrying with a dead token for the rest of the session. It reconnected every
     * five seconds, was refused every time, and not one live notification got through - with
     * no symptom beyond silence.
     */
    const currentToken = () => {
      const cookie = Cookies.get("adminInfo");
      if (!cookie) return null;
      try {
        return JSON.parse(cookie)?.token || null;
      } catch {
        return null;
      }
    };

    if (!currentToken()) return undefined;

    let warned = false;
    const client = new Client({
      // The gateway serves the backend at the same origin, so a relative path is enough and
      // the socket follows whatever host the back-office is opened on.
      webSocketFactory: () => new SockJS("/ws"),
      // Re-read before each attempt, including every automatic retry.
      beforeConnect: () => {
        const token = currentToken();
        client.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(TOPIC, (frame) => {
          setUpdated(true);
          if (!isNotificationSoundEnabled()) return;

          playNotificationChime();

          // Two channels on purpose: the chime only reaches someone looking at this tab, the
          // desktop notification reaches them anywhere. Whichever the machine allows, one of
          // them gets through.
          let payload = {};
          try {
            payload = JSON.parse(frame.body) || {};
          } catch {
            // A body we cannot read is still worth announcing, just without its wording.
          }
          showDesktopNotification(payload.title, payload.message);
        });
      },
      // Reported once, not on every retry: swallowing these entirely is what hid a broker
      // refusing every subscription behind a reconnect loop, with no symptom but silence.
      onStompError: (frame) => {
        if (warned) return;
        warned = true;
        console.warn(
          "[notifications] le serveur a refusé la connexion temps réel :",
          frame?.headers?.message || frame?.body || "raison inconnue"
        );
      },
      onWebSocketError: () => {
        if (warned) return;
        warned = true;
        console.warn("[notifications] le canal temps réel est injoignable.");
      },
    });

    client.activate();
    return () => {
      client.deactivate();
    };
  }, []);

  return { updated, setUpdated };
};

export default useNotification;
