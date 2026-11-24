import 'package:flutter/material.dart';

import '../../../core/i18n/language.dart';
import '../../../core/theme.dart';
import '../data/order_models.dart';

/// A status in the screen's language. The French wording matches the e-mails and push
/// notifications word for word; the Arabic is the same words, translated once by hand.
extension OrderStatusText on OrderStatus {
  String text(AppLocalizations l10n) => switch (this) {
    OrderStatus.pending => l10n.statusPending,
    OrderStatus.confirmed => l10n.statusConfirmed,
    OrderStatus.preparing => l10n.statusPreparing,
    OrderStatus.outForDelivery => l10n.statusOutForDelivery,
    OrderStatus.delivered => l10n.statusDelivered,
    OrderStatus.cancelled => l10n.statusCancelled,
  };
}

/// A status, coloured by what it means for the customer: waiting, moving, done, or stopped.
///
/// Four colours for six statuses on purpose. "Confirmée" and "En préparation" are the same
/// news to someone waiting for a delivery - it is moving - and giving each its own hue would
/// ask them to learn a legend for no gain.
class OrderStatusChip extends StatelessWidget {
  const OrderStatusChip({super.key, required this.status});

  final OrderStatus status;

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = switch (status) {
      OrderStatus.pending => (AppTheme.brass50, AppTheme.brass),
      OrderStatus.confirmed ||
      OrderStatus.preparing ||
      OrderStatus.outForDelivery => (AppTheme.forest100, AppTheme.forest700),
      OrderStatus.delivered => (AppTheme.emeraldDark, Colors.white),
      OrderStatus.cancelled => (AppTheme.sand, AppTheme.muted),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        status.text(context.l10n),
        style: TextStyle(
          fontSize: 11.5,
          fontWeight: FontWeight.w700,
          color: fg,
        ),
      ),
    );
  }
}
