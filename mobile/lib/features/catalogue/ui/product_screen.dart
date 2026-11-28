import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/i18n/language.dart';
import '../../../core/i18n/tr_text.dart';
import '../../../core/theme.dart';
import '../../../shared/money.dart';
import '../../../shared/product_image.dart';
import '../../cart/ui/add_to_cart.dart';
import '../data/catalogue_models.dart';
import 'catalogue_providers.dart';
import 'product_extras.dart';
import 'reviews_section.dart';
import 'widgets/price_label.dart';

/// One product, in full: the picture large, the facts in a sheet under it, and the price with
/// the button pinned to the bottom of the screen, where the thumb is.
class ProductScreen extends ConsumerWidget {
  const ProductScreen({super.key, required this.idOrSlug});

  final String idOrSlug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final product = ref.watch(productProvider(idOrSlug));

    return product.when(
      loading: () => Scaffold(
        appBar: AppBar(),
        body: const Center(child: CircularProgressIndicator()),
      ),
      error: (e, _) => Scaffold(
        appBar: AppBar(title: Text(context.l10n.productTitle)),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.error_outline,
                  size: 48,
                  color: AppTheme.muted,
                ),
                const SizedBox(height: 14),
                TrText('$e', textAlign: TextAlign.center),
                const SizedBox(height: 18),
                OutlinedButton(
                  onPressed: () => ref.invalidate(productProvider(idOrSlug)),
                  child: Text(context.l10n.retry),
                ),
              ],
            ),
          ),
        ),
      ),
      data: (p) => _Details(product: p),
    );
  }
}

class _Details extends ConsumerStatefulWidget {
  const _Details({required this.product});

  final ProductDetail product;

  @override
  ConsumerState<_Details> createState() => _DetailsState();
}

class _DetailsState extends ConsumerState<_Details> {
  bool _adding = false;

  Future<void> _add() async {
    setState(() => _adding = true);
    try {
      await addToCart(
        context,
        ref,
        productId: widget.product.id,
        name: widget.product.name,
        arabicName: widget.product.nameAr,
        minOrderQuantity: widget.product.minOrderQuantity,
      );
    } finally {
      if (mounted) setState(() => _adding = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final product = widget.product;
    final l10n = context.l10n;
    final width = MediaQuery.sizeOf(context).width;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        // The arrow sits on the photo: a white disc keeps it visible over any picture.
        leading: const Padding(
          padding: EdgeInsets.all(6),
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: AppTheme.shadow,
            ),
            child: BackButton(color: AppTheme.ink),
          ),
        ),
      ),
      body: ListView(
        padding: EdgeInsets.zero,
        children: [
          // The picture, full width, on the sand of the website's image wells.
          Container(
            height: width * 0.92,
            color: AppTheme.sand,
            padding: EdgeInsets.fromLTRB(
              24,
              MediaQuery.paddingOf(context).top + 48,
              24,
              36,
            ),
            child: ProductImage(
              url: product.imageUrl,
              name: product.name,
              radius: 20,
            ),
          ),
          // The sheet, pulled up over the bottom of the picture.
          Transform.translate(
            offset: const Offset(0, -24),
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 22, 20, 8),
              decoration: const BoxDecoration(
                color: AppTheme.cream,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (product.categoryName != null)
                    TrText(
                      product.categoryName!,
                      // The product endpoint sends the category's French name only, so the
                      // Arabic comes from the category list the catalogue has already
                      // loaded - the same rows, with the shop's own translation on them.
                      arabic: ref
                          .watch(categoriesProvider)
                          .value
                          ?.where((c) => c.id == product.categoryId)
                          .firstOrNull
                          ?.nameAr,
                      format: (name) => name.toUpperCase(),
                      style: AppTheme.eyebrow.copyWith(color: AppTheme.brass),
                    ),
                  const SizedBox(height: 6),
                  TrText(
                    product.name,
                    arabic: product.nameAr,
                    style: AppTheme.display(context, size: 26),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      if (product.reviewCount > 0) ...[
                        Stars(value: product.averageRating, size: 16),
                        const SizedBox(width: 6),
                        Text(
                          '${product.averageRating.toStringAsFixed(1)} (${product.reviewCount})',
                          style: const TextStyle(
                            fontSize: 12.5,
                            color: AppTheme.muted,
                          ),
                        ),
                        const SizedBox(width: 12),
                      ],
                      Expanded(child: _Stock(product: product)),
                    ],
                  ),

                  if (product.priceTiers.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    _Tiers(tiers: product.priceTiers, unit: product.unit),
                  ],

                  if (product.description != null) ...[
                    const SizedBox(height: 22),
                    Text(
                      l10n.description,
                      style: AppTheme.display(context, size: 18),
                    ),
                    const SizedBox(height: 8),
                    TrText(
                      product.description!,
                      arabic: product.descriptionAr,
                      style: const TextStyle(
                        height: 1.6,
                        color: AppTheme.ink700,
                      ),
                    ),
                  ],

                  if (product.attributes.isNotEmpty) ...[
                    const SizedBox(height: 22),
                    _Attributes(attributes: product.attributes),
                  ],

                  InBundlesSection(productId: product.id),
                  const SizedBox(height: 26),
                  const Divider(),
                  const SizedBox(height: 18),
                  ReviewsSection(product: product),
                  SimilarProductsSection(product: product),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: _BuyBar(
        product: product,
        adding: _adding,
        onAdd: _add,
      ),
    );
  }
}

/// The price and the button, always in reach.
///
/// Disabled for a reason the button itself states: no price means the account is not
/// approved, and the server would refuse the line anyway.
class _BuyBar extends StatelessWidget {
  const _BuyBar({
    required this.product,
    required this.adding,
    required this.onAdd,
  });

  final ProductDetail product;
  final bool adding;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final available = product.stockQuantity >= product.minOrderQuantity;
    final canAdd = product.price != null && available;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: AppTheme.line)),
        boxShadow: AppTheme.shadowLarge,
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          child: Row(
            children: [
              if (product.price != null) ...[
                PriceLabel(
                  price: product.price,
                  unit: product.unit,
                  large: true,
                ),
                const SizedBox(width: 14),
              ],
              Expanded(
                child: FilledButton(
                  onPressed: (!canAdd || adding) ? null : onAdd,
                  child: adding
                      ? const SizedBox(
                          height: 22,
                          width: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.4,
                            color: Colors.white,
                          ),
                        )
                      : FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Text(switch (product) {
                            _ when product.price == null =>
                              l10n.orderAfterApproval,
                            _ when !available => l10n.outOfStock,
                            _ when product.minOrderQuantity > 1 =>
                              l10n.addQuantityToCart(
                                product.minOrderQuantity,
                                product.unit,
                              ),
                            _ => l10n.addToCart,
                          }),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Stock extends StatelessWidget {
  const _Stock({required this.product});

  final ProductDetail product;

  @override
  Widget build(BuildContext context) {
    final available = product.stockQuantity >= product.minOrderQuantity;
    final text = [
      available
          ? context.l10n.inStock(product.stockQuantity, product.unit)
          : context.l10n.outOfStock,
      if (product.minOrderQuantity > 1)
        context.l10n.minimumQuantity(product.minOrderQuantity, product.unit),
    ].join(' · ');
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: available ? AppTheme.emerald : AppTheme.danger,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 6),
        Flexible(
          child: Text(
            text,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 12.5,
              color: available ? AppTheme.emeraldDark : AppTheme.danger,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}

/// The specs staff filled in: origin, net weight, packaging, whatever this trade cares about.
///
/// The same card language as [_Tiers], in neutral colours rather than brass: these facts help
/// a buyer decide whether this is the right reference, but none of them is an offer. Free text
/// on both sides and no Arabic column behind it, so both halves go through the translator.
class _Attributes extends StatelessWidget {
  const _Attributes({required this.attributes});

  final List<ProductAttribute> attributes;

  @override
  Widget build(BuildContext context) => Container(
    clipBehavior: Clip.antiAlias,
    decoration: AppTheme.card(),
    child: Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
          child: Row(
            children: [
              const Icon(
                Icons.fact_check_outlined,
                size: 18,
                color: AppTheme.emeraldDark,
              ),
              const SizedBox(width: 8),
              Text(
                context.l10n.productSpecs,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
        for (final attribute in attributes)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
            decoration: const BoxDecoration(
              border: Border(top: BorderSide(color: AppTheme.line)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  flex: 4,
                  child: TrText(
                    attribute.name,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppTheme.muted,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 5,
                  child: TrText(
                    attribute.value,
                    textAlign: TextAlign.end,
                    style: const TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.ink,
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    ),
  );
}

/// The quantity ladder - the reason a wholesaler is on this screen at all.
///
/// Shown as a table rather than a sentence: the buyer is comparing rungs to decide how much
/// to order, and that comparison is what the rows make possible at a glance. Brass, the
/// website's colour for tiers and savings.
class _Tiers extends StatelessWidget {
  const _Tiers({required this.tiers, required this.unit});

  final List<PriceTier> tiers;
  final String unit;

  @override
  Widget build(BuildContext context) {
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: AppTheme.brass50,
        border: Border.all(color: AppTheme.brass100),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
            child: Row(
              children: [
                const Icon(
                  Icons.trending_down,
                  size: 18,
                  color: AppTheme.brass,
                ),
                const SizedBox(width: 8),
                Text(
                  context.l10n.tiersTitle,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          for (final tier in tiers)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: AppTheme.brass100)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    context.l10n.fromQuantity(tier.minQuantity, unit),
                    style: const TextStyle(
                      fontSize: 13.5,
                      color: AppTheme.ink700,
                    ),
                  ),
                  Text(
                    Money.of(tier.unitPrice),
                    style: const TextStyle(
                      fontSize: 14.5,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.emeraldDark,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
