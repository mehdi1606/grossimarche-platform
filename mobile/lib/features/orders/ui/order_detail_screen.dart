import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/i18n/language.dart';
import '../../../core/i18n/tr_text.dart';
import '../../../core/theme.dart';
import '../../../shared/dates.dart';
import '../../../shared/money.dart';
import '../data/order_models.dart';
import '../data/order_repository.dart';
import '../../cart/ui/cart_screen.dart';
import 'invoice_actions.dart';
import 'order_providers.dart';
import 'order_status_chip.dart';
import 'reorder.dart';

/// One order: where it is, what is in it, what it costs.
///
/// This is the screen a push notification opens, so it must stand on its own - reached
/// straight from the lock screen, with no catalogue behind it to explain anything.
class OrderDetailScreen extends ConsumerWidget {
  const OrderDetailScreen({super.key, required this.orderId});

  final String orderId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final order = ref.watch(orderProvider(orderId));

    return Scaffold(
      appBar: AppBar(title: Text(context.l10n.orderTitle)),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(orderProvider(orderId));
          await ref.read(orderProvider(orderId).future);
        },
        child: order.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(
            children: [
              const SizedBox(height: 120),
              Center(child: TrText('$e', textAlign: TextAlign.center)),
              const SizedBox(height: 16),
              Center(
                child: OutlinedButton(
                  onPressed: () => ref.invalidate(orderProvider(orderId)),
                  child: Text(context.l10n.retry),
                ),
              ),
            ],
          ),
          data: (o) => _Body(order: o),
        ),
      ),
    );
  }
}

class _Body extends ConsumerStatefulWidget {
  const _Body({required this.order});

  final OrderDetail order;

  @override
  ConsumerState<_Body> createState() => _BodyState();
}

class _BodyState extends ConsumerState<_Body> {
  bool _cancelling = false;
  bool _reordering = false;

  Future<void> _reorder() async {
    final l10n = context.l10n;
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    setState(() => _reordering = true);
    try {
      final result = await reorder(ref, widget.order);
      if (!mounted) return;
      final text = result.added == 0
          ? l10n.reorderNothing
          : [
              l10n.reorderAdded(result.added),
              if (result.skipped.isNotEmpty)
                l10n.reorderSkipped(result.skipped.join(', ')),
            ].join('\n');
      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            content: Text(text),
            action: result.added == 0
                ? null
                : SnackBarAction(
                    label: l10n.see,
                    onPressed: () => navigator.push(
                      MaterialPageRoute(builder: (_) => const CartScreen()),
                    ),
                  ),
          ),
        );
    } finally {
      if (mounted) setState(() => _reordering = false);
    }
  }

  Future<void> _cancel() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(context.l10n.cancelOrderQuestion),
        content: Text(context.l10n.cancelOrderDetail),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(context.l10n.keep),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red.shade700),
            child: Text(context.l10n.cancelOrder),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _cancelling = true);
    try {
      await ref.read(orderRepositoryProvider).cancel(widget.order.id);
      ref.invalidate(orderProvider(widget.order.id));
      ref.invalidate(ordersProvider);
      ref.invalidate(orderStatsProvider);
    } on OrderFailure catch (e) {
      // The commonest refusal is a race: the shop confirmed it a moment before the tap.
      // The server's sentence says exactly that, and a refresh shows the new status.
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: TrText(e.message)));
        ref.invalidate(orderProvider(widget.order.id));
      }
    } finally {
      if (mounted) setState(() => _cancelling = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final o = widget.order;
    final l10n = context.l10n;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
      children: [
        // The order at a glance: its number (what a customer quotes on the phone), where it
        // stands, and what it costs.
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: AppTheme.forestGradient,
            borderRadius: BorderRadius.circular(22),
            boxShadow: AppTheme.shadow,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      l10n.orderNumber.toUpperCase(),
                      style: AppTheme.eyebrow.copyWith(
                        color: AppTheme.brassLight,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: OrderStatusChip(status: o.status),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              SelectableText(
                o.number,
                textDirection: TextDirection.ltr,
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                  letterSpacing: 0.4,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                l10n.placedOn(Dates.dayTime(context, o.createdAt)),
                style: const TextStyle(fontSize: 12.5, color: Colors.white70),
              ),
              const SizedBox(height: 14),
              Container(height: 1, color: Colors.white24),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(
                    Icons.payments_outlined,
                    size: 18,
                    color: AppTheme.brassLight,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      l10n.cashOnDelivery,
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 13,
                      ),
                    ),
                  ),
                  Text(
                    Money.of(o.total),
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      fontSize: 20,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),
        _Panel(
          children: [
            o.status == OrderStatus.cancelled
                ? _CancelledNotice(at: o.reachedAt(OrderStatus.cancelled))
                : _Journey(order: o),
          ],
        ),

        const SizedBox(height: 16),
        _Panel(
          children: [
            _Title(l10n.items),
            const SizedBox(height: 6),
            for (final line in o.lines)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          TrText(
                            line.name,
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                          Text(
                            '${line.quantity} ${line.unit} × ${Money.of(line.unitPrice)}',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppTheme.muted,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      Money.of(line.lineTotal),
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ),

            const Divider(height: 24, color: AppTheme.line),
            _Amount(l10n.subtotal, Money.of(o.subtotal)),
            if (o.discountTotal > 0)
              _Amount(l10n.bundleDiscount, '- ${Money.of(o.discountTotal)}'),
            if (o.couponDiscount > 0)
              _Amount(l10n.couponDiscount, '- ${Money.of(o.couponDiscount)}'),
            _Amount(
              l10n.delivery,
              o.deliveryFee > 0 ? Money.of(o.deliveryFee) : l10n.free,
            ),
            const SizedBox(height: 4),
            _Amount(l10n.total, Money.of(o.total), big: true),
            const SizedBox(height: 2),
            Text(
              l10n.cashOnDelivery,
              style: const TextStyle(fontSize: 12, color: AppTheme.muted),
            ),
          ],
        ),
        const SizedBox(height: 16),
        InvoiceActions(order: o),
        const SizedBox(height: 10),
        FilledButton.icon(
          onPressed: _reordering ? null : _reorder,
          icon: _reordering
              ? const SizedBox(
                  height: 18,
                  width: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : const Icon(Icons.replay),
          label: Text(l10n.reorder),
        ),

        if (o.address != null) ...[
          const SizedBox(height: 16),
          _Panel(
            children: [
              _Title(l10n.delivery),
              const SizedBox(height: 8),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.place_outlined,
                    size: 18,
                    color: AppTheme.emeraldDark,
                  ),
                  const SizedBox(width: 8),
                  Expanded(child: Text(o.address!)),
                ],
              ),
            ],
          ),
        ],

        if (o.note != null) ...[
          const SizedBox(height: 14),
          Text(
            l10n.noteLabel(o.note!),
            style: const TextStyle(fontSize: 13, color: AppTheme.muted),
          ),
        ],

        if (o.cancellable) ...[
          const SizedBox(height: 28),
          OutlinedButton(
            onPressed: _cancelling ? null : _cancel,
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.red.shade700,
              side: BorderSide(color: Colors.red.shade200),
              minimumSize: const Size.fromHeight(48),
            ),
            child: _cancelling
                ? const SizedBox(
                    height: 18,
                    width: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(l10n.cancelOrder),
          ),
          const SizedBox(height: 6),
          Text(
            l10n.cancelPossible,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 11.5, color: AppTheme.muted),
          ),
        ],
        const SizedBox(height: 24),
      ],
    );
  }
}

/// The five steps from "placed" to "delivered", with when each one happened.
///
/// A vertical track rather than a single status line: the customer's real question is
/// "how far along is it", and only seeing the steps still to come answers that.
class _Journey extends StatelessWidget {
  const _Journey({required this.order});

  final OrderDetail order;

  @override
  Widget build(BuildContext context) {
    final current = OrderStatus.journey.indexOf(order.status);

    return Column(
      children: [
        for (final (i, step) in OrderStatus.journey.indexed)
          _Step(
            label: step.text(context.l10n),
            at: order.reachedAt(step),
            done: i <= current,
            isCurrent: i == current,
            isLast: i == OrderStatus.journey.length - 1,
          ),
      ],
    );
  }
}

class _Step extends StatelessWidget {
  const _Step({
    required this.label,
    required this.at,
    required this.done,
    required this.isCurrent,
    required this.isLast,
  });

  final String label;
  final DateTime? at;
  final bool done;
  final bool isCurrent;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final colour = done ? AppTheme.emeraldDark : AppTheme.line;

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 24,
            child: Column(
              children: [
                Container(
                  width: isCurrent ? 18 : 14,
                  height: isCurrent ? 18 : 14,
                  margin: EdgeInsets.only(top: isCurrent ? 1 : 3),
                  decoration: BoxDecoration(
                    color: done ? colour : Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(color: colour, width: 2),
                  ),
                  child: done && !isCurrent
                      ? const Icon(Icons.check, size: 9, color: Colors.white)
                      : null,
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: colour,
                      margin: const EdgeInsets.symmetric(vertical: 2),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontWeight: isCurrent ? FontWeight.w800 : FontWeight.w500,
                      color: done ? AppTheme.ink : AppTheme.muted,
                    ),
                  ),
                  if (done && at != null)
                    Text(
                      Dates.shortDayTime(context, at!),
                      style: const TextStyle(
                        fontSize: 11.5,
                        color: AppTheme.muted,
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CancelledNotice extends StatelessWidget {
  const _CancelledNotice({this.at});

  final DateTime? at;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: AppTheme.sand,
      borderRadius: BorderRadius.circular(12),
    ),
    child: Row(
      children: [
        const Icon(Icons.block, color: AppTheme.muted),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            at == null
                ? context.l10n.orderCancelled
                : context.l10n.orderCancelledOn(
                    Dates.shortDayTime(context, at!),
                  ),
            style: const TextStyle(color: AppTheme.muted),
          ),
        ),
      ],
    ),
  );
}

class _Title extends StatelessWidget {
  const _Title(this.text);

  final String text;

  @override
  Widget build(BuildContext context) =>
      Text(text.toUpperCase(), style: AppTheme.eyebrow);
}

class _Amount extends StatelessWidget {
  const _Amount(this.label, this.value, {this.big = false});

  final String label;
  final String value;
  final bool big;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 3),
    child: Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: big ? 16 : 13,
            fontWeight: big ? FontWeight.w700 : FontWeight.w400,
            color: big ? AppTheme.ink : AppTheme.muted,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: big ? 19 : 13,
            fontWeight: big ? FontWeight.w800 : FontWeight.w600,
            color: big ? AppTheme.emeraldDark : AppTheme.ink,
          ),
        ),
      ],
    ),
  );
}

/// One section of the order, in a white card on the cream page.
class _Panel extends StatelessWidget {
  const _Panel({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: AppTheme.card(),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: children,
    ),
  );
}
