import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../../../shared/paged_list.dart';
import '../data/catalogue_models.dart';
import '../data/catalogue_repository.dart';

final catalogueRepositoryProvider = Provider<CatalogueRepository>(
  (ref) => CatalogueRepository(ref.watch(apiClientProvider)),
);

final categoriesProvider = FutureProvider<List<Category>>(
  (ref) => ref.watch(catalogueRepositoryProvider).categories(),
);

/// What the catalogue is currently filtered by.
///
/// A record rather than two separate providers: the two change together, and keeping them
/// apart would fire two reloads for what the customer experiences as one action.
typedef CatalogueFilter = ({String? categoryId, String query});

class CatalogueFilterNotifier extends Notifier<CatalogueFilter> {
  @override
  CatalogueFilter build() {
    // A new account starts from the whole catalogue, not the previous customer's search.
    ref.watch(accountKeyProvider);
    return (categoryId: null, query: '');
  }

  void category(String? id) => state = (categoryId: id, query: state.query);

  void search(String text) =>
      state = (categoryId: state.categoryId, query: text);

  void clear() => state = (categoryId: null, query: '');
}

final catalogueFilterProvider =
    NotifierProvider<CatalogueFilterNotifier, CatalogueFilter>(
      CatalogueFilterNotifier.new,
    );

/// The products for the current filter, a page at a time.
///
/// Rebuilt from the first page when the filter or the account changes: prices are per trade,
/// so a list loaded for one customer is wrong for the next.
class ProductsNotifier extends AsyncNotifier<PagedList<ProductSummary>> {
  static const _pageSize = 30;

  @override
  Future<PagedList<ProductSummary>> build() async {
    ref.watch(accountKeyProvider);
    final filter = ref.watch(catalogueFilterProvider);
    final first = await ref
        .watch(catalogueRepositoryProvider)
        .products(
          categoryId: filter.categoryId,
          query: filter.query,
          size: _pageSize,
        );
    return PagedList(items: first.items, page: 0, last: first.last);
  }

  Future<void> loadMore() async {
    final current = state.value;
    if (current == null || !current.canLoadMore) return;
    final filter = ref.read(catalogueFilterProvider);
    state = AsyncData(current.copyWith(loadingMore: true));
    try {
      final next = await ref
          .read(catalogueRepositoryProvider)
          .products(
            categoryId: filter.categoryId,
            query: filter.query,
            page: current.page + 1,
            size: _pageSize,
          );
      // The filter may have changed while this page was on its way; appending it to a list
      // built for another filter would mix two searches together.
      if (ref.read(catalogueFilterProvider) != filter) return;
      state = AsyncData(
        PagedList(
          items: [...current.items, ...next.items],
          page: current.page + 1,
          last: next.last,
        ),
      );
    } on CatalogueFailure catch (e) {
      state = AsyncData(
        current.copyWith(loadingMore: false, moreError: e.message),
      );
    }
  }
}

final productsProvider =
    AsyncNotifierProvider<ProductsNotifier, PagedList<ProductSummary>>(
      ProductsNotifier.new,
    );

/// Other products of the same category, as the website's "Produits similaires".
final similarProductsProvider =
    FutureProvider.family<
      List<ProductSummary>,
      ({String productId, String? categoryId})
    >((ref, key) async {
      ref.watch(accountKeyProvider);
      final categoryId = key.categoryId;
      if (categoryId == null) return const [];
      final page = await ref
          .watch(catalogueRepositoryProvider)
          .products(categoryId: categoryId, size: 13);
      return page.items
          .where((p) => p.id != key.productId)
          .take(12)
          .toList(growable: false);
    });

final productProvider = FutureProvider.family<ProductDetail, String>((
  ref,
  idOrSlug,
) {
  ref.watch(accountKeyProvider);
  return ref.watch(catalogueRepositoryProvider).product(idOrSlug);
});
