// The cart, as the server computes it.
//
// Nothing here is calculated on the phone. Quantity ladders, bundle discounts and the
// delivery fee all depend on the customer's trade and on rules that change in the back
// office; a total worked out locally would eventually disagree with the one charged, and the
// customer would be right to trust theirs.

class CartItem {
  const CartItem({
    required this.productId,
    required this.name,
    required this.unit,
    required this.quantity,
    required this.effectiveUnitPrice,
    required this.lineTotal,
    required this.availableStock,
    required this.priceChanged,
    required this.stockIssue,
    this.unitPrice,
    this.imageUrl,
  });

  factory CartItem.fromJson(Map<String, dynamic> json) => CartItem(
    productId: json['productId'] as String,
    name: json['name'] as String? ?? '',
    unit: json['unit'] as String? ?? '',
    quantity: (json['quantity'] as num?)?.toInt() ?? 0,
    effectiveUnitPrice: (json['effectiveUnitPrice'] as num?)?.toDouble() ?? 0,
    lineTotal: (json['lineTotal'] as num?)?.toDouble() ?? 0,
    availableStock: (json['availableStock'] as num?)?.toInt() ?? 0,
    priceChanged: json['priceChanged'] as bool? ?? false,
    stockIssue: json['stockIssue'] as bool? ?? false,
    unitPrice: (json['unitPrice'] as num?)?.toDouble(),
    imageUrl: (json['imageUrl'] as String?)?.trim().isEmpty ?? true
        ? null
        : json['imageUrl'] as String,
  );

  final String productId;
  final String name;
  final String unit;
  final int quantity;

  /// What this quantity actually costs per unit - the ladder rung the quantity earned.
  final double effectiveUnitPrice;
  final double lineTotal;
  final int availableStock;

  /// The server noticed the price moved since the line was added. Worth saying out loud:
  /// a buyer who added rice at 11 DH last night should not discover 13 DH on the invoice.
  final bool priceChanged;

  /// More was asked for than is in stock. Checkout refuses until it is fixed.
  final bool stockIssue;

  /// The list price before the ladder, when the two differ.
  final double? unitPrice;
  final String? imageUrl;

  bool get hasDiscount =>
      unitPrice != null && unitPrice! > effectiveUnitPrice + 0.001;
}

class Cart {
  const Cart({
    required this.items,
    required this.subtotal,
    required this.discountTotal,
    required this.deliveryFee,
    required this.total,
  });

  factory Cart.fromJson(Map<String, dynamic> json) => Cart(
    items: (json['items'] as List? ?? const [])
        .cast<Map<String, dynamic>>()
        .map(CartItem.fromJson)
        .toList(growable: false),
    subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0,
    discountTotal: (json['discountTotal'] as num?)?.toDouble() ?? 0,
    deliveryFee: (json['deliveryFee'] as num?)?.toDouble() ?? 0,
    total: (json['total'] as num?)?.toDouble() ?? 0,
  );

  const Cart.empty()
    : items = const [],
      subtotal = 0,
      discountTotal = 0,
      deliveryFee = 0,
      total = 0;

  final List<CartItem> items;
  final double subtotal;

  /// Bundle savings, applied by the server when the cart holds every component of an offer.
  final double discountTotal;
  final double deliveryFee;
  final double total;

  bool get isEmpty => items.isEmpty;

  int get count => items.fold(0, (sum, item) => sum + item.quantity);

  /// Any line the server flagged as short of stock. Checkout is blocked while true.
  bool get hasStockIssue => items.any((i) => i.stockIssue);
}
