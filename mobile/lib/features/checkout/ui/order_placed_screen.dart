import 'package:flutter/material.dart';

import '../../../core/i18n/language.dart';
import '../../../core/theme.dart';
import '../../../shared/money.dart';
import '../../orders/ui/order_detail_screen.dart';
import '../data/checkout_repository.dart';

/// The confirmation.
///
/// It shows the order number, because that is what a customer quotes on the phone when they
/// call about a delivery, and offers to follow the order rather than leaving them to find it.
class OrderPlacedScreen extends StatelessWidget {
  const OrderPlacedScreen({super.key, required this.order});

  final PlacedOrder order;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 88,
                height: 88,
                decoration: const BoxDecoration(
                  color: AppTheme.forest50,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check_rounded,
                  size: 48,
                  color: AppTheme.emeraldDark,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                l10n.orderPlacedTitle,
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                l10n.orderPlacedDetail,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppTheme.muted, height: 1.5),
              ),
              const SizedBox(height: 28),

              Container(
                padding: const EdgeInsets.all(18),
                decoration: AppTheme.card(radius: 18),
                child: Column(
                  children: [
                    Text(
                      l10n.orderNumber.toUpperCase(),
                      style: AppTheme.eyebrow,
                    ),
                    const SizedBox(height: 6),
                    SelectableText(
                      order.number,
                      style: const TextStyle(
                        fontSize: 19,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const Divider(height: 24, color: AppTheme.line),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Flexible(
                          child: Text(
                            l10n.totalOnDelivery,
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppTheme.muted,
                            ),
                          ),
                        ),
                        Text(
                          Money.of(order.total),
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.emeraldDark,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),
              FilledButton(
                onPressed: order.id.isEmpty
                    ? null
                    : () => Navigator.of(context).pushReplacement(
                        MaterialPageRoute(
                          builder: (_) => OrderDetailScreen(orderId: order.id),
                        ),
                      ),
                child: Text(l10n.trackOrder),
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () =>
                    Navigator.of(context).popUntil((route) => route.isFirst),
                style: TextButton.styleFrom(
                  foregroundColor: AppTheme.emeraldDark,
                ),
                child: Text(l10n.backToCatalogue),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
