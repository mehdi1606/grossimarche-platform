import 'package:dio/dio.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/token_store.dart';

/// What the server knows about the signed-in person. Only the fields the app shows - the
/// response carries more, and copying all of it here would mean editing this file every time
/// the backend adds a column.
class SignedInUser {
  const SignedInUser({
    required this.id,
    required this.fullName,
    this.clientType,
    this.role = 'CLIENT',
  });

  factory SignedInUser.fromJson(Map<String, dynamic> json) => SignedInUser(
    id: json['id'] as String? ?? '',
    fullName: json['fullName'] as String? ?? '',
    clientType: json['clientTypeName'] as String?,
    role: json['role'] as String? ?? 'CLIENT',
  );

  final String id;
  final String fullName;

  /// The trade this account buys as. Prices depend on it, so a screen that shows a price
  /// without it would be showing a number that belongs to nobody.
  final String? clientType;

  /// CLIENT, ADMIN or STORE_MANAGER.
  final String role;

  /// Only customers belong in this app. Staff run the shop from the web back office; signed
  /// in here they would land on a catalogue with no trade, no prices and a "pending
  /// approval" banner - nothing broken, everything misleading.
  bool get isCustomer => role == 'CLIENT';
}

/// What a staff account is told when it tries to sign in to the customer app.
const staffNotAllowed =
    'Ce compte appartient à l\'équipe Market Food. L\'application est réservée aux '
    'clients : connectez-vous au back-office depuis un navigateur.';

/// A trade a shop can apply as - "Boulangerie", "Épicerie". It sets every price they will see.
class Trade {
  const Trade({required this.id, required this.name});

  factory Trade.fromJson(Map<String, dynamic> json) =>
      Trade(id: json['id'] as String, name: json['name'] as String? ?? '');

  final String id;
  final String name;
}

/// Raised when the server refuses, with the message it wrote.
///
/// The backend answers in French already ("E-mail ou mot de passe incorrect", "Votre compte
/// est en attente de validation"), so the app shows that text rather than inventing its own
/// and contradicting the website.
class AuthFailure implements Exception {
  const AuthFailure(this.message);

  final String message;

  @override
  String toString() => message;
}

/// The minimum password length the server enforces. Mirrored here only to say so before the
/// round trip; the server stays the judge.
const minPasswordLength = 10;

/// Signing in, applying for an account, and recovering a password - the same three doors the
/// website has, on the same endpoints, so a customer meets one set of rules everywhere.
class AuthRepository {
  AuthRepository({required ApiClient api, required TokenStore tokens})
    : _api = api,
      _tokens = tokens;

  final ApiClient _api;
  final TokenStore _tokens;

  static const _anonymous = {'skipAuth': true};

  /// E-mail and password, as on the website. A pending or rejected application is refused by
  /// the server with a sentence that says so - shown as is.
  Future<SignedInUser> login({
    required String email,
    required String password,
  }) async {
    final body = await _post('/auth/login', {
      'email': email.trim(),
      'password': password,
    });
    final user = SignedInUser.fromJson(
      (body['user'] as Map).cast<String, dynamic>(),
    );

    // Checked before anything is stored. The server has already opened a session for this
    // staff account, so it is revoked on the spot rather than left valid for thirty days on
    // a phone that will never use it.
    if (!user.isCustomer) {
      try {
        await _api.dio.post<void>(
          '/auth/logout',
          data: {'refreshToken': body['refreshToken']},
          options: Options(
            extra: _anonymous,
            headers: {'Authorization': 'Bearer ${body['accessToken']}'},
          ),
        );
      } catch (_) {
        // The refusal stands even if the revocation could not be sent.
      }
      throw const AuthFailure(staffNotAllowed);
    }

    await _tokens.save(
      access: body['accessToken'] as String,
      refresh: body['refreshToken'] as String,
    );
    return user;
  }

  /// The trades a shop can apply as.
  Future<List<Trade>> trades() async {
    late final Response<List<dynamic>> response;
    try {
      response = await _api.dio.get<List<dynamic>>(
        '/client-types',
        options: Options(extra: _anonymous),
      );
    } on DioException catch (e) {
      throw AuthFailure(_networkMessage(e));
    }
    if (response.statusCode != 200 || response.data == null) {
      throw const AuthFailure('Impossible de charger les activités.');
    }
    return response.data!
        .cast<Map<String, dynamic>>()
        .where((t) => t['active'] != false)
        .map(Trade.fromJson)
        .toList(growable: false);
  }

  /// Apply for a trade account. It is created pending: registering is a request, not a
  /// sign-in, and no tokens come back.
  Future<void> register({
    required String tradeId,
    required String businessName,
    required String fullName,
    required String phone,
    required String city,
    String? district,
    required String street,
    required String email,
    required String password,
  }) async {
    await _post(
      '/auth/register',
      {
        'clientTypeId': tradeId,
        'businessName': businessName.trim(),
        'fullName': fullName.trim(),
        'phone': phone.trim(),
        'city': city,
        'district': ?district,
        'addressLine': street.trim(),
        'email': email.trim(),
        'password': password,
      },
      accept: const {201},
    );
  }

  /// Step 1 of a forgotten password. The server answers the same whether or not the address
  /// has an account, so this form cannot be used to discover who the customers are.
  Future<void> requestReset(String email) =>
      _post('/auth/password/forgot', {'email': email.trim()});

  /// Step 2: check the code before asking for a new password.
  Future<void> verifyResetCode(String email, String code) => _post(
    '/auth/password/verify-code',
    {'email': email.trim(), 'code': code.trim()},
  );

  /// Step 3: set the password. Every open session is ended by the server.
  Future<void> resetPassword(String email, String code, String newPassword) =>
      _post('/auth/password/reset', {
        'email': email.trim(),
        'code': code.trim(),
        'newPassword': newPassword,
      });

  /// End the session on the server too, so the refresh token cannot be replayed.
  Future<void> signOut() async {
    final refresh = await _tokens.readRefresh();
    if (refresh != null) {
      try {
        await _api.dio.post<void>(
          '/auth/logout',
          data: {'refreshToken': refresh},
        );
      } catch (_) {
        // A server we cannot reach must not trap the user in a session they want out of.
      }
    }
    await _tokens.clear();
  }

  Future<Map<String, dynamic>> _post(
    String path,
    Map<String, dynamic> data, {
    Set<int> accept = const {200},
  }) async {
    late final Response<Map<String, dynamic>> response;
    try {
      response = await _api.dio.post<Map<String, dynamic>>(
        path,
        data: data,
        options: Options(extra: _anonymous),
      );
    } on DioException catch (e) {
      throw AuthFailure(_networkMessage(e));
    }

    final body = response.data;
    if (accept.contains(response.statusCode)) {
      return body ?? const {};
    }
    throw AuthFailure(
      _serverMessage(body) ?? 'Une erreur est survenue. Réessayez.',
    );
  }

  /// The API's own error shape: {"message": "...", "code": "...", "traceId": "..."}. A
  /// validation error may carry field details instead; the first one is shown.
  String? _serverMessage(Map<String, dynamic>? body) {
    final message = body?['message'];
    if (message is String && message.isNotEmpty) return message;
    final errors = body?['errors'];
    if (errors is Map && errors.isNotEmpty) return '${errors.values.first}';
    return null;
  }

  String _networkMessage(DioException e) => switch (e.type) {
    DioExceptionType.connectionTimeout || DioExceptionType.receiveTimeout =>
      'Le serveur met trop de temps à répondre. Vérifiez votre connexion.',
    DioExceptionType.connectionError =>
      'Impossible de joindre le serveur. Vérifiez votre connexion.',
    _ => 'Une erreur réseau est survenue. Réessayez.',
  };
}
