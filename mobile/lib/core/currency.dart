import 'dart:io';

import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';

import '../shared/money.dart';
import 'env.dart';

/// Which symbol prices are printed with, asked of the shop rather than hardcoded.
///
/// The back office has a Currencies page and `GET /currencies/default` is what it configures;
/// a shop that has moved to `MAD` must not be contradicted by the app on every screen. Only
/// the symbol travels: the API already prices in that currency, so there is nothing to
/// convert here, and converting would be the one way to print a wrong number.
///
/// The answer is remembered on the phone in a small file of its own, like the language - it is
/// not a secret, and it has to be known before the first frame, when no provider exists yet.
class CurrencyStore {
  /// How long the first launch is willing to wait for an answer. Short: the splash is already
  /// the shortest screen in the app, and `DH` is a decent guess if the server is slow.
  static const _firstLaunchTimeout = Duration(seconds: 4);

  Future<File> _file() async =>
      File('${(await getApplicationSupportDirectory()).path}/currency.txt');

  /// The symbol to print, ready before `runApp`.
  ///
  /// A phone that has heard the answer before uses it at once - instant, and right with no
  /// signal - while a fresh request runs in the background for the next launch. A phone that
  /// has never heard it asks now, briefly: a whole session of wrong symbols is a worse trade
  /// than a moment of splash, and the app is about to call the server anyway.
  Future<String> start() async {
    final remembered = await _remembered();
    if (remembered != null) {
      // Deliberately not awaited, and deliberately not applied to [Money] when it comes
      // back: swapping the symbol mid-session would leave one screen reading 20,00 DH and
      // the next 20,00 MAD. It is saved, and the next launch opens with it.
      _fetch();
      return remembered;
    }
    return await _fetch(timeout: _firstLaunchTimeout) ?? Money.fallbackSymbol;
  }

  Future<String?> _remembered() async {
    try {
      final file = await _file();
      if (!await file.exists()) return null;
      final symbol = (await file.readAsString()).trim();
      return symbol.isEmpty ? null : symbol;
    } on FileSystemException {
      // Unreadable: ask the server, as on a first launch.
      return null;
    }
  }

  /// Asks the server, and remembers the answer. Null when there is nothing usable to be had.
  ///
  /// Its own Dio rather than the app's `ApiClient`: this runs before the provider scope
  /// exists, and the endpoint is public - there is no token to attach and nothing to refresh.
  Future<String?> _fetch({
    Duration timeout = const Duration(seconds: 10),
  }) async {
    try {
      final dio = Dio(
        BaseOptions(
          baseUrl: Env.apiRoot,
          connectTimeout: timeout,
          receiveTimeout: timeout,
          headers: {'Accept': 'application/json'},
        ),
      );
      final response = await dio.get<Map<String, dynamic>>(
        '/currencies/default',
      );
      final symbol = (response.data?['symbol'] as String?)?.trim();
      if (response.statusCode != 200 || symbol == null || symbol.isEmpty) {
        // 404 is a real answer: a shop with no default currency configured. `DH`, as before.
        return null;
      }
      await _save(symbol);
      return symbol;
    } catch (_) {
      // No signal, or a server that cannot answer: prices still have to be printable.
      return null;
    }
  }

  Future<void> _save(String symbol) async {
    try {
      await (await _file()).writeAsString(symbol, flush: true);
    } on FileSystemException {
      // Not saved: asked again next launch.
    }
  }
}
