import 'package:dio/dio.dart';

import '../../../core/api/api_client.dart';

class CheckoutFailure implements Exception {
  const CheckoutFailure(this.message);

  final String message;

  @override
  String toString() => message;
}

/// What the server created.
class PlacedOrder {
  const PlacedOrder({
    required this.id,
    required this.number,
    required this.total,
  });

  factory PlacedOrder.fromJson(Map<String, dynamic> json) {
    final order = (json['order'] as Map?)?.cast<String, dynamic>() ?? const {};
    return PlacedOrder(
      id: order['id'] as String? ?? '',
      number: order['orderNumber'] as String? ?? '',
      total: (order['total'] as num?)?.toDouble() ?? 0,
    );
  }

  final String id;
  final String number;
  final double total;
}

/// What a promo code would take off the current cart.
class CouponPreview {
  const CouponPreview({
    required this.code,
    required this.discount,
    required this.valid,
    this.message,
  });

  factory CouponPreview.fromJson(Map<String, dynamic> json) => CouponPreview(
    code: json['code'] as String? ?? '',
    discount: (json['discountAmount'] as num?)?.toDouble() ?? 0,
    valid: json['valid'] as bool? ?? false,
    message: json['message'] as String?,
  );

  /// As the server spells it - the code sent with the order is this one, not what was typed.
  final String code;
  final double discount;
  final bool valid;

  /// Why it does not apply (expired, minimum not reached, already used), in French.
  final String? message;
}

class CheckoutRepository {
  CheckoutRepository(this._api);

  final ApiClient _api;

  /// Check a promo code against the cart as the server holds it. Nothing is reserved: the
  /// order checks the code again, so a code that expires in between is refused there.
  Future<CouponPreview> previewCoupon(String code) async {
    late final Response<Map<String, dynamic>> response;
    try {
      response = await _api.dio.post<Map<String, dynamic>>(
        '/coupons/validate',
        data: {'code': code},
      );
    } on DioException catch (_) {
      throw const CheckoutFailure(
        'Impossible de joindre le serveur. Vérifiez votre connexion.',
      );
    }
    final body = response.data;
    if (response.statusCode == 200 && body != null) {
      return CouponPreview.fromJson(body);
    }
    final message = body?['message'];
    throw CheckoutFailure(
      message is String && message.isNotEmpty
          ? message
          : 'Code promo invalide.',
    );
  }

  /// Place the order.
  ///
  /// [idempotencyKey] is generated once per attempt by the caller and reused if the same
  /// attempt is retried. Without it, a customer who taps twice on a slow connection - or
  /// whose request times out and is retried - ends up with two identical orders and two
  /// deliveries. The server recognises the key and returns the first order instead.
  Future<PlacedOrder> placeOrder({
    required String addressId,
    required String idempotencyKey,
    String? note,
    String? couponCode,
  }) async {
    late final Response<Map<String, dynamic>> response;
    try {
      response = await _api.dio.post<Map<String, dynamic>>(
        '/orders',
        data: {
          'addressId': addressId,
          // Cash on delivery only, for now. Card goes through the CMI gateway, which is a
          // browser redirect rather than an API call - its own piece of work.
          'paymentMethod': 'COD',
          'note': ?note,
          'couponCode': ?couponCode,
        },
        options: Options(headers: {'Idempotency-Key': idempotencyKey}),
      );
    } on DioException catch (e) {
      throw CheckoutFailure(switch (e.type) {
        DioExceptionType.connectionTimeout || DioExceptionType.receiveTimeout =>
          'Le serveur met trop de temps à répondre. Vérifiez vos commandes avant de réessayer.',
        DioExceptionType.connectionError =>
          'Impossible de joindre le serveur. Vérifiez votre connexion.',
        _ => 'La commande n\'a pas pu être envoyée.',
      });
    }

    final body = response.data;
    final code = response.statusCode ?? 0;
    if (code >= 200 && code < 300 && body != null) {
      return PlacedOrder.fromJson(body);
    }
    // The server refuses in French and for good reasons: stock gone, account not approved,
    // city not served. That sentence is more useful than anything written here.
    final message = body?['message'];
    throw CheckoutFailure(
      message is String && message.isNotEmpty
          ? message
          : 'La commande n\'a pas pu être envoyée.',
    );
  }
}
