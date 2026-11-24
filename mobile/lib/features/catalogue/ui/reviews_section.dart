import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/i18n/language.dart';
import '../../../core/i18n/tr_text.dart';
import '../../../core/providers.dart';
import '../../../core/theme.dart';
import '../../../shared/load_more_footer.dart';
import '../data/catalogue_models.dart';
import '../data/review_repository.dart';

final reviewRepositoryProvider = Provider<ReviewRepository>(
  (ref) => ReviewRepository(ref.watch(apiClientProvider)),
);

/// The latest few reviews of a product, for its page.
final latestReviewsProvider = FutureProvider.family<Paged<Review>, String>((
  ref,
  productId,
) {
  return ref.watch(reviewRepositoryProvider).list(productId, size: 3);
});

const _starColour = AppTheme.brass;

String _ratingLabel(AppLocalizations l10n, int n) => switch (n) {
  1 => l10n.rating1,
  2 => l10n.rating2,
  3 => l10n.rating3,
  4 => l10n.rating4,
  _ => l10n.rating5,
};

/// Read-only stars, rounded to the nearest whole star.
class Stars extends StatelessWidget {
  const Stars({super.key, required this.value, this.size = 16});

  final double value;
  final double size;

  @override
  Widget build(BuildContext context) {
    final filled = value.round().clamp(0, 5);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var i = 0; i < 5; i++)
          Icon(
            Icons.star_rounded,
            size: size,
            color: i < filled ? _starColour : AppTheme.line,
          ),
      ],
    );
  }
}

/// Reviews on the product page: the average, the latest three, and the way to add one.
///
/// Same rules as the website: only approved reviews are shown, one review per customer per
/// product (sending again replaces it), and a new one waits for Market Food's moderation.
class ReviewsSection extends ConsumerWidget {
  const ReviewsSection({super.key, required this.product});

  final ProductDetail product;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final reviews = ref.watch(latestReviewsProvider(product.id));
    final count = product.reviewCount;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          l10n.reviewsTitle,
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            if (count > 0) ...[
              Text(
                product.averageRating.toStringAsFixed(1),
                style: const TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(width: 10),
            ],
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Stars(value: product.averageRating, size: 18),
                  const SizedBox(height: 2),
                  Text(
                    count > 0 ? l10n.reviewsCount(count) : l10n.noRatingYet,
                    style: const TextStyle(fontSize: 12, color: AppTheme.muted),
                  ),
                ],
              ),
            ),
          ],
        ),

        // A failed list is not worth an error on a product page; the summary above still holds.
        ...reviews.maybeWhen(
          data: (page) => [
            for (final r in page.items) ...[
              const Divider(height: 22, color: AppTheme.line),
              ReviewTile(review: r),
            ],
            if (page.totalElements > page.items.length)
              Align(
                alignment: AlignmentDirectional.centerStart,
                child: TextButton(
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => AllReviewsScreen(product: product),
                    ),
                  ),
                  style: TextButton.styleFrom(
                    foregroundColor: AppTheme.emeraldDark,
                  ),
                  child: Text(l10n.reviewsSeeAll),
                ),
              ),
          ],
          orElse: () => const <Widget>[],
        ),

        const SizedBox(height: 14),
        OutlinedButton.icon(
          onPressed: () => ReviewSheet.show(context, product),
          icon: const Icon(Icons.rate_review_outlined),
          label: Text(count > 0 ? l10n.reviewWrite : l10n.reviewFirst),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppTheme.emeraldDark,
            minimumSize: const Size.fromHeight(46),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          l10n.reviewInvite,
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 11.5, color: AppTheme.muted),
        ),
      ],
    );
  }
}

class ReviewTile extends StatelessWidget {
  const ReviewTile({super.key, required this.review});

  final Review review;

  @override
  Widget build(BuildContext context) {
    final language = Localizations.localeOf(context).languageCode;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Stars(value: review.rating.toDouble(), size: 14),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                review.authorName ?? context.l10n.reviewAnonymous,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            Text(
              DateFormat('d MMM y', language).format(review.createdAt),
              style: const TextStyle(fontSize: 11.5, color: AppTheme.muted),
            ),
          ],
        ),
        // The customer's own words, left as written: a review is testimony, and a machine
        // rewording it would put words in someone's mouth.
        if (review.comment != null) ...[
          const SizedBox(height: 6),
          Text(review.comment!, style: const TextStyle(height: 1.45)),
        ],
      ],
    );
  }
}

/// Every approved review, a page at a time.
class AllReviewsScreen extends ConsumerStatefulWidget {
  const AllReviewsScreen({super.key, required this.product});

  final ProductDetail product;

  @override
  ConsumerState<AllReviewsScreen> createState() => _AllReviewsScreenState();
}

class _AllReviewsScreenState extends ConsumerState<AllReviewsScreen> {
  final _items = <Review>[];
  int _page = -1;
  bool _last = false;
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _more();
  }

  Future<void> _more() async {
    if (_loading || _last) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final next = await ref
          .read(reviewRepositoryProvider)
          .list(widget.product.id, page: _page + 1, size: 20);
      if (!mounted) return;
      setState(() {
        _items.addAll(next.items);
        _page++;
        _last = next.last;
      });
    } on ReviewFailure catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(context.l10n.reviewsTitle)),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _items.length + 1,
        separatorBuilder: (_, _) =>
            const Divider(height: 22, color: AppTheme.line),
        itemBuilder: (context, i) => i == _items.length
            ? LoadMoreFooter(
                hasMore: !_last,
                loading: _loading,
                error: _error,
                onLoadMore: _more,
              )
            : ReviewTile(review: _items[i]),
      ),
    );
  }
}

/// Stars, a comment, and send.
class ReviewSheet extends ConsumerStatefulWidget {
  const ReviewSheet({super.key, required this.product});

  final ProductDetail product;

  static Future<void> show(BuildContext context, ProductDetail product) =>
      showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        useSafeArea: true,
        builder: (_) => ReviewSheet(product: product),
      );

  @override
  ConsumerState<ReviewSheet> createState() => _ReviewSheetState();
}

class _ReviewSheetState extends ConsumerState<ReviewSheet> {
  final _comment = TextEditingController();
  int _rating = 5;
  bool _sending = false;
  String? _error;

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    setState(() {
      _sending = true;
      _error = null;
    });
    try {
      await ref
          .read(reviewRepositoryProvider)
          .submit(widget.product.id, rating: _rating, comment: _comment.text);
      if (!mounted) return;
      final messenger = ScaffoldMessenger.of(context);
      final thanks = context.l10n.reviewThanks;
      Navigator.of(context).pop();
      messenger.showSnackBar(SnackBar(content: Text(thanks)));
    } on ReviewFailure catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Padding(
      padding: EdgeInsets.fromLTRB(
        20,
        20,
        20,
        MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              l10n.reviewWrite,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 4),
            TrText(
              widget.product.name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: AppTheme.muted),
            ),
            const SizedBox(height: 16),
            Text(
              l10n.reviewYourRating,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 4),
            // A rating is tapped, not chosen from a list - and each star says what it means.
            Row(
              children: [
                for (var n = 1; n <= 5; n++)
                  IconButton(
                    tooltip: l10n.ratingStars(n),
                    visualDensity: VisualDensity.compact,
                    onPressed: _sending
                        ? null
                        : () => setState(() => _rating = n),
                    icon: Icon(
                      n <= _rating
                          ? Icons.star_rounded
                          : Icons.star_outline_rounded,
                      size: 34,
                      color: n <= _rating ? _starColour : Colors.black26,
                    ),
                  ),
                const SizedBox(width: 6),
                Text(
                  _ratingLabel(l10n, _rating),
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ],
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _comment,
              maxLines: 4,
              maxLength: 2000,
              textCapitalization: TextCapitalization.sentences,
              decoration: InputDecoration(
                hintText: l10n.reviewPlaceholder,
                counterText: '',
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 10),
              TrText(
                _error!,
                style: TextStyle(color: Colors.red.shade700, fontSize: 13),
              ),
            ],
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _sending ? null : _send,
              child: _sending
                  ? const SizedBox(
                      height: 22,
                      width: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.4,
                        color: Colors.white,
                      ),
                    )
                  : Text(l10n.reviewPublish),
            ),
          ],
        ),
      ),
    );
  }
}
