package com.grossimarche.integration.push;

import java.util.List;
import java.util.Map;

/**
 * Delivers a notification to a set of devices.
 *
 * Two implementations, chosen by configuration exactly as the OTP senders are: one that talks
 * to Firebase, one that only writes to the log. The second is what runs on a machine with no
 * Firebase credentials, so a developer can work on the rest of the platform without a Google
 * project, and an announcement never fails because push is not set up.
 */
public interface PushSender {

    /**
     * Send one message to many devices.
     *
     * @param tokens the devices to reach; an empty list is a no-op
     * @param data   what the app reads to decide where to open - an order id, an offer slug.
     *               Values must be strings: Firebase carries nothing else.
     * @return the tokens the service refused as unregistered, for the caller to delete. Never
     *         null; a failure to reach the service at all returns empty, because a network
     *         problem is not evidence that a device is gone.
     */
    List<String> send(List<String> tokens, String title, String body, Map<String, String> data);
}
