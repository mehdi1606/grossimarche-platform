import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';

import '../api/api_client.dart';

/// Push notifications, as the rest of the app sees them.
///
/// An interface on purpose - rule 4 of the mobile strategy. Nothing outside this folder
/// imports Firebase. Today the only implementation is [DisabledPushService], because the
/// Firebase project does not exist yet; turning push on is one new class here, not an edit
/// across every screen that cares about orders.
///
/// To enable it:
///   1. create the Firebase project and run `flutterfire configure` in mobile/
///      (it writes lib/firebase_options.dart and the platform config files);
///   2. add firebase_core and firebase_messaging;
///   3. write FirebasePushService implementing this, using [DeviceRegistry] to hand the
///      token to the server and calling the `onOpenOrder` callback when a notification is
///      tapped with data `{type: order, orderId: ...}`;
///   4. return it from pushServiceProvider instead of the disabled one.
abstract class PushService {
  /// Start once somebody is signed in: ask permission, register this device, route taps.
  ///
  /// The server sends `{type: order, orderId}` when an order moves and `{type: offer, slug}`
  /// when a basket is announced; each maps to one of these callbacks.
  Future<void> start({
    required void Function(String orderId) onOpenOrder,
    required void Function(String slug) onOpenOffer,
  });

  /// Stop at sign-out, and tell the server to forget this device - a shop phone changes
  /// hands, and the previous account must stop receiving the next one's orders.
  Future<void> stop();
}

/// What runs until Firebase is configured: nothing is registered, nothing arrives.
///
/// It says so once in the debug log rather than staying silent - a feature that does nothing
/// without a word is how a week disappears looking for the wrong bug.
class DisabledPushService implements PushService {
  bool _announced = false;

  @override
  Future<void> start({
    required void Function(String orderId) onOpenOrder,
    required void Function(String slug) onOpenOffer,
  }) async {
    if (!_announced) {
      _announced = true;
      debugPrint(
        '[push] Firebase is not configured yet; notifications are disabled. '
        'See core/notifications/push_service.dart to enable them.',
      );
    }
  }

  @override
  Future<void> stop() async {}
}

/// Tells the server which device to notify. Ready for the Firebase implementation to use.
class DeviceRegistry {
  DeviceRegistry(this._api);

  final ApiClient _api;

  String get _platform => kIsWeb ? 'WEB' : (Platform.isIOS ? 'IOS' : 'ANDROID');

  /// Called at every start, not once: the token rotates on its own after a reinstall or a
  /// restored backup, and a device that stops re-registering simply stops hearing anything.
  Future<void> register(String token) async {
    try {
      await _api.dio.post<void>(
        '/me/devices',
        data: {'token': token, 'platform': _platform},
      );
    } catch (_) {
      // A failed registration costs this session's notifications, never the session itself.
    }
  }

  Future<void> forget(String token) async {
    try {
      await _api.dio.delete<void>(
        '/me/devices',
        data: {'token': token, 'platform': _platform},
      );
    } catch (_) {}
  }
}
