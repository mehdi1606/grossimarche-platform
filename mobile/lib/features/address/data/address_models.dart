// Addresses, and the cities Market Food delivers to.

class Address {
  const Address({
    required this.id,
    required this.city,
    required this.addressLine,
    required this.isDefault,
    this.label,
    this.district,
  });

  factory Address.fromJson(Map<String, dynamic> json) => Address(
    id: json['id'] as String,
    city: json['city'] as String? ?? '',
    addressLine: json['addressLine'] as String? ?? '',
    isDefault: json['isDefault'] as bool? ?? false,
    label: _text(json['label']),
    district: _text(json['district']),
  );

  final String id;
  final String city;
  final String addressLine;
  final bool isDefault;
  final String? label;

  /// The district inside the city. Optional, and it is what picks the delivery rate when a
  /// city prices its rounds district by district.
  final String? district;

  String get summary => [
    addressLine,
    district,
    city,
  ].where((s) => s != null && s.isNotEmpty).join(', ');
}

class District {
  const District({required this.name, this.deliveryFee});

  factory District.fromJson(Map<String, dynamic> json) => District(
    name: json['name'] as String? ?? '',
    deliveryFee: (json['deliveryFee'] as num?)?.toDouble(),
  );

  final String name;

  /// Null means "the city's own rate applies" - not "free". The difference decides what the
  /// customer is quoted before they commit.
  final double? deliveryFee;
}

class DeliveryCity {
  const DeliveryCity({
    required this.name,
    required this.deliveryFee,
    required this.districts,
  });

  factory DeliveryCity.fromJson(Map<String, dynamic> json) => DeliveryCity(
    name: json['name'] as String? ?? '',
    deliveryFee: (json['deliveryFee'] as num?)?.toDouble() ?? 0,
    districts: (json['districts'] as List? ?? const [])
        .cast<Map<String, dynamic>>()
        .map(District.fromJson)
        .where((d) => d.name.isNotEmpty)
        .toList(growable: false),
  );

  final String name;
  final double deliveryFee;
  final List<District> districts;

  /// What delivering to [districtName] costs, falling back to the city's rate.
  double feeFor(String? districtName) {
    if (districtName == null) return deliveryFee;
    for (final d in districts) {
      if (d.name == districtName) return d.deliveryFee ?? deliveryFee;
    }
    return deliveryFee;
  }
}

String? _text(Object? value) {
  final s = value as String?;
  return (s == null || s.trim().isEmpty) ? null : s;
}
