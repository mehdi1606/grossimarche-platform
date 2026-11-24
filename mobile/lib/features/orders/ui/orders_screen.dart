import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/i18n/language.dart';
import '../../../core/i18n/tr_text.dart';
import '../../../core/theme.dart';
import '../../../shared/dates.dart';
import '../../../shared/load_more_footer.dart';
import '../../../shared/money.dart';
import '../../home/home_shell.dart';
import '../data/order_models.dart';
import 'order_detail_screen.dart';
import 'order_providers.dart';
import 'order_status_chip.dart';

/// Every order this account has placed, newest first, grouped by month under the counters.
class OrdersScreen extends ConsumerWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orders = ref.watch(ordersProvider);
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.ordersTitle)),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(ordersProvider);
          ref.invalidate(orderStatsProvider);
          await ref.read(ordersProvider.future);
        },
        child: orders.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(
            padding: const EdgeInsets.all(32),
            children: [
              const SizedBox(height: 80),
              const _Disc(icon: Icons.wifi_off),
              const SizedBox(height: 14),
              TrText('$e', textAlign: TextAlign.center),
              const SizedBox(height: 16),
              Center(
                child: OutlinedButton(
                  onPressed: () => ref.invalidate(ordersProvider),
                  child: Text(l10n.retry),
                ),
              ),
            ],
          ),
          // A ListView even when empty, so pull-to-refresh still works on a blank screen.
          data: (page) => page.items.isEmpty
              ? ListView(
                  padding: const EdgeInsets.all(32),
                  children: [
                    const SizedBox(height: 60),
                    const _Disc(icon: Icons.receipt_long_outlined),
                    const SizedBox(height: 18),
                    Text(
                      l10n.noOrders,
                      textAlign: TextAlign.center,
                      style: AppTheme.display(context, size: 20),
                    ),
                    const SizedBox(height: 18),
                    Center(
                      child: FilledButton(
                        onPressed: () =>
                            ref.read(homeTabProvider.notifier).go(0),
                        style: FilledButton.styleFrom(
                          minimumSize: const Size(220, 50),
                        ),
                        child: Text(l10n.discoverCatalogue),
                      ),
                    ),
                  ],
                )
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                  // Two extra rows: the counters on top, and at the end the footer that
                  // fetches the next page.
                  itemCount: page.items.length + 2,
                  itemBuilder: (context, row) {
                    if (row == 0) return const _Stats();
                    final i = row - 1;
                    if (i == page.items.length) {
                      return LoadMoreFooter(
                        hasMore: !page.last,
                        loading: page.loadingMore,
                        error: page.moreError,
                        onLoadMore: () =>
                            ref.read(ordersProvider.notifier).loadMore(),
                      );
                    }
                    final order = page.items[i];
                    // A month heading above the first order of each month.
                    final previous = i == 0
                        ? null
                        : page.items[i - 1].createdAt;
                    final newMonth =
                        previous == null ||
                        previous.month != order.createdAt.month ||
                        previous.year != order.createdAt.year;
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (newMonth)
                          Padding(
                            padding: const EdgeInsets.fromLTRB(4, 18, 4, 10),
                            child: Text(
                              Dates.monthYear(
                                context,
                                order.createdAt,
                              ).toUpperCase(),
                              style: AppTheme.eyebrow,
                            ),
                          ),
                        _OrderCard(order: order),
                        const SizedBox(height: 10),
                      ],
                    );
                  },
                ),
        ),
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  const _OrderCard({required this.order});

  final OrderSummary order;

  @override
  Widget build(BuildContext context) {
    final (bg, fg, icon) = switch (order.status) {
      OrderStatus.pending => (
        AppTheme.brass50,
        AppTheme.brass,
        Icons.hourglass_top,
      ),
      OrderStatus.confirmed => (
        AppTheme.forest50,
        AppTheme.emeraldDark,
        Icons.task_alt,
      ),
      OrderStatus.preparing => (
        AppTheme.forest50,
        AppTheme.emeraldDark,
        Icons.inventory_2_outlined,
      ),
      OrderStatus.outForDelivery => (
        AppTheme.forest100,
        AppTheme.forest700,
        Icons.local_shipping_outlined,
      ),
      OrderStatus.delivered => (
        AppTheme.emeraldDark,
        Colors.white,
        Icons.check,
      ),
      OrderStatus.cancelled => (AppTheme.sand, AppTheme.muted, Icons.block),
    };

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => OrderDetailScreen(orderId: order.id),
          ),
        ),
        child: Ink(
          padding: const EdgeInsets.all(14),
          decoration: AppTheme.card(),
          child: Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: bg,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: fg, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      order.number,
                      textDirection: TextDirection.ltr,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '${Dates.day(context, order.createdAt)} · ${Dates.time(context, order.createdAt)}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppTheme.muted,
                      ),
                    ),
                    const SizedBox(height: 8),
                    OrderStatusChip(status: order.status),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    Money.of(order.total),
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 16,
                      color: AppTheme.emeraldDark,
                    ),
                  ),
                  const SizedBox(height: 14),
                  Icon(Icons.chevron_right, color: AppTheme.muted),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// The whole history in four numbers - counted by the server, not from the page loaded here,
/// which holds only the latest twenty orders.
class _Stats extends ConsumerWidget {
  const _Stats();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stats = ref.watch(orderStatsProvider).value;
    if (stats == null) return const SizedBox.shrink();
    final l10n = context.l10n;

    Widget counter(String label, int value) => Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          children: [
            Text(
              '$value',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 11.5, color: Colors.white70),
            ),
          ],
        ),
      ),
    );

    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      padding: const EdgeInsets.all(16),
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
              const Icon(
                Icons.receipt_long,
                color: AppTheme.brassLight,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                l10n.statsTotal,
                style: const TextStyle(
                  color: Colors.white70,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Spacer(),
              Text(
                l10n.orderCount(stats.total),
                style: AppTheme.display(
                  context,
                  size: 20,
                  colour: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              counter(l10n.statsPending, stats.pending),
              const SizedBox(width: 8),
              counter(l10n.statsInProgress, stats.inProgress),
              const SizedBox(width: 8),
              counter(l10n.statsDelivered, stats.delivered),
            ],
          ),
        ],
      ),
    );
  }
}

class _Disc extends StatelessWidget {
  const _Disc({required this.icon});

  final IconData icon;

  @override
  Widget build(BuildContext context) => Center(
    child: Container(
      width: 84,
      height: 84,
      decoration: const BoxDecoration(
        color: AppTheme.sand,
        shape: BoxShape.circle,
      ),
      child: Icon(icon, size: 38, color: AppTheme.muted),
    ),
  );
}
