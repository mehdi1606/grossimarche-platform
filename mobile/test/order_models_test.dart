import 'package:flutter_test/flutter_test.dart';
import 'package:market_food/features/orders/data/order_models.dart';

void main() {
  group('OrderStatus', () {
    test('maps every status the API sends', () {
      expect(OrderStatus.parse('PENDING'), OrderStatus.pending);
      expect(OrderStatus.parse('CONFIRMED'), OrderStatus.confirmed);
      expect(OrderStatus.parse('PREPARING'), OrderStatus.preparing);
      expect(OrderStatus.parse('OUT_FOR_DELIVERY'), OrderStatus.outForDelivery);
      expect(OrderStatus.parse('DELIVERED'), OrderStatus.delivered);
      expect(OrderStatus.parse('CANCELLED'), OrderStatus.cancelled);
    });

    test('uses the same wording as the e-mails', () {
      expect(OrderStatus.outForDelivery.label, 'En cours de livraison');
      expect(OrderStatus.preparing.label, 'En préparation');
    });
  });

  group('OrderDetail', () {
    Map<String, dynamic> order(String status) => {
      'id': 'o1',
      'orderNumber': 'GM-261012-ABC',
      'status': status,
      'subtotal': 100,
      'discountTotal': 0,
      'deliveryFee': 20,
      'total': 120,
      'items': [
        {
          'productName': 'Riz',
          'unit': 'kg',
          'quantity': 5,
          'unitPrice': 20,
          'lineTotal': 100,
        },
      ],
      'timeline': [
        {'status': 'PENDING', 'createdAt': '2026-10-12T08:00:00Z'},
        {'status': 'CONFIRMED', 'createdAt': '2026-10-12T09:30:00Z'},
      ],
      'deliveryAddress': {'addressLine': '12 rue X', 'city': 'Mohammedia'},
      'createdAt': '2026-10-12T08:00:00Z',
    };

    test('reads lines, totals and the address snapshot', () {
      final o = OrderDetail.fromJson(order('CONFIRMED'));
      expect(o.lines.single.quantity, 5);
      expect(o.total, 120);
      expect(o.address, '12 rue X, Mohammedia');
    });

    test('can be cancelled only while pending, as the server enforces', () {
      expect(OrderDetail.fromJson(order('PENDING')).cancellable, isTrue);
      expect(OrderDetail.fromJson(order('CONFIRMED')).cancellable, isFalse);
      expect(OrderDetail.fromJson(order('DELIVERED')).cancellable, isFalse);
    });

    test('knows when each step was reached, and not the ones to come', () {
      final o = OrderDetail.fromJson(order('CONFIRMED'));
      expect(o.reachedAt(OrderStatus.confirmed), isNotNull);
      expect(o.reachedAt(OrderStatus.preparing), isNull);
    });
  });
}
