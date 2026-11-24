import 'package:dio/dio.dart';

import '../../../core/api/api_client.dart';

class AccountFailure implements Exception {
  const AccountFailure(this.message);

  final String message;

  @override
  String toString() => message;
}

class Profile {
  const Profile({
    required this.fullName,
    this.businessName,
    this.email,
    this.phone,
    this.clientType,
  });

  factory Profile.fromJson(Map<String, dynamic> json) => Profile(
    fullName: json['fullName'] as String? ?? '',
    businessName: _text(json['businessName']),
    email: _text(json['email']),
    phone: _text(json['phone']),
    clientType: _text(json['clientTypeName']),
  );

  final String fullName;
  final String? businessName;
  final String? email;
  final String? phone;
  final String? clientType;
}

class AccountRepository {
  AccountRepository(this._api);

  final ApiClient _api;

  Future<Profile> profile() async => Profile.fromJson(
    await _send(() => _api.dio.get<Map<String, dynamic>>('/me')),
  );

  /// Name, business name and phone, in one call. Returns the account as the server now
  /// holds it - the same shape as GET /me and the sign-in response.
  Future<Map<String, dynamic>> updateProfile({
    required String fullName,
    required String businessName,
    required String phone,
  }) => _send(
    () => _api.dio.patch<Map<String, dynamic>>(
      '/me',
      data: {
        'fullName': fullName.trim(),
        if (businessName.trim().isNotEmpty) 'businessName': businessName.trim(),
        'phone': phone.trim(),
      },
    ),
  );

  /// The e-mail is the sign-in identity, so a new one must prove it receives mail first: a
  /// 6-digit code is sent to it, and only [confirmEmailChange] with that code applies it.
  Future<void> requestEmailChange(String email) async {
    await _send(
      () => _api.dio.post<Map<String, dynamic>>(
        '/me/contact/request',
        data: {'channel': 'EMAIL', 'destination': email.trim()},
      ),
    );
  }

  Future<Map<String, dynamic>> confirmEmailChange(String email, String code) =>
      _send(
        () => _api.dio.post<Map<String, dynamic>>(
          '/me/contact/verify',
          data: {'channel': 'EMAIL', 'destination': email.trim(), 'code': code},
        ),
      );

  /// Change the password. The current one is asked for again, so a phone left unlocked on a
  /// counter is not enough to take the account over.
  Future<void> changePassword(String current, String next) async {
    late final Response<Map<String, dynamic>> response;
    try {
      response = await _api.dio.post<Map<String, dynamic>>(
        '/me/password',
        data: {'currentPassword': current, 'newPassword': next},
      );
    } on DioException catch (_) {
      throw const AccountFailure('Impossible de joindre le serveur.');
    }
    final code = response.statusCode ?? 0;
    if (code >= 200 && code < 300) return;
    final message = response.data?['message'];
    throw AccountFailure(
      message is String && message.isNotEmpty
          ? message
          : 'Le mot de passe n\'a pas pu être changé.',
    );
  }

  /// Erase the account. The server anonymises it, drops its addresses, cart and devices, and
  /// keeps past orders - an invoice is an accounting record the shop must hold on to.
  Future<void> deleteAccount() async {
    late final Response<void> response;
    try {
      response = await _api.dio.delete<void>('/me');
    } on DioException catch (_) {
      throw const AccountFailure('Impossible de joindre le serveur.');
    }
    final code = response.statusCode ?? 0;
    if (code < 200 || code >= 300) {
      throw const AccountFailure('Le compte n\'a pas pu être supprimé.');
    }
  }

  Future<Map<String, dynamic>> _send(
    Future<Response<Map<String, dynamic>>> Function() call,
  ) async {
    late final Response<Map<String, dynamic>> response;
    try {
      response = await call();
    } on DioException catch (_) {
      throw const AccountFailure('Impossible de joindre le serveur.');
    }
    final body = response.data;
    if (response.statusCode == 200 && body != null) return body;
    final message = body?['message'];
    throw AccountFailure(
      message is String && message.isNotEmpty
          ? message
          : 'Une erreur est survenue.',
    );
  }
}

String? _text(Object? value) {
  final s = value as String?;
  return (s == null || s.trim().isEmpty) ? null : s;
}
