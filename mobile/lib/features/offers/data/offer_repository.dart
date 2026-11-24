import 'package:dio/dio.dart';

import '../../../core/api/api_client.dart';
import 'offer_models.dart';

class OfferFailure implements Exception {
  const OfferFailure(this.message);

  final String message;

  @override
  String toString() => message;
}

class OfferRepository {
  OfferRepository(this._api);

  final ApiClient _api;

  /// The baskets this customer can actually buy.
  Future<List<Offer>> forMe() async {
    final data = await _get<List<dynamic>>('/bundles');
    return data
        .cast<Map<String, dynamic>>()
        .map(Offer.fromJson)
        .where((o) => o.isForThisCustomer)
        .toList(growable: false);
  }

  /// The baskets this customer can buy that include [productId] - for the product's page.
  Future<List<Offer>> containing(String productId) async {
    final data = await _get<List<dynamic>>('/bundles?productId=$productId');
    return data
        .cast<Map<String, dynamic>>()
        .map(Offer.fromJson)
        .where((o) => o.isForThisCustomer)
        .toList(growable: false);
  }

  Future<Offer> bySlug(String slug) async {
    final data = await _get<Map<String, dynamic>>('/bundles/$slug');
    return Offer.fromJson(data);
  }

  Future<T> _get<T>(String path) async {
    late final Response<T> response;
    try {
      response = await _api.dio.get<T>(path);
    } on DioException catch (e) {
      throw OfferFailure(switch (e.type) {
        DioExceptionType.connectionError =>
          'Impossible de joindre le serveur. Vérifiez votre connexion.',
        _ => 'Les offres n\'ont pas pu être chargées.',
      });
    }
    final body = response.data;
    if (response.statusCode == 200 && body != null) return body;
    if (response.statusCode == 404) {
      throw const OfferFailure('Cette offre n\'est plus disponible.');
    }
    throw const OfferFailure('Les offres n\'ont pas pu être chargées.');
  }
}
