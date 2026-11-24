import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/i18n/language.dart';
import '../../../core/i18n/tr_text.dart';
import '../../../core/theme.dart';
import '../../../shared/dates.dart';
import '../../../shared/money.dart';
import '../../../shared/product_image.dart';
import '../../cart/ui/cart_providers.dart';
import '../../cart/ui/cart_screen.dart';
import '../data/offer_models.dart';
import 'offer_providers.dart';

/// One basket offer, and the single tap that puts all of it in the cart.
///
/// This is also where a push notification about a new basket lands, so it stands on its own.
class OfferScreen extends ConsumerStatefulWidget {
  const OfferScreen({super.key, required this.slug});

  final String slug;

  @override
  ConsumerState<OfferScreen> createState() => _OfferScreenState();
}

class _OfferScreenState extends ConsumerState<OfferScreen> {
  bool _adding = false;

  Future<void> _addAll(Offer offer) async {
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    final l10n = context.l10n;
    setState(() => _adding = true);
    try {
      final error = await ref.read(cartProvider.notifier).addAll({
        for (final item in offer.items) item.productId: item.quantity,
      });
      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            content: error != null
                ? TrText(error, style: const TextStyle(color: Colors.white))
                : Text(l10n.offerAdded),
            action: error != null
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
      if (mounted) setState(() => _adding = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final offer = ref.watch(offerProvider(widget.slug));

    return offer.when(
      loading: () => Scaffold(
        appBar: AppBar(),
        body: const Center(child: CircularProgressIndicator()),
      ),
      error: (e, _) => Scaffold(
        appBar: AppBar(title: Text(context.l10n.offerTitle)),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: TrText('$e', textAlign: TextAlign.center),
          ),
        ),
      ),
      data: (o) => _Body(offer: o, adding: _adding, onAdd: () => _addAll(o)),
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({required this.offer, required this.adding, required this.onAdd});

  final Offer offer;
  final bool adding;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    final o = offer;
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
          SizedBox(
            height: width * 0.78,
            child: Stack(
              fit: StackFit.expand,
              children: [
                Container(
                  decoration: const BoxDecoration(
                    gradient: AppTheme.forestGradient,
                  ),
                  child: o.imageUrl == null
                      ? null
                      : ProductImage(url: o.imageUrl, name: o.name, radius: 0),
                ),
                if (o.savingsPercent > 0)
                  PositionedDirectional(
                    end: 16,
                    bottom: 40,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 7,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.brass,
                        borderRadius: BorderRadius.circular(999),
                        boxShadow: AppTheme.shadow,
                      ),
                      child: Text(
                        Money.percentOff(o.savingsPercent),
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          // The sheet, pulled up over the bottom of the photo.
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
                  Text(
                    l10n.offerTitle.toUpperCase(),
                    style: AppTheme.eyebrow.copyWith(color: AppTheme.brass),
                  ),
                  const SizedBox(height: 6),
                  TrText(o.name, style: AppTheme.display(context, size: 26)),
                  if (o.endsAt != null) ...[
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        const Icon(
                          Icons.schedule,
                          size: 16,
                          color: AppTheme.brass,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          l10n.offerUntil(Dates.dayMonth(context, o.endsAt!)),
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.brass,
                          ),
                        ),
                      ],
                    ),
                  ],
                  if (o.description != null) ...[
                    const SizedBox(height: 12),
                    TrText(
                      o.description!,
                      style: const TextStyle(
                        color: AppTheme.ink700,
                        height: 1.55,
                      ),
                    ),
                  ],

                  const SizedBox(height: 22),
                  Text(
                    l10n.offerContents,
                    style: AppTheme.display(context, size: 18),
                  ),
                  const SizedBox(height: 10),
                  Container(
                    decoration: AppTheme.card(),
                    child: Column(
                      children: [
                        for (final (i, item) in o.items.indexed) ...[
                          if (i > 0)
                            const Divider(height: 1, indent: 16, endIndent: 16),
                          _ItemRow(item: item),
                        ],
                      ],
                    ),
                  ),

                  if (o.price != null) ...[
                    const SizedBox(height: 16),
                    _PriceBox(offer: o),
                  ],

                  const SizedBox(height: 14),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(
                        Icons.info_outline,
                        size: 16,
                        color: AppTheme.muted,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          l10n.offerAutoDiscount,
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppTheme.muted,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: _BuyBar(offer: o, adding: adding, onAdd: onAdd),
    );
  }
}

class _ItemRow extends StatelessWidget {
  const _ItemRow({required this.item});

  final OfferItem item;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.all(12),
    child: Row(
      children: [
        Container(
          decoration: BoxDecoration(
            color: AppTheme.sand,
            borderRadius: BorderRadius.circular(12),
          ),
          child: ProductImage(
            url: item.imageUrl,
            name: item.name,
            size: 56,
            radius: 12,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TrText(
                item.name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
              if (!item.available) ...[
                const SizedBox(height: 3),
                Text(
                  context.l10n.itemOutOfStock,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.danger,
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: AppTheme.forest100,
            borderRadius: BorderRadius.circular(999),
          ),
          child: Text(
            '× ${item.quantity} ${item.unit}',
            textDirection: TextDirection.ltr,
            style: const TextStyle(
              color: AppTheme.forest700,
              fontWeight: FontWeight.w800,
              fontSize: 12.5,
            ),
          ),
        ),
      ],
    ),
  );
}

/// Bought separately, the basket price, and what that saves - the reason to buy the basket.
class _PriceBox extends StatelessWidget {
  const _PriceBox({required this.offer});

  final Offer offer;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppTheme.card(),
      child: Column(
        children: [
          if (offer.componentsTotal != null)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  l10n.boughtSeparately,
                  style: const TextStyle(color: AppTheme.muted),
                ),
                Text(
                  Money.of(offer.componentsTotal!),
                  style: const TextStyle(
                    color: AppTheme.muted,
                    decoration: TextDecoration.lineThrough,
                    decorationColor: AppTheme.muted,
                  ),
                ),
              ],
            ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                l10n.offerPrice,
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
              Text(
                Money.of(offer.price!),
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.emeraldDark,
                ),
              ),
            ],
          ),
          if (offer.savings > 0) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
              decoration: BoxDecoration(
                color: AppTheme.brass50,
                border: Border.all(color: AppTheme.brass100),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.savings_outlined,
                    size: 18,
                    color: AppTheme.brass,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    l10n.youSave(Money.of(offer.savings)),
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      color: AppTheme.brass,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _BuyBar extends StatelessWidget {
  const _BuyBar({
    required this.offer,
    required this.adding,
    required this.onAdd,
  });

  final Offer offer;
  final bool adding;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final canAdd = offer.available && offer.price != null;
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
              if (offer.price != null) ...[
                Text(
                  Money.of(offer.price!),
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.emeraldDark,
                  ),
                ),
                const SizedBox(width: 14),
              ],
              Expanded(
                child: FilledButton.icon(
                  onPressed: (!canAdd || adding) ? null : onAdd,
                  icon: adding
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.4,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.add_shopping_cart),
                  label: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      offer.price == null
                          ? l10n.offerOtherTrade
                          : (offer.available
                                ? l10n.offerAdd
                                : l10n.offerUnavailable),
                    ),
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
