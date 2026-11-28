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

    test('reads how the order is paid for, and for which code', () {
      final o = OrderDetail.fromJson({
        ...order('DELIVERED'),
        'paymentMethod': 'CARD',
        'paymentStatus': 'PAID',
        'couponCode': 'RENTREE10',
        'couponDiscount': 12.5,
      });
      expect(o.paymentMethod, PaymentMethod.card);
      expect(o.paymentStatus, PaymentStatus.paid);
      expect(o.couponCode, 'RENTREE10');
    });

    test('falls back to cash on delivery, which every order of this shop is', () {
      // The fields are absent from an older server, and unknown values are possible from a
      // newer one; neither may turn a cash order into something the screen cannot describe.
      final o = OrderDetail.fromJson(order('PENDING'));
      expect(o.paymentMethod, PaymentMethod.cod);
      expect(o.paymentStatus, PaymentStatus.pendingOnDelivery);
      expect(o.couponCode, isNull);
    });
  });

  group('PaymentStatus', () {
    test('maps every state the API sends', () {
      expect(
        PaymentStatus.parse('AWAITING_PAYMENT'),
        PaymentStatus.awaitingPayment,
      );
      expect(
        PaymentStatus.parse('PENDING_ON_DELIVERY'),
        PaymentStatus.pendingOnDelivery,
      );
      expect(PaymentStatus.parse('PAID'), PaymentStatus.paid);
      expect(PaymentStatus.parse('FAILED'), PaymentStatus.failed);
      expect(PaymentStatus.parse('REFUNDED'), PaymentStatus.refunded);
      expect(PaymentStatus.parse('SOMETHING_NEW'), PaymentStatus.pendingOnDelivery);
    });

    test('is only shown when it says more than the total already does', () {
      expect(PaymentStatus.pendingOnDelivery.isWorthShowing, isFalse);
      expect(PaymentStatus.paid.isWorthShowing, isTrue);
      expect(PaymentStatus.failed.isWorthShowing, isTrue);
      expect(PaymentStatus.refunded.isWorthShowing, isTrue);
      expect(PaymentStatus.awaitingPayment.isWorthShowing, isTrue);
    });
  });
}
