import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/auth/data/auth_repository.dart';
import 'api/api_client.dart';
import 'api/token_store.dart';
import 'notifications/push_service.dart';

/// Where the app's single instances are declared.
///
/// One file rather than a provider beside every class: there are few of them, and a reader
/// asking "what talks to the network here" should find the answer in one place.

final tokenStoreProvider = Provider<TokenStore>((ref) => TokenStore());

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(
    tokens: ref.watch(tokenStoreProvider),
    // A refresh that fails means the session is over. Flipping this is what moves the app
    // back to the sign-in screen, wherever the user happened to be.
    onSignedOut: () async =>
        ref.read(sessionProvider.notifier).set(const Session.none()),
  );
});

/// The one line that changes when push is switched on - see push_service.dart.
final pushServiceProvider = Provider<PushService>(
  (ref) => DisabledPushService(),
);

final deviceRegistryProvider = Provider<DeviceRegistry>(
  (ref) => DeviceRegistry(ref.watch(apiClientProvider)),
);

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(
    api: ref.watch(apiClientProvider),
    tokens: ref.watch(tokenStoreProvider),
  ),
);

/// Whether somebody is signed in, and who.
///
/// `unknown` is a real state, not a detail: at start-up the secure store has not been read
/// yet, and showing the sign-in screen during that moment would flash it at every launch for
/// a customer who is perfectly signed in.
class Session {
  const Session._(this.status, this.user);

  const Session.none() : this._(SessionStatus.signedOut, null);
  const Session.unknown() : this._(SessionStatus.unknown, null);
  const Session.of(SignedInUser user) : this._(SessionStatus.signedIn, user);

  final SessionStatus status;
  final SignedInUser? user;
}

enum SessionStatus { unknown, signedOut, signedIn }

/// Riverpod 3 dropped `StateProvider`, and a Notifier is the better shape anyway: the only
/// way to change the session is this one method, so there is a single place to look when
/// asking how somebody ended up signed out.
class SessionNotifier extends Notifier<Session> {
  @override
  Session build() => const Session.unknown();

  void set(Session session) => state = session;
}

final sessionProvider = NotifierProvider<SessionNotifier, Session>(
  SessionNotifier.new,
);

/// Who the data belongs to.
///
/// Every provider holding one customer's data - cart, orders, addresses, profile, and the
/// catalogue too, since its prices depend on the account's trade - watches this. When the
/// account changes, they are all rebuilt. Without it, a shop phone signed out by one
/// customer and into by another showed the second one the first one's cart, orders and
/// prices until each screen happened to reload.
final accountKeyProvider = Provider<String?>(
  (ref) => ref.watch(sessionProvider.select((s) => s.user?.id)),
);
