// Orders, as the customer follows them.

/// Where an order stands.
///
/// The wording matches the e-mails and the push notifications word for word. A customer who
/// reads "En préparation" in their inbox and "Processing" in the app would reasonably wonder
/// whether it is the same order.
enum OrderStatus {
  pending('En attente de validation'),
  confirmed('Confirmée'),
  preparing('En préparation'),
  outForDelivery('En cours de livraison'),
  delivered('Livrée'),
  cancelled('Annulée');

  const OrderStatus(this.label);

  final String label;

  static OrderStatus parse(String? raw) => switch (raw) {
    'CONFIRMED' => confirmed,
    'PREPARING' => preparing,
    'OUT_FOR_DELIVERY' => outForDelivery,
    'DELIVERED' => delivered,
    'CANCELLED' => cancelled,
    _ => pending,
  };

  /// The happy path, in order - what the progress track on the detail screen walks along.
  static const journey = [
    pending,
    confirmed,
    preparing,
    outForDelivery,
    delivered,
  ];

  bool get isFinished => this == delivered || this == cancelled;
}

/// How the order is paid for.
///
/// The app only ever places cash-on-delivery orders, but the server also knows card orders
/// taken through the CMI gateway. An order paid by card must not be labelled "paiement à la
/// livraison" in the app, so the method is read rather than assumed.
enum PaymentMethod {
  cod,
  card;

  /// Anything unknown is read as cash on delivery: it is what every order of this shop is,
  /// and the worst a new server value can then do is be described as the norm.
  static PaymentMethod parse(String? raw) =>
      raw == 'CARD' ? PaymentMethod.card : PaymentMethod.cod;
}

/// Where the money stands, which is not where the order stands.
enum PaymentStatus {
  awaitingPayment,
  pendingOnDelivery,
  paid,
  failed,
  refunded;

  static PaymentStatus parse(String? raw) => switch (raw) {
    'AWAITING_PAYMENT' => awaitingPayment,
    'PAID' => paid,
    'FAILED' => failed,
    'REFUNDED' => refunded,
    _ => pendingOnDelivery,
  };

  /// Whether saying it adds anything.
  ///
  /// "À régler à la livraison" is the ordinary case and is already written under the total;
  /// repeating it as a badge would only teach the customer to ignore the badge. Paid, failed,
  /// refunded and "waiting for your card payment" are each news.
  bool get isWorthShowing => this != pendingOnDelivery;
}

/// The counters at the top of the order history, from one grouped query on the server.
class OrderStats {
  const OrderStats({
    required this.total,
    required this.pending,
    required this.inProgress,
    required this.delivered,
  });

  factory OrderStats.fromJson(Map<String, dynamic> json) => OrderStats(
    total: (json['total'] as num?)?.toInt() ?? 0,
    pending: (json['pending'] as num?)?.toInt() ?? 0,
    inProgress: (json['inProgress'] as num?)?.toInt() ?? 0,
    delivered: (json['delivered'] as num?)?.toInt() ?? 0,
  );

  final int total;
  final int pending;

  /// Confirmed, being prepared, or on the way - "it is moving".
  final int inProgress;
  final int delivered;
}

class OrderSummary {
  const OrderSummary({
    required this.id,
    required this.number,
    required this.status,
    required this.total,
    required this.createdAt,
  });

  factory OrderSummary.fromJson(Map<String, dynamic> json) => OrderSummary(
    id: json['id'] as String,
    number: json['orderNumber'] as String? ?? '',
    status: OrderStatus.parse(json['status'] as String?),
    total: (json['total'] as num?)?.toDouble() ?? 0,
    createdAt: _instant(json['createdAt']),
  );

  final String id;
  final String number;
  final OrderStatus status;
  final double total;
  final DateTime createdAt;
}

class OrderLine {
  const OrderLine({
    this.productId,
    required this.name,
    required this.unit,
    required this.quantity,
    required this.unitPrice,
    required this.lineTotal,
  });

  factory OrderLine.fromJson(Map<String, dynamic> json) => OrderLine(
    productId: json['productId'] as String?,
    name: json['productName'] as String? ?? '',
    unit: json['unit'] as String? ?? '',
    quantity: (json['quantity'] as num?)?.toInt() ?? 0,
    unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0,
    lineTotal: (json['lineTotal'] as num?)?.toDouble() ?? 0,
  );

  /// Null only for a product deleted since; such a line cannot be ordered again.
  final String? productId;
  final String name;
  final String unit;
  final int quantity;

  /// The price frozen at checkout - not today's. An order is a record of what was agreed.
  final double unitPrice;
  final double lineTotal;
}

class TimelineEntry {
  const TimelineEntry({required this.status, required this.at, this.note});

  factory TimelineEntry.fromJson(Map<String, dynamic> json) => TimelineEntry(
    status: OrderStatus.parse(json['status'] as String?),
    at: _instant(json['createdAt']),
    note: _text(json['note']),
  );

  final OrderStatus status;
  final DateTime at;
  final String? note;
}

class OrderDetail {
  const OrderDetail({
    required this.id,
    required this.number,
    required this.status,
    required this.subtotal,
    required this.discountTotal,
    required this.deliveryFee,
    required this.total,
    required this.lines,
    required this.timeline,
    required this.createdAt,
    this.paymentMethod = PaymentMethod.cod,
    this.paymentStatus = PaymentStatus.pendingOnDelivery,
    this.couponCode,
    this.couponDiscount = 0,
    this.note,
    this.address,
  });

  factory OrderDetail.fromJson(Map<String, dynamic> json) {
    final address = (json['deliveryAddress'] as Map?)?.cast<String, dynamic>();
    return OrderDetail(
      id: json['id'] as String,
      number: json['orderNumber'] as String? ?? '',
      status: OrderStatus.parse(json['status'] as String?),
      paymentMethod: PaymentMethod.parse(json['paymentMethod'] as String?),
      paymentStatus: PaymentStatus.parse(json['paymentStatus'] as String?),
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0,
      discountTotal: (json['discountTotal'] as num?)?.toDouble() ?? 0,
      couponCode: _text(json['couponCode']),
      couponDiscount: (json['couponDiscount'] as num?)?.toDouble() ?? 0,
      deliveryFee: (json['deliveryFee'] as num?)?.toDouble() ?? 0,
      total: (json['total'] as num?)?.toDouble() ?? 0,
      lines: (json['items'] as List? ?? const [])
          .cast<Map<String, dynamic>>()
          .map(OrderLine.fromJson)
          .toList(growable: false),
      timeline: (json['timeline'] as List? ?? const [])
          .cast<Map<String, dynamic>>()
          .map(TimelineEntry.fromJson)
          .toList(growable: false),
      createdAt: _instant(json['createdAt']),
      note: _text(json['note']),
      address: address == null
          ? null
          : [
              address['addressLine'],
              address['city'],
            ].whereType<String>().where((s) => s.trim().isNotEmpty).join(', '),
    );
  }

  final String id;
  final String number;
  final OrderStatus status;
  final PaymentMethod paymentMethod;
  final PaymentStatus paymentStatus;
  final double subtotal;
  final double discountTotal;

  /// The code the customer typed at checkout, kept beside its discount so the line says which
  /// code earned it - the question a shopkeeper asks when the discount is not what they
  /// expected.
  final String? couponCode;
  final double couponDiscount;
  final double deliveryFee;
  final double total;
  final List<OrderLine> lines;
  final List<TimelineEntry> timeline;
  final DateTime createdAt;
  final String? note;

  /// The address as captured at checkout - a snapshot, so editing an address later does not
  /// rewrite where a past order was delivered.
  final String? address;

  /// A customer may cancel only while nobody has looked at the order yet. Once confirmed,
  /// goods are being picked; the server refuses past this point and so does the button.
  bool get cancellable => status == OrderStatus.pending;

  /// When the order reached [s], if it did.
  DateTime? reachedAt(OrderStatus s) {
    for (final e in timeline) {
      if (e.status == s) return e.at;
    }
    return s == OrderStatus.pending ? createdAt : null;
  }
}

/// Instants arrive as ISO-8601 in UTC and are shown in the phone's own time: an order placed
/// at 9:00 in Casablanca must not read 8:00.
DateTime _instant(Object? raw) =>
    (raw is String ? DateTime.tryParse(raw) : null)?.toLocal() ??
    DateTime.now();

String? _text(Object? value) {
  final s = value as String?;
  return (s == null || s.trim().isEmpty) ? null : s;
}
