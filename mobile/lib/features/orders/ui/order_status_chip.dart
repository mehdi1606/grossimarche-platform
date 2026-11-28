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

/// How the order is paid for, in the screen's language.
extension PaymentMethodText on PaymentMethod {
  String text(AppLocalizations l10n) => switch (this) {
    PaymentMethod.cod => l10n.cashOnDelivery,
    PaymentMethod.card => l10n.paymentCard,
  };
}

/// Where the money stands, in the screen's language.
extension PaymentStatusText on PaymentStatus {
  String text(AppLocalizations l10n) => switch (this) {
    PaymentStatus.awaitingPayment => l10n.paymentAwaiting,
    PaymentStatus.pendingOnDelivery => l10n.cashOnDelivery,
    PaymentStatus.paid => l10n.paymentPaid,
    PaymentStatus.failed => l10n.paymentFailed,
    PaymentStatus.refunded => l10n.paymentRefunded,
  };
}

/// What happened to the money, when that is worth a line of its own.
///
/// Drawn over the order's green header, so each pairing is a light pill with its meaning in
/// the colour: brass for "we are waiting", forest for "settled", red for a refusal, sand for
/// a refund - the same four meanings, and the same four colours, as [OrderStatusChip].
class PaymentStatusChip extends StatelessWidget {
  const PaymentStatusChip({super.key, required this.status});

  final PaymentStatus status;

  @override
  Widget build(BuildContext context) {
    final (bg, fg, icon) = switch (status) {
      PaymentStatus.paid => (
        AppTheme.forest100,
        AppTheme.forest700,
        Icons.check_circle_outline,
      ),
      PaymentStatus.failed => (
        Colors.white,
        AppTheme.danger,
        Icons.error_outline,
      ),
      PaymentStatus.refunded => (
        AppTheme.sand,
        AppTheme.muted,
        Icons.undo_outlined,
      ),
      PaymentStatus.awaitingPayment ||
      PaymentStatus.pendingOnDelivery => (
        AppTheme.brass50,
        AppTheme.brass,
        Icons.hourglass_top,
      ),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: fg),
          const SizedBox(width: 5),
          Text(
            status.text(context.l10n),
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w700,
              color: fg,
            ),
          ),
        ],
      ),
    );
  }
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
