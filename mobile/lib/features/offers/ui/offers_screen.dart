import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/i18n/language.dart';
import '../../../core/i18n/tr_text.dart';
import '../../../core/providers.dart';
import '../../../core/theme.dart';
import '../../../shared/dates.dart';
import '../../../shared/money.dart';
import '../../../shared/product_image.dart';
import '../data/offer_models.dart';
import 'offer_providers.dart';
import 'offer_screen.dart';

/// The basket offers priced for this customer's trade.
class OffersScreen extends ConsumerWidget {
  const OffersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final offers = ref.watch(offersProvider);
    final approved = ref.watch(sessionProvider).user?.clientType != null;
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.offersTitle)),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(offersProvider);
          await ref.read(offersProvider.future);
        },
        child: offers.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(
            padding: const EdgeInsets.all(32),
            children: [
              const SizedBox(height: 80),
              const _Disc(icon: Icons.wifi_off),
              const SizedBox(height: 14),
              TrText('$e', textAlign: TextAlign.center),
            ],
          ),
          data: (list) => list.isEmpty
              ? ListView(
                  padding: const EdgeInsets.all(32),
                  children: [
                    const SizedBox(height: 60),
                    const _Disc(icon: Icons.local_offer_outlined),
                    const SizedBox(height: 18),
                    Text(
                      approved ? l10n.noOffersApproved : l10n.noOffersPending,
                      textAlign: TextAlign.center,
                      style: AppTheme.display(context, size: 20),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      approved
                          ? l10n.noOffersApprovedDetail
                          : l10n.noOffersPendingDetail,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: AppTheme.muted,
                        height: 1.45,
                      ),
                    ),
                  ],
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                  itemCount: list.length + 1,
                  separatorBuilder: (_, _) => const SizedBox(height: 16),
                  itemBuilder: (context, i) =>
                      i == 0 ? const _Intro() : _OfferCard(offer: list[i - 1]),
                ),
        ),
      ),
    );
  }
}

/// What a basket offer is, in the website's words.
class _Intro extends StatelessWidget {
  const _Intro();

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: AppTheme.brass50,
      border: Border.all(color: AppTheme.brass100),
      borderRadius: BorderRadius.circular(18),
    ),
    child: Row(
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: const BoxDecoration(
            color: AppTheme.brass100,
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.shopping_basket_outlined,
            color: AppTheme.brass,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                context.l10n.offersHeroTitle,
                style: AppTheme.display(context, size: 16),
              ),
              const SizedBox(height: 3),
              Text(
                context.l10n.offersHeroText,
                style: const TextStyle(
                  fontSize: 12.5,
                  color: AppTheme.ink700,
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _OfferCard extends StatelessWidget {
  const _OfferCard({required this.offer});

  final Offer offer;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final thumbs = offer.items.take(4).toList();

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(22),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => OfferScreen(slug: offer.slug)),
        ),
        child: Ink(
          decoration: AppTheme.card(radius: 22),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // The photo, with the name written over its darkened foot.
              ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(22),
                ),
                child: AspectRatio(
                  aspectRatio: 1.9,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      Container(
                        decoration: const BoxDecoration(
                          gradient: AppTheme.forestGradient,
                        ),
                        child: offer.imageUrl == null
                            ? null
                            : ProductImage(
                                url: offer.imageUrl,
                                name: offer.name,
                                radius: 0,
                              ),
                      ),
                      const DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            stops: [0.4, 1],
                            colors: [Color(0x00172C21), Color(0xD9172C21)],
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                if (offer.savingsPercent > 0)
                                  _Tag(
                                    text: Money.percentOff(
                                      offer.savingsPercent,
                                    ),
                                    background: AppTheme.brass,
                                  ),
                                const Spacer(),
                                if (offer.endsAt != null)
                                  _Tag(
                                    text: l10n.offerUntil(
                                      Dates.dayMonth(context, offer.endsAt!),
                                    ),
                                    background: Colors.white.withValues(
                                      alpha: 0.92,
                                    ),
                                    foreground: AppTheme.ink,
                                    icon: Icons.schedule,
                                  ),
                              ],
                            ),
                            const Spacer(),
                            TrText(
                              offer.name,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: AppTheme.display(
                                context,
                                size: 22,
                                colour: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (!offer.available)
                        Container(
                          color: Colors.white.withValues(alpha: 0.55),
                          alignment: Alignment.center,
                          child: _Tag(
                            text: l10n.unavailable,
                            background: AppTheme.ink,
                            icon: Icons.block,
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 12, 14),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                Money.of(offer.price!),
                                style: const TextStyle(
                                  fontSize: 21,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.emeraldDark,
                                ),
                              ),
                              if (offer.componentsTotal != null &&
                                  offer.componentsTotal! > offer.price!) ...[
                                const SizedBox(width: 8),
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 2),
                                  child: Text(
                                    Money.of(offer.componentsTotal!),
                                    style: const TextStyle(
                                      color: AppTheme.muted,
                                      decoration: TextDecoration.lineThrough,
                                      decorationColor: AppTheme.muted,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              // The first products, as overlapping thumbnails.
                              SizedBox(
                                width: 22.0 * thumbs.length + 16,
                                height: 32,
                                child: Stack(
                                  children: [
                                    for (final (i, item) in thumbs.indexed)
                                      PositionedDirectional(
                                        start: 22.0 * i,
                                        child: Container(
                                          width: 32,
                                          height: 32,
                                          padding: const EdgeInsets.all(1.5),
                                          decoration: const BoxDecoration(
                                            color: Colors.white,
                                            shape: BoxShape.circle,
                                          ),
                                          child: ClipOval(
                                            child: ProductImage(
                                              url: item.imageUrl,
                                              name: item.name,
                                              size: 29,
                                              radius: 99,
                                            ),
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                              Text(
                                l10n.productCount(offer.items.length),
                                style: const TextStyle(
                                  fontSize: 12.5,
                                  color: AppTheme.muted,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    Container(
                      width: 42,
                      height: 42,
                      decoration: const BoxDecoration(
                        color: AppTheme.emeraldDark,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.arrow_forward,
                        color: Colors.white,
                        size: 20,
                      ),
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

class _Tag extends StatelessWidget {
  const _Tag({
    required this.text,
    required this.background,
    this.foreground = Colors.white,
    this.icon,
  });

  final String text;
  final Color background;
  final Color foreground;
  final IconData? icon;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
    decoration: BoxDecoration(
      color: background,
      borderRadius: BorderRadius.circular(999),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (icon != null) ...[
          Icon(icon, size: 13, color: foreground),
          const SizedBox(width: 5),
        ],
        Text(
          text,
          style: TextStyle(
            color: foreground,
            fontWeight: FontWeight.w800,
            fontSize: 12,
          ),
        ),
      ],
    ),
  );
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
