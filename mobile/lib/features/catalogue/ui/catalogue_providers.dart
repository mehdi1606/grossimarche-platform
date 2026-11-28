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
/// A record rather than one provider per field: they change together, and keeping them apart
/// would fire a reload for each of what the customer experiences as one action. Its value
/// equality is load-bearing too - [ProductsNotifier.loadMore] compares filters to recognise
/// the page it asked for.
typedef CatalogueFilter = ({
  String? categoryId,
  String query,
  ProductSort sort,
  double? minPrice,
  double? maxPrice,
  bool inStockOnly,
});

const CatalogueFilter _noFilter = (
  categoryId: null,
  query: '',
  sort: ProductSort.newest,
  minPrice: null,
  maxPrice: null,
  inStockOnly: false,
);

extension CatalogueRefinements on CatalogueFilter {
  /// How many refinements the sheet is holding - the number on the filter button.
  ///
  /// The category and the search text are not counted: each has its own visible control on
  /// the screen, so a badge for them would say what the chips and the field already say.
  int get refinementCount =>
      (sort != ProductSort.newest ? 1 : 0) +
      (minPrice != null ? 1 : 0) +
      (maxPrice != null ? 1 : 0) +
      (inStockOnly ? 1 : 0);

  /// Nothing narrows the catalogue: the customer is browsing the shop, not searching it.
  bool get isBrowsing =>
      query.isEmpty && categoryId == null && refinementCount == 0;
}

class CatalogueFilterNotifier extends Notifier<CatalogueFilter> {
  @override
  CatalogueFilter build() {
    // A new account starts from the whole catalogue, not the previous customer's search.
    ref.watch(accountKeyProvider);
    return _noFilter;
  }

  void category(String? id) => state = (
    categoryId: id,
    query: state.query,
    sort: state.sort,
    minPrice: state.minPrice,
    maxPrice: state.maxPrice,
    inStockOnly: state.inStockOnly,
  );

  void search(String text) => state = (
    categoryId: state.categoryId,
    query: text,
    sort: state.sort,
    minPrice: state.minPrice,
    maxPrice: state.maxPrice,
    inStockOnly: state.inStockOnly,
  );

  /// What the filter sheet applies, in one go: the customer pressed "Voir les résultats", and
  /// a reload per field would make that one tap into four.
  void refine({
    required ProductSort sort,
    required double? minPrice,
    required double? maxPrice,
    required bool inStockOnly,
  }) => state = (
    categoryId: state.categoryId,
    query: state.query,
    sort: sort,
    minPrice: minPrice,
    maxPrice: maxPrice,
    inStockOnly: inStockOnly,
  );

  void clear() => state = _noFilter;
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
          sort: filter.sort,
          minPrice: filter.minPrice,
          maxPrice: filter.maxPrice,
          inStockOnly: filter.inStockOnly,
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
            sort: filter.sort,
            minPrice: filter.minPrice,
            maxPrice: filter.maxPrice,
            inStockOnly: filter.inStockOnly,
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
