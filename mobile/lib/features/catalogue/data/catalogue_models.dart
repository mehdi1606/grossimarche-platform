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
    this.nameAr,
    this.imageUrl,
    this.productCount = 0,
  });

  factory Category.fromJson(Map<String, dynamic> json) => Category(
    id: json['id'] as String,
    name: json['name'] as String? ?? '',
    slug: json['slug'] as String? ?? '',
    nameAr: _text(json['nameAr']),
    imageUrl: _text(json['imageUrl']),
    productCount: (json['productCount'] as num?)?.toInt() ?? 0,
  );

  final String id;
  final String name;
  final String slug;

  /// The Arabic the shop wrote itself: filled when the category was saved, and correctable in
  /// the back office. Null when nobody has translated this one yet - and only then does the
  /// app fall back to machine translation. See `TrText`.
  final String? nameAr;
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
    this.nameAr,
    this.price,
    this.imageUrl,
    this.hasQuantityDiscount = false,
    this.priceTiers = const [],
  });

  factory ProductSummary.fromJson(Map<String, dynamic> json) => ProductSummary(
    id: json['id'] as String,
    name: json['name'] as String? ?? '',
    slug: json['slug'] as String? ?? '',
    unit: json['unit'] as String? ?? '',
    inStock: json['inStock'] as bool? ?? false,
    minOrderQuantity: (json['minOrderQuantity'] as num?)?.toInt() ?? 1,
    nameAr: _text(json['nameAr']),
    price: (json['price'] as num?)?.toDouble(),
    imageUrl: _text(json['imageUrl']),
    hasQuantityDiscount: json['hasQuantityDiscount'] as bool? ?? false,
    priceTiers: _tiers(json['priceTiers']),
  );

  final String id;
  final String name;
  final String slug;
  final String unit;
  final bool inStock;
  final int minOrderQuantity;

  /// The shop's own Arabic name, or null when this product has not been translated yet.
  final String? nameAr;
  final double? price;
  final String? imageUrl;

  /// Whether buying more earns a better unit price - the heart of wholesale, and worth a
  /// badge in the list rather than a surprise on the product page.
  final bool hasQuantityDiscount;

  /// The ladder, as it travels with the summary. The badge alone says "there is a discount"
  /// without saying what it is, and a buyer scanning a grid wants the number.
  final List<PriceTier> priceTiers;

  /// The rung worth printing on the card: the cheapest unit price on offer.
  ///
  /// Null when there is no ladder, and also when this viewer has no prices at all - an
  /// account waiting for approval must not read a tier price under "Prix sur validation".
  PriceTier? get bestTier => price == null || priceTiers.isEmpty
      ? null
      : priceTiers.reduce((a, b) => b.unitPrice < a.unitPrice ? b : a);
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

/// One of the informational specs staff fill in - "Origine : Maroc", "Poids net : 25 kg".
///
/// Free text on both sides, in French only: there is no Arabic column behind these, so they
/// are the one part of a product page still left to the translation service.
class ProductAttribute {
  const ProductAttribute({
    required this.name,
    required this.value,
    this.displayOrder = 0,
  });

  factory ProductAttribute.fromJson(Map<String, dynamic> json) =>
      ProductAttribute(
        name: json['name'] as String? ?? '',
        value: json['value'] as String? ?? '',
        displayOrder: (json['displayOrder'] as num?)?.toInt() ?? 0,
      );

  final String name;
  final String value;

  /// The order the back office put the rows in; the product page follows it rather than
  /// whatever order the rows happen to come back in.
  final int displayOrder;
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
    this.nameAr,
    this.attributes = const [],
    this.description,
    this.descriptionAr,
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
    priceTiers: _tiers(json['priceTiers']),
    nameAr: _text(json['nameAr']),
    attributes: _attributes(json['attributes']),
    description: _text(json['description']),
    descriptionAr: _text(json['descriptionAr']),
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

  /// The shop's own Arabic, filled at write time: name and description both, when staff have
  /// got to this product. Null means "not translated", not "empty".
  final String? nameAr;

  /// The specs block, already in the order staff chose. Empty for most products.
  final List<ProductAttribute> attributes;
  final String? description;
  final String? descriptionAr;
  final double? price;
  final String? imageUrl;
  final String? categoryId;
  final String? categoryName;
  final double averageRating;
  final int reviewCount;
}

/// How `GET /products` orders the results.
///
/// [newest] is the server's own default (`relevance`, which ranks by creation date until a
/// real relevance rank exists), so it is the one value the app leaves out of the request.
enum ProductSort {
  newest('relevance'),
  priceAsc('price_asc'),
  priceDesc('price_desc'),
  alphabetical('name');

  const ProductSort(this.api);

  /// The value the `sort` parameter takes.
  final String api;
}

List<PriceTier> _tiers(Object? raw) => (raw as List? ?? const [])
    .cast<Map<String, dynamic>>()
    .map(PriceTier.fromJson)
    .toList(growable: false);

/// The specs, sorted the way the back office arranged them, and without the half-filled rows
/// a key with no value would draw as a hole.
List<ProductAttribute> _attributes(Object? raw) {
  final attributes =
      (raw as List? ?? const [])
          .cast<Map<String, dynamic>>()
          .map(ProductAttribute.fromJson)
          .where((a) => a.name.trim().isNotEmpty && a.value.trim().isNotEmpty)
          .toList()
        ..sort((a, b) => a.displayOrder.compareTo(b.displayOrder));
  return List.of(attributes, growable: false);
}

/// An empty string from the API means "not filled in", not "a value that is blank" - the
/// difference matters for an image URL or a description, where empty would render a hole.
String? _text(Object? value) {
  final s = value as String?;
  return (s == null || s.trim().isEmpty) ? null : s;
}
