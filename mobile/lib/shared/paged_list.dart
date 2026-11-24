/// A list loaded a page at a time.
///
/// The catalogue used to show the first 40 products and the order history the first 50,
/// silently: with a real wholesale catalogue everything past that was unreachable except by
/// search. Pages are now appended as the customer reaches the end of what is shown.
class PagedList<T> {
  const PagedList({
    required this.items,
    required this.page,
    required this.last,
    this.loadingMore = false,
    this.moreError,
  });

  final List<T> items;
  final int page;

  /// No page after this one.
  final bool last;
  final bool loadingMore;

  /// Why the last "load more" failed - shown at the foot of the list with a retry, without
  /// throwing away the pages already loaded.
  final String? moreError;

  bool get canLoadMore => !last && !loadingMore;

  PagedList<T> copyWith({
    List<T>? items,
    int? page,
    bool? last,
    bool? loadingMore,
    String? moreError,
  }) => PagedList(
    items: items ?? this.items,
    page: page ?? this.page,
    last: last ?? this.last,
    loadingMore: loadingMore ?? this.loadingMore,
    moreError: moreError,
  );
}
