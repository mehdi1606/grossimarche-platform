import 'package:dio/dio.dart';

import '../../../core/api/api_client.dart';
import 'catalogue_models.dart';

/// A published review. Only reviews Market Food has approved are ever returned.
class Review {
  const Review({
    required this.id,
    required this.rating,
    required this.createdAt,
    this.comment,
    this.authorName,
  });

  factory Review.fromJson(Map<String, dynamic> json) => Review(
    id: json['id'] as String? ?? '',
    rating: ((json['rating'] as num?)?.toInt() ?? 0).clamp(0, 5),
    comment: _text(json['comment']),
    authorName: _text(json['authorName']),
    createdAt:
        (json['createdAt'] is String
                ? DateTime.tryParse(json['createdAt'] as String)
                : null)
            ?.toLocal() ??
        DateTime.now(),
  );

  final String id;
  final int rating;
  final String? comment;
  final String? authorName;
  final DateTime createdAt;
}

class ReviewFailure implements Exception {
  const ReviewFailure(this.message);

  final String message;

  @override
  String toString() => message;
}

/// Reviews, as on the website: anyone reads the approved ones; a signed-in customer leaves one
/// per product (sending again replaces it), and it waits for moderation before it shows.
class ReviewRepository {
  ReviewRepository(this._api);

  final ApiClient _api;

  Future<Paged<Review>> list(
    String productId, {
    int page = 0,
    int size = 10,
  }) async {
    late final Response<Map<String, dynamic>> response;
    try {
      response = await _api.dio.get<Map<String, dynamic>>(
        '/products/$productId/reviews',
        queryParameters: {'page': page, 'size': size},
      );
    } on DioException catch (_) {
      throw const ReviewFailure(
        'Impossible de joindre le serveur. Vérifiez votre connexion.',
      );
    }
    final body = response.data;
    if (response.statusCode == 200 && body != null) {
      return Paged.fromJson(body, Review.fromJson);
    }
    throw const ReviewFailure('Une erreur est survenue.');
  }

  Future<void> submit(
    String productId, {
    required int rating,
    String? comment,
  }) async {
    late final Response<Map<String, dynamic>> response;
    try {
      response = await _api.dio.post<Map<String, dynamic>>(
        '/products/$productId/reviews',
        data: {
          'rating': rating,
          if (comment != null && comment.trim().isNotEmpty)
            'comment': comment.trim(),
        },
      );
    } on DioException catch (_) {
      throw const ReviewFailure(
        'Impossible de joindre le serveur. Vérifiez votre connexion.',
      );
    }
    final code = response.statusCode ?? 0;
    if (code >= 200 && code < 300) return;
    final message = response.data?['message'];
    throw ReviewFailure(
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
