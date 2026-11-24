import 'package:dio/dio.dart';

import '../../../core/api/api_client.dart';
import 'address_models.dart';

class AddressFailure implements Exception {
  const AddressFailure(this.message);

  final String message;

  @override
  String toString() => message;
}

class AddressRepository {
  AddressRepository(this._api);

  final ApiClient _api;

  Future<List<Address>> list() async {
    final response = await _send(
      () => _api.dio.get<List<dynamic>>('/me/addresses'),
    );
    return (response as List)
        .cast<Map<String, dynamic>>()
        .map(Address.fromJson)
        .toList(growable: false);
  }

  /// The cities served, with their districts and rates. Public: the customer must be able to
  /// see whether their city is covered before committing to anything.
  Future<List<DeliveryCity>> cities() async {
    final response = await _send(
      () => _api.dio.get<List<dynamic>>('/delivery-cities'),
    );
    return (response as List)
        .cast<Map<String, dynamic>>()
        .map(DeliveryCity.fromJson)
        .toList(growable: false);
  }

  Future<Address> create({
    required String city,
    required String addressLine,
    String? label,
    String? district,
    bool isDefault = false,
  }) async {
    final body = await _send(
      () => _api.dio.post<Map<String, dynamic>>(
        '/me/addresses',
        data: {
          'city': city,
          'addressLine': addressLine,
          'label': ?label,
          'district': ?district,
          'isDefault': isDefault,
        },
      ),
    );
    return Address.fromJson(body as Map<String, dynamic>);
  }

  /// Make an address the one checkout pre-selects. The API's PATCH replaces the whole
  /// address, so every field is sent back as it is - only the flag changes.
  Future<void> makeDefault(Address a) async {
    await _send(
      () => _api.dio.patch<Map<String, dynamic>>(
        '/me/addresses/${a.id}',
        data: {
          'city': a.city,
          'addressLine': a.addressLine,
          'label': a.label,
          'district': a.district,
          'isDefault': true,
        },
      ),
    );
  }

  Future<void> delete(String id) async {
    await _send(() => _api.dio.delete<void>('/me/addresses/$id'));
  }

  Future<Object?> _send(Future<Response<dynamic>> Function() call) async {
    late final Response<dynamic> response;
    try {
      response = await call();
    } on DioException catch (e) {
      throw AddressFailure(switch (e.type) {
        DioExceptionType.connectionTimeout || DioExceptionType.receiveTimeout =>
          'Le serveur met trop de temps à répondre.',
        DioExceptionType.connectionError =>
          'Impossible de joindre le serveur. Vérifiez votre connexion.',
        _ => 'L\'adresse n\'a pas pu être enregistrée.',
      });
    }

    final code = response.statusCode ?? 0;
    if (code >= 200 && code < 300) {
      return response.data;
    }
    final data = response.data;
    final message = data is Map ? data['message'] : null;
    throw AddressFailure(
      message is String && message.isNotEmpty
          ? message
          : 'L\'adresse n\'a pas pu être enregistrée.',
    );
  }
}
