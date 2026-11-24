// The catalogue as the API hands it over.
//
// Written by hand rather than generated. These are four small shapes that change when the
// backend's DTOs change, and a reader comparing the two should be able to hold both on one
// screen; a build_runner step would buy nothing here and cost a generation pass on every
// edit.

/// One page of results, in the envelope every listing endpoint uses.
class Paged<T> {
  const Paged({
    required this.items,
    required this.page,
    required this.totalElements,
    required this.last,
  });

  factory Paged.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) item,
  ) {
    final content = (json['content'] as List? ?? const [])
        .cast<Map<String, dynamic>>()
        .map(item)
        .toList(growable: false);
    return Paged(
      items: content,
      page: (json['page'] as num?)?.toInt() ?? 0,
      totalElements: (json['totalElements'] as num?)?.toInt() ?? content.length,
      last: json['last'] as bool? ?? true,
    );
  }

  final List<T> items;
  final int page;
  final int totalElements;
  final bool last;
}

class Category {
  const Category({
    required this.id,
    required this.name,
    required this.slug,
    this.imageUrl,
    this.productCount = 0,
  });

  factory Category.fromJson(Map<String, dynamic> json) => Category(
    id: json['id'] as String,
    name: json['name'] as String? ?? '',
    slug: json['slug'] as String? ?? '',
    imageUrl: _text(json['imageUrl']),
    productCount: (json['productCount'] as num?)?.toInt() ?? 0,
  );

  final String id;
  final String name;
  final String slug;
  final String? imageUrl;
  final int productCount;
}

/// A product in a list.
///
/// [price] is null when the viewer has no trade attached to their account - an application
/// still waiting for Market Food to approve it. That is not an error and not a zero: the
/// product is real, it simply has no price for this person yet, and the screen says so
/// instead of printing 0,00 DH.
class ProductSummary {
  const ProductSummary({
    required this.id,
    required this.name,
    required this.slug,
    required this.unit,
    required this.inStock,
    required this.minOrderQuantity,
    this.price,
    this.imageUrl,
    this.hasQuantityDiscount = false,
  });

  factory ProductSummary.fromJson(Map<String, dynamic> json) => ProductSummary(
    id: json['id'] as String,
    name: json['name'] as String? ?? '',
    slug: json['slug'] as String? ?? '',
    unit: json['unit'] as String? ?? '',
    inStock: json['inStock'] as bool? ?? false,
    minOrderQuantity: (json['minOrderQuantity'] as num?)?.toInt() ?? 1,
    price: (json['price'] as num?)?.toDouble(),
    imageUrl: _text(json['imageUrl']),
    hasQuantityDiscount: json['hasQuantityDiscount'] as bool? ?? false,
  );

  final String id;
  final String name;
  final String slug;
  final String unit;
  final bool inStock;
  final int minOrderQuantity;
  final double? price;
  final String? imageUrl;

  /// Whether buying more earns a better unit price - the heart of wholesale, and worth a
  /// badge in the list rather than a surprise on the product page.
  final bool hasQuantityDiscount;
}

/// One rung of the quantity ladder: from [minQuantity] units, each costs [unitPrice].
class PriceTier {
  const PriceTier({required this.minQuantity, required this.unitPrice});

  factory PriceTier.fromJson(Map<String, dynamic> json) => PriceTier(
    minQuantity: (json['minQuantity'] as num?)?.toInt() ?? 1,
    unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0,
  );

  final int minQuantity;
  final double unitPrice;
}

class ProductDetail {
  const ProductDetail({
    required this.id,
    required this.name,
    required this.slug,
    required this.unit,
    required this.stockQuantity,
    required this.minOrderQuantity,
    required this.priceTiers,
    this.description,
    this.price,
    this.imageUrl,
    this.categoryId,
    this.categoryName,
    this.averageRating = 0,
    this.reviewCount = 0,
  });

  factory ProductDetail.fromJson(Map<String, dynamic> json) => ProductDetail(
    id: json['id'] as String,
    name: json['name'] as String? ?? '',
    slug: json['slug'] as String? ?? '',
    unit: json['unit'] as String? ?? '',
    stockQuantity: (json['stockQuantity'] as num?)?.toInt() ?? 0,
    minOrderQuantity: (json['minOrderQuantity'] as num?)?.toInt() ?? 1,
    priceTiers: (json['priceTiers'] as List? ?? const [])
        .cast<Map<String, dynamic>>()
        .map(PriceTier.fromJson)
        .toList(growable: false),
    description: _text(json['description']),
    price: (json['price'] as num?)?.toDouble(),
    imageUrl: _text(json['imageUrl']),
    categoryId: _text(json['categoryId']),
    categoryName: _text(json['categoryName']),
    averageRating: (json['averageRating'] as num?)?.toDouble() ?? 0,
    reviewCount: (json['reviewCount'] as num?)?.toInt() ?? 0,
  );

  final String id;
  final String name;
  final String slug;
  final String unit;
  final int stockQuantity;
  final int minOrderQuantity;
  final List<PriceTier> priceTiers;
  final String? description;
  final double? price;
  final String? imageUrl;
  final String? categoryId;
  final String? categoryName;
  final double averageRating;
  final int reviewCount;
}

/// An empty string from the API means "not filled in", not "a value that is blank" - the
/// difference matters for an image URL or a description, where empty would render a hole.
String? _text(Object? value) {
  final s = value as String?;
  return (s == null || s.trim().isEmpty) ? null : s;
}
