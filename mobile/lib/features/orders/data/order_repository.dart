import 'package:dio/dio.dart';

import '../../../core/api/api_client.dart';
import '../../catalogue/data/catalogue_models.dart';
import 'order_models.dart';

class OrderFailure implements Exception {
  const OrderFailure(this.message);

  final String message;

  @override
  String toString() => message;
}

class OrderRepository {
  OrderRepository(this._api);

  final ApiClient _api;

  /// Newest first - the server sorts, so the app never re-orders what it was given.
  Future<Paged<OrderSummary>> history({int page = 0, int size = 20}) async {
    final body = await _send(
      () => _api.dio.get<Map<String, dynamic>>(
        '/orders',
        queryParameters: {'page': page, 'size': size},
      ),
    );
    return Paged.fromJson(body, OrderSummary.fromJson);
  }

  Future<OrderStats> stats() async {
    final body = await _send(
      () => _api.dio.get<Map<String, dynamic>>('/orders/stats'),
    );
    return OrderStats.fromJson(body);
  }

  Future<OrderDetail> detail(String id) async {
    final body = await _send(
      () => _api.dio.get<Map<String, dynamic>>('/orders/$id'),
    );
    return OrderDetail.fromJson(body);
  }

  Future<OrderDetail> cancel(String id) async {
    final body = await _send(
      () => _api.dio.post<Map<String, dynamic>>('/orders/$id/cancel'),
    );
    return OrderDetail.fromJson(body);
  }

  /// The invoice PDF, as the server generates it - the same document the website downloads.
  Future<List<int>> invoice(String id) async {
    late final Response<List<int>> response;
    try {
      response = await _api.dio.get<List<int>>(
        '/orders/$id/invoice',
        // The client asks for JSON by default; a PDF endpoint answers that with 406.
        options: Options(
          responseType: ResponseType.bytes,
          headers: {'Accept': 'application/pdf'},
        ),
      );
    } on DioException catch (_) {
      throw const OrderFailure(
        'Impossible de joindre le serveur. Vérifiez votre connexion.',
      );
    }
    final bytes = response.data;
    if (response.statusCode == 200 && bytes != null && bytes.isNotEmpty) {
      return bytes;
    }
    throw const OrderFailure('La facture n\'a pas pu être téléchargée.');
  }

  Future<Map<String, dynamic>> _send(
    Future<Response<Map<String, dynamic>>> Function() call,
  ) async {
    late final Response<Map<String, dynamic>> response;
    try {
      response = await call();
    } on DioException catch (e) {
      throw OrderFailure(switch (e.type) {
        DioExceptionType.connectionTimeout || DioExceptionType.receiveTimeout =>
          'Le serveur met trop de temps à répondre.',
        DioExceptionType.connectionError =>
          'Impossible de joindre le serveur. Vérifiez votre connexion.',
        _ => 'Vos commandes n\'ont pas pu être chargées.',
      });
    }

    final body = response.data;
    if (response.statusCode == 200 && body != null) {
      return body;
    }
    if (response.statusCode == 404) {
      throw const OrderFailure('Cette commande est introuvable.');
    }
    final message = body?['message'];
    throw OrderFailure(
      message is String && message.isNotEmpty
          ? message
          : 'Vos commandes n\'ont pas pu être chargées.',
    );
  }
}
