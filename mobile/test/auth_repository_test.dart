import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:market_food/core/api/api_client.dart';
import 'package:market_food/core/api/token_store.dart';
import 'package:market_food/features/auth/data/auth_repository.dart';

/// Answers /auth/login with an account of the given role, and records every call.
class _FakeServer implements HttpClientAdapter {
  _FakeServer(this.role);

  final String role;
  final calls = <String>[];

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? body,
    Future<void>? cancel,
  ) async {
    calls.add('${options.method} ${options.path}');
    if (options.path.endsWith('/auth/login')) {
      return ResponseBody.fromString(
        jsonEncode({
          'accessToken': 'access',
          'refreshToken': 'refresh',
          'expiresIn': 900,
          'user': {'id': 'u1', 'fullName': 'Quelqu\'un', 'role': role},
        }),
        200,
        headers: {
          Headers.contentTypeHeader: [Headers.jsonContentType],
        },
      );
    }
    return ResponseBody.fromString('', 204);
  }

  @override
  void close({bool force = false}) {}
}

/// Keeps tokens in memory - no platform channel in a unit test.
class _MemoryTokens extends TokenStore {
  String? access;
  String? refresh;

  @override
  Future<void> save({required String access, required String refresh}) async {
    this.access = access;
    this.refresh = refresh;
  }

  @override
  Future<String?> readAccess() async => access;

  @override
  Future<String?> readRefresh() async => refresh;

  @override
  Future<void> clear() async => access = refresh = null;
}

void main() {
  (AuthRepository, _FakeServer, _MemoryTokens) build(String role) {
    final server = _FakeServer(role);
    final tokens = _MemoryTokens();
    final dio = Dio(
      BaseOptions(
        baseUrl: 'http://serveur-de-test/api/v1',
        validateStatus: (code) => code != null && code < 500,
      ),
    )..httpClientAdapter = server;
    final api = ApiClient(tokens: tokens, dio: dio);
    return (AuthRepository(api: api, tokens: tokens), server, tokens);
  }

  for (final role in ['ADMIN', 'STORE_MANAGER']) {
    test(
      'a $role account is refused, nothing is stored, its session is revoked',
      () async {
        final (auth, server, tokens) = build(role);

        await expectLater(
          auth.login(
            email: 'equipe@marketfood.ma',
            password: 'peu-importe-1234',
          ),
          throwsA(
            isA<AuthFailure>().having(
              (e) => e.message,
              'message',
              staffNotAllowed,
            ),
          ),
        );
        expect(
          tokens.access,
          isNull,
          reason: 'aucun jeton gardé sur le téléphone',
        );
        expect(
          server.calls,
          contains('POST /auth/logout'),
          reason: 'la session ouverte par le serveur est fermée aussitôt',
        );
      },
    );
  }

  test('a customer signs in and the session is kept', () async {
    final (auth, server, tokens) = build('CLIENT');

    final user = await auth.login(
      email: 'client@commerce.ma',
      password: 'MotDePasse2026',
    );

    expect(user.isCustomer, isTrue);
    expect(tokens.access, 'access');
    expect(server.calls, isNot(contains('POST /auth/logout')));
  });
}
