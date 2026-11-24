import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/i18n/language.dart';
import '../../../core/i18n/tr_text.dart';
import '../../../core/theme.dart';
import '../../../shared/money.dart';
import '../../../shared/product_image.dart';
import '../../offers/ui/offer_providers.dart';
import '../../offers/ui/offer_screen.dart';
import '../data/catalogue_models.dart';
import 'catalogue_providers.dart';
import 'product_screen.dart';
import 'widgets/product_card.dart';

/// "Disponible dans ces paniers": the offers that include this product, as on the website.
///
/// Placed above the reviews because it changes the buying decision - the same product, cheaper
/// as part of a complete set. Nothing at all when there is none, or when it cannot be loaded:
/// it is a suggestion, not something the page depends on.
class InBundlesSection extends ConsumerWidget {
  const InBundlesSection({super.key, required this.productId});

  final String productId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final offers =
        ref.watch(offersContainingProvider(productId)).value ?? const [];
    if (offers.isEmpty) return const SizedBox.shrink();
    final l10n = context.l10n;

    return Padding(
      padding: const EdgeInsets.only(top: 26),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            l10n.inBundles,
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 2),
          Text(
            l10n.inBundlesText,
            style: const TextStyle(fontSize: 12.5, color: AppTheme.muted),
          ),
          const SizedBox(height: 10),
          for (final offer in offers)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: InkWell(
                borderRadius: BorderRadius.circular(12),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => OfferScreen(slug: offer.slug),
                  ),
                ),
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: AppTheme.card(radius: 16),
                  child: Row(
                    children: [
                      ProductImage(
                        url: offer.imageUrl,
                        name: offer.name,
                        size: 56,
                        radius: 10,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            TrText(
                              offer.name,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              l10n.productCount(offer.items.length),
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppTheme.muted,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          if (offer.price != null)
                            Text(
                              Money.of(offer.price!),
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                color: AppTheme.emeraldDark,
                              ),
                            ),
                          if (offer.savingsPercent > 0)
                            Text(
                              Money.percentOff(offer.savingsPercent),
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.brass,
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// "Produits similaires": the rest of the category, in a row the thumb can swipe.
class SimilarProductsSection extends ConsumerWidget {
  const SimilarProductsSection({super.key, required this.product});

  final ProductDetail product;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final similar =
        ref
            .watch(
              similarProductsProvider((
                productId: product.id,
                categoryId: product.categoryId,
              )),
            )
            .value ??
        const [];
    if (similar.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(top: 26),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            context.l10n.similarProducts,
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 250,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: similar.length,
              separatorBuilder: (_, _) => const SizedBox(width: 10),
              itemBuilder: (context, i) {
                final p = similar[i];
                return SizedBox(
                  width: 160,
                  child: ProductCard(
                    product: p,
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => ProductScreen(
                          idOrSlug: p.slug.isEmpty ? p.id : p.slug,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
