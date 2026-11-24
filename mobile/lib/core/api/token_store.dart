import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// The signed-in session, kept in the platform's own secret store: the Android Keystore, the
/// iOS Keychain. Never a plain file and never shared preferences - a refresh token lives
/// thirty days and opens the account.
class TokenStore {
  TokenStore([FlutterSecureStorage? storage])
    : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  static const _accessKey = 'access_token';
  static const _refreshKey = 'refresh_token';

  /// Read on every request rather than cached in a field.
  ///
  /// This is deliberate, and it is the lesson of a bug that cost this project a week: the
  /// back-office WebSocket captured the token once at start-up, the token expired fifteen
  /// minutes later, and the client reconnected with a dead credential every five seconds for
  /// the rest of the session - silently, with nothing in the logs but a reconnect loop.
  Future<String?> readAccess() => _storage.read(key: _accessKey);

  Future<String?> readRefresh() => _storage.read(key: _refreshKey);

  Future<void> save({required String access, required String refresh}) async {
    await _storage.write(key: _accessKey, value: access);
    await _storage.write(key: _refreshKey, value: refresh);
  }

  Future<void> clear() async {
    await _storage.delete(key: _accessKey);
    await _storage.delete(key: _refreshKey);
  }

  Future<bool> get hasSession async => (await readRefresh()) != null;
}
