import 'package:dio/dio.dart';

import '../../../core/api/api_client.dart';
import 'cart_models.dart';

class CartFailure implements Exception {
  const CartFailure(this.message);

  final String message;

  @override
  String toString() => message;
}

/// The cart lives on the server, not on the phone.
///
/// Every change round-trips, and the answer is the new cart with its totals recomputed. That
/// costs a request per tap, and buys the only thing that matters here: the figure on screen is
/// the figure that will be charged, including the ladder rung the new quantity just earned.
class CartRepository {
  CartRepository(this._api);

  final ApiClient _api;

  Future<Cart> load() =>
      _cart(() => _api.dio.get<Map<String, dynamic>>('/cart'));

  /// Set a line to an exact quantity. Zero removes it - the API takes `@Min(0)`, so there is
  /// no separate delete call to keep in step.
  Future<Cart> setQuantity(String productId, int quantity) => _cart(
    () => _api.dio.put<Map<String, dynamic>>(
      '/cart/items/$productId',
      data: {'quantity': quantity},
    ),
  );

  Future<void> clear() async {
    try {
      await _api.dio.delete<void>('/cart');
    } on DioException catch (e) {
      throw CartFailure(_networkMessage(e));
    }
  }

  Future<Cart> _cart(
    Future<Response<Map<String, dynamic>>> Function() call,
  ) async {
    late final Response<Map<String, dynamic>> response;
    try {
      response = await call();
    } on DioException catch (e) {
      throw CartFailure(_networkMessage(e));
    }

    final body = response.data;
    if ((response.statusCode == 200 || response.statusCode == 201) &&
        body != null) {
      return Cart.fromJson(body);
    }
    // The server explains refusals in French already - a quantity below the minimum, a
    // product that went inactive. Repeating it beats inventing a vaguer sentence.
    final message = body?['message'];
    throw CartFailure(
      message is String && message.isNotEmpty
          ? message
          : 'Le panier n\'a pas pu être mis à jour.',
    );
  }

  String _networkMessage(DioException e) => switch (e.type) {
    DioExceptionType.connectionTimeout || DioExceptionType.receiveTimeout =>
      'Le serveur met trop de temps à répondre.',
    DioExceptionType.connectionError =>
      'Impossible de joindre le serveur. Vérifiez votre connexion.',
    _ => 'Le panier n\'a pas pu être mis à jour.',
  };
}
