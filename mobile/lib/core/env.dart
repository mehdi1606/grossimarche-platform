/// Where this build talks to.
///
/// Passed at build time with `--dart-define=API_BASE_URL=...` rather than written in the
/// source, so the same code ships to a phone on the shop's wifi and to the Play Store without
/// an edit that somebody forgets to revert.
///
/// The default is the Android emulator's address for the host machine. `localhost` inside an
/// emulator is the emulator itself, which is the first thing that catches everyone: the app
/// would quietly fail to reach a backend running perfectly well on the developer's PC.
/// A physical phone on the same wifi needs the PC's LAN address instead:
///
///   flutter run --dart-define=API_BASE_URL=http://192.168.1.20:8088
///   flutter build appbundle --dart-define=API_BASE_URL=https://marketfood.ma
class Env {
  const Env._();

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8088',
  );

  /// Every endpoint hangs off this; the version is part of the contract, not of each call.
  static String get apiRoot => '$apiBaseUrl/api/v1';

  /// A page of the website. The API and the storefront share one address behind the gateway,
  /// so the legal pages the app links to are exactly the ones the website shows.
  static Uri site(String path) => Uri.parse('$apiBaseUrl$path');

  /// A picture's address, made reachable from this build.
  ///
  /// The server writes absolute links from its configured public address. On a developer
  /// machine that address is `http://localhost:8088` - which, seen from the emulator, is the
  /// emulator itself, so every photo failed to load. A local build rewrites such links to the
  /// address it actually talks to; a production build is left untouched.
  static String media(String url) {
    if (!isLocal) return url;
    final uri = Uri.tryParse(url);
    if (uri == null || (uri.host != 'localhost' && uri.host != '127.0.0.1')) {
      return url;
    }
    final base = Uri.parse(apiBaseUrl);
    return uri
        .replace(scheme: base.scheme, host: base.host, port: base.port)
        .toString();
  }

  /// True when pointing at a developer machine - used to show the address on the sign-in
  /// screen, because "it does not connect" is nearly always the wrong address.
  static bool get isLocal =>
      apiBaseUrl.contains('10.0.2.2') ||
      apiBaseUrl.contains('localhost') ||
      apiBaseUrl.contains('192.168.');
}
