import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../../../shared/paged_list.dart';
import '../data/order_models.dart';
import '../data/order_repository.dart';

final orderRepositoryProvider = Provider<OrderRepository>(
  (ref) => OrderRepository(ref.watch(apiClientProvider)),
);

/// This account's orders, newest first, a page at a time.
class OrdersNotifier extends AsyncNotifier<PagedList<OrderSummary>> {
  static const _pageSize = 20;

  @override
  Future<PagedList<OrderSummary>> build() async {
    ref.watch(accountKeyProvider);
    final first = await ref
        .watch(orderRepositoryProvider)
        .history(size: _pageSize);
    return PagedList(items: first.items, page: 0, last: first.last);
  }

  Future<void> loadMore() async {
    final current = state.value;
    if (current == null || !current.canLoadMore) return;
    state = AsyncData(current.copyWith(loadingMore: true));
    try {
      final next = await ref
          .read(orderRepositoryProvider)
          .history(page: current.page + 1, size: _pageSize);
      state = AsyncData(
        PagedList(
          items: [...current.items, ...next.items],
          page: current.page + 1,
          last: next.last,
        ),
      );
    } on OrderFailure catch (e) {
      state = AsyncData(
        current.copyWith(loadingMore: false, moreError: e.message),
      );
    }
  }
}

final ordersProvider =
    AsyncNotifierProvider<OrdersNotifier, PagedList<OrderSummary>>(
      OrdersNotifier.new,
    );

final orderStatsProvider = FutureProvider<OrderStats>((ref) {
  // Invalidated alongside ordersProvider: a new order, a cancellation, a pull to refresh.
  ref.watch(accountKeyProvider);
  return ref.watch(orderRepositoryProvider).stats();
});

final orderProvider = FutureProvider.family<OrderDetail, String>((ref, id) {
  ref.watch(accountKeyProvider);
  return ref.watch(orderRepositoryProvider).detail(id);
});
