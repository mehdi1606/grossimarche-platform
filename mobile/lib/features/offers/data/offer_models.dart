// Basket offers ("paniers"): several products sold together below the sum of their prices.
//
// A basket is a pricing rule, not an item. Nothing called "basket" ever enters the cart; its
// products do, and the server applies the saving once the cart holds all of them. The app
// mirrors that: "add the basket" means "add its products".

class OfferItem {
  const OfferItem({
    required this.productId,
    required this.name,
    required this.unit,
    required this.quantity,
    required this.available,
    this.imageUrl,
    this.lineTotal,
  });

  factory OfferItem.fromJson(Map<String, dynamic> json) => OfferItem(
    productId: json['productId'] as String,
    name: json['name'] as String? ?? '',
    unit: json['unit'] as String? ?? '',
    quantity: (json['quantity'] as num?)?.toInt() ?? 1,
    available: json['available'] as bool? ?? true,
    imageUrl: _text(json['imageUrl']),
    lineTotal: (json['lineTotal'] as num?)?.toDouble(),
  );

  final String productId;
  final String name;
  final String unit;
  final int quantity;
  final bool available;
  final String? imageUrl;
  final double? lineTotal;
}

class Offer {
  const Offer({
    required this.slug,
    required this.name,
    required this.items,
    required this.available,
    this.nameAr,
    this.description,
    this.descriptionAr,
    this.imageUrl,
    this.price,
    this.componentsTotal,
    this.savings = 0,
    this.savingsPercent = 0,
    this.endsAt,
  });

  factory Offer.fromJson(Map<String, dynamic> json) => Offer(
    slug: json['slug'] as String? ?? '',
    name: json['name'] as String? ?? '',
    items: (json['items'] as List? ?? const [])
        .cast<Map<String, dynamic>>()
        .map(OfferItem.fromJson)
        .toList(growable: false),
    available: json['available'] as bool? ?? false,
    nameAr: _text(json['nameAr']),
    description: _text(json['description']),
    descriptionAr: _text(json['descriptionAr']),
    imageUrl: _text(json['imageUrl']),
    price: (json['price'] as num?)?.toDouble(),
    componentsTotal: (json['componentsTotal'] as num?)?.toDouble(),
    savings: (json['savings'] as num?)?.toDouble() ?? 0,
    savingsPercent: (json['savingsPercent'] as num?)?.toInt() ?? 0,
    endsAt: (json['endsAt'] as String?) == null
        ? null
        : DateTime.tryParse(json['endsAt'] as String)?.toLocal(),
  );

  final String slug;
  final String name;
  final List<OfferItem> items;

  /// On sale right now: inside its dates, every product in stock, priced for this trade.
  final bool available;

  /// The Arabic the shop wrote when the basket was saved, name and description both, or null
  /// where nobody has translated it yet. The basket's own products carry no Arabic, so the
  /// contents list stays with the translation service.
  final String? nameAr;
  final String? description;
  final String? descriptionAr;
  final String? imageUrl;

  /// Null when the basket is not priced for this customer's trade - which means it is not
  /// for them at all. Such offers are filtered out rather than shown greyed: the same rule
  /// that keeps the announcement e-mail from reaching the wrong trades.
  final double? price;

  /// The products bought separately, for the struck-through comparison.
  final double? componentsTotal;
  final double savings;
  final int savingsPercent;
  final DateTime? endsAt;

  bool get isForThisCustomer => price != null;
}

String? _text(Object? value) {
  final s = value as String?;
  return (s == null || s.trim().isEmpty) ? null : s;
}
