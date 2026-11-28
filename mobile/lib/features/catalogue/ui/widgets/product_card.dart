import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/i18n/language.dart';
import '../../../../core/i18n/tr_text.dart';
import '../../../../core/theme.dart';
import '../../../../shared/money.dart';
import '../../../../shared/product_image.dart';
import '../../../cart/ui/add_to_cart.dart';
import '../../../cart/ui/cart_providers.dart';
import '../../data/catalogue_models.dart';
import 'price_label.dart';

/// One product in the grid: the picture in a sand well, the name, the price, and a "+" that
/// adds it without leaving the catalogue - a buyer restocking twenty references should not
/// open twenty pages.
class ProductCard extends ConsumerStatefulWidget {
  const ProductCard({super.key, required this.product, required this.onTap});

  final ProductSummary product;
  final VoidCallback onTap;

  @override
  ConsumerState<ProductCard> createState() => _ProductCardState();
}

class _ProductCardState extends ConsumerState<ProductCard> {
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
    final inCart = ref.watch(
      cartProvider.select(
        (c) =>
            c.value?.items
                .where((i) => i.productId == product.id)
                .firstOrNull
                ?.quantity ??
            0,
      ),
    );
    final canAdd = product.price != null && product.inStock;
    final bestTier = product.bestTier;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: widget.onTap,
        borderRadius: BorderRadius.circular(18),
        child: Ink(
          decoration: AppTheme.card(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(8),
                  child: Stack(
                    children: [
                      Positioned.fill(
                        child: Container(
                          decoration: BoxDecoration(
                            color: AppTheme.sand,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: ProductImage(
                            url: product.imageUrl,
                            name: product.name,
                            radius: 14,
                          ),
                        ),
                      ),
                      // Out of stock is said on the picture, not only in small text: a buyer
                      // scanning a grid decides from the images.
                      if (!product.inStock)
                        PositionedDirectional(
                          top: 8,
                          start: 8,
                          child: _Badge(
                            label: context.l10n.badgeOutOfStock,
                            background: AppTheme.ink.withValues(alpha: 0.78),
                            foreground: Colors.white,
                          ),
                        ),
                      if (product.hasQuantityDiscount)
                        PositionedDirectional(
                          top: 8,
                          end: 8,
                          child: _Badge(
                            label: context.l10n.badgeTiered,
                            background: AppTheme.brass100,
                            foreground: AppTheme.brass,
                            icon: Icons.trending_down,
                          ),
                        ),
                      if (inCart > 0)
                        PositionedDirectional(
                          bottom: 8,
                          start: 8,
                          child: _Badge(
                            label: '× $inCart',
                            background: AppTheme.emeraldDark,
                            foreground: Colors.white,
                            icon: Icons.shopping_basket,
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(12, 2, 8, 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TrText(
                      product.name,
                      arabic: product.nameAr,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 13.5,
                        height: 1.3,
                        color: AppTheme.ink,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              PriceLabel(
                                price: product.price,
                                unit: product.unit,
                              ),
                              // One line under the price, never two: the ladder's best rung
                              // when there is a ladder - the number the "Dégressif" badge
                              // promises - and otherwise the minimum to order. A buyer
                              // deciding between two cards is served better by the price
                              // they can reach than by a minimum they will meet anyway.
                              if (bestTier != null)
                                _Footnote(
                                  context.l10n.tierFromPrice(
                                    bestTier.minQuantity,
                                    product.unit,
                                    Money.of(bestTier.unitPrice),
                                  ),
                                  colour: AppTheme.brass,
                                  weight: FontWeight.w600,
                                )
                              else if (product.minOrderQuantity > 1)
                                _Footnote(
                                  context.l10n.fromQuantity(
                                    product.minOrderQuantity,
                                    product.unit,
                                  ),
                                ),
                            ],
                          ),
                        ),
                        if (canAdd) _AddButton(busy: _adding, onPressed: _add),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// The quiet line under the price. Brass for a ladder rung, grey for anything else - the same
/// division of colours the product page uses for its tiers.
class _Footnote extends StatelessWidget {
  const _Footnote(
    this.text, {
    this.colour = AppTheme.muted,
    this.weight = FontWeight.w400,
  });

  final String text;
  final Color colour;
  final FontWeight weight;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 2),
    child: Text(
      text,
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      style: TextStyle(fontSize: 11, color: colour, fontWeight: weight),
    ),
  );
}

class _AddButton extends StatelessWidget {
  const _AddButton({required this.busy, required this.onPressed});

  final bool busy;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) => SizedBox(
    width: 38,
    height: 38,
    child: Material(
      color: AppTheme.emeraldDark,
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: busy ? null : onPressed,
        child: Center(
          child: busy
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : Icon(
                  Icons.add,
                  color: Colors.white,
                  size: 22,
                  semanticLabel: context.l10n.addToCart,
                ),
        ),
      ),
    ),
  );
}

class _Badge extends StatelessWidget {
  const _Badge({
    required this.label,
    required this.background,
    required this.foreground,
    this.icon,
  });

  final String label;
  final Color background;
  final Color foreground;
  final IconData? icon;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
    decoration: BoxDecoration(
      color: background,
      borderRadius: BorderRadius.circular(999),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (icon != null) ...[
          Icon(icon, size: 12, color: foreground),
          const SizedBox(width: 4),
        ],
        Text(
          label,
          style: TextStyle(
            color: foreground,
            fontSize: 10.5,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    ),
  );
}
