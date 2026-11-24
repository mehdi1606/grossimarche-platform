import 'dart:async';

import 'package:dio/dio.dart';

import '../env.dart';
import 'token_store.dart';

/// The single way this app talks to the server.
///
/// Nothing above it builds a URL or attaches a header: a screen asks a repository, the
/// repository asks this. That is what makes a screen testable without a backend, and what
/// keeps the refresh dance in one place instead of in forty call sites.
class ApiClient {
  ApiClient({
    required TokenStore tokens,
    Dio? dio,
    Future<void> Function()? onSignedOut,
  }) : _tokens = tokens,
       _onSignedOut = onSignedOut,
       dio =
           dio ??
           Dio(
             BaseOptions(
               baseUrl: Env.apiRoot,
               // Generous, because a shop's 3G is not an office fibre - but finite, so a dead
               // network fails visibly instead of leaving a spinner forever.
               connectTimeout: const Duration(seconds: 15),
               receiveTimeout: const Duration(seconds: 20),
               headers: {'Accept': 'application/json'},
               // 4xx must reach our own error handling, not be thrown as transport failures.
               validateStatus: (code) => code != null && code < 500,
             ),
           ) {
    this.dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: _attachToken,
        onResponse: _refreshOnUnauthorised,
      ),
    );
  }

  final Dio dio;
  final TokenStore _tokens;
  final Future<void> Function()? _onSignedOut;

  /// One refresh at a time. Without this, five screens loading at once would each notice the
  /// expiry and fire five refreshes; the server rotates the refresh token on use, so four of
  /// them would come back invalid and sign a perfectly good session out.
  Completer<bool>? _refreshing;

  Future<void> _attachToken(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    if (options.extra['skipAuth'] != true) {
      final token = await _tokens.readAccess();
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }
    handler.next(options);
  }

  Future<void> _refreshOnUnauthorised(
    Response response,
    ResponseInterceptorHandler handler,
  ) async {
    final request = response.requestOptions;
    final retried = request.extra['retried'] == true;

    if (response.statusCode != 401 ||
        retried ||
        request.extra['skipAuth'] == true) {
      handler.next(response);
      return;
    }

    if (!await _refresh()) {
      handler.next(response);
      return;
    }

    // Replay the original call once, now that a fresh token is stored.
    try {
      final retry = await dio.fetch(request..extra['retried'] = true);
      handler.resolve(retry);
    } catch (_) {
      handler.next(response);
    }
  }

  Future<bool> _refresh() {
    final inFlight = _refreshing;
    if (inFlight != null) {
      return inFlight.future;
    }
    final completer = Completer<bool>();
    _refreshing = completer;

    _doRefresh()
        .then((ok) {
          _refreshing = null;
          completer.complete(ok);
        })
        .catchError((Object _) {
          _refreshing = null;
          completer.complete(false);
        });

    return completer.future;
  }

  Future<bool> _doRefresh() async {
    final refresh = await _tokens.readRefresh();
    if (refresh == null) {
      return false;
    }

    final response = await dio.post<Map<String, dynamic>>(
      '/auth/refresh',
      data: {'refreshToken': refresh},
      // Not authenticated, and never retried: a failing refresh must not refresh itself.
      options: Options(extra: {'skipAuth': true, 'retried': true}),
    );

    final body = response.data;
    if (response.statusCode != 200 || body == null) {
      // The session is over - expired, revoked, or past the server's 24-hour cap. Clearing is
      // what turns a wall of silent 401s into a sign-in screen.
      await _tokens.clear();
      await _onSignedOut?.call();
      return false;
    }

    await _tokens.save(
      access: body['accessToken'] as String,
      refresh: body['refreshToken'] as String,
    );
    return true;
  }
}
