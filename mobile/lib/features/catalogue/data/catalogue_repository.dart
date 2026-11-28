import 'package:dio/dio.dart';

import '../../../core/api/api_client.dart';
import 'catalogue_models.dart';

/// Raised when the catalogue cannot be read, carrying what to show the customer.
class CatalogueFailure implements Exception {
  const CatalogueFailure(this.message);

  final String message;

  @override
  String toString() => message;
}

/// Reads the catalogue. The only place in the app that knows these URLs exist.
class CatalogueRepository {
  CatalogueRepository(this._api);

  final ApiClient _api;

  Future<List<Category>> categories() async {
    final data = await _get<List<dynamic>>('/categories');
    return data
        .cast<Map<String, dynamic>>()
        .map(Category.fromJson)
        .where((c) => c.productCount > 0)
        .toList(growable: false);
  }

  /// One page of products.
  ///
  /// Every filter is optional and omitted when empty rather than sent blank: the server reads
  /// an empty `q` as a search for the empty string on some paths, and sending nothing is the
  /// honest way to say "no filter".
  Future<Paged<ProductSummary>> products({
    String? categoryId,
    String? query,
    ProductSort sort = ProductSort.newest,
    double? minPrice,
    double? maxPrice,
    bool inStockOnly = false,
    int page = 0,
    int size = 20,
  }) async {
    final data = await _get<Map<String, dynamic>>(
      '/products',
      query: {
        'categoryId': ?categoryId,
        if (query != null && query.trim().length >= 2) 'q': query.trim(),
        'minPrice': ?minPrice,
        'maxPrice': ?maxPrice,
        // Only ever sent as true: `inStock=false` would mean "show me what is out of stock",
        // which is nobody's intention when the switch is off.
        if (inStockOnly) 'inStock': true,
        // The server's own default, so saying it would only make the URL longer.
        if (sort != ProductSort.newest) 'sort': sort.api,
        'page': page,
        'size': size,
      },
    );
    return Paged.fromJson(data, ProductSummary.fromJson);
  }

  /// A single product, by slug or id - the API accepts either.
  Future<ProductDetail> product(String idOrSlug) async {
    final data = await _get<Map<String, dynamic>>('/products/$idOrSlug');
    return ProductDetail.fromJson(data);
  }

  Future<T> _get<T>(String path, {Map<String, dynamic>? query}) async {
    late final Response<T> response;
    try {
      response = await _api.dio.get<T>(path, queryParameters: query);
    } on DioException catch (e) {
      throw CatalogueFailure(switch (e.type) {
        DioExceptionType.connectionTimeout || DioExceptionType.receiveTimeout =>
          'Le serveur met trop de temps à répondre.',
        DioExceptionType.connectionError =>
          'Impossible de joindre le serveur. Vérifiez votre connexion.',
        _ => 'Le catalogue n\'a pas pu être chargé.',
      });
    }

    final body = response.data;
    if (response.statusCode == 200 && body != null) {
      return body;
    }
    if (response.statusCode == 404) {
      throw const CatalogueFailure('Ce produit n\'existe plus.');
    }
    throw const CatalogueFailure('Le catalogue n\'a pas pu être chargé.');
  }
}
