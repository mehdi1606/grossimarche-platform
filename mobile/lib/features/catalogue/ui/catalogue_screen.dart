import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/i18n/language.dart';
import '../../../core/i18n/tr_text.dart';
import '../../../core/providers.dart';
import '../../../core/theme.dart';
import '../../../shared/load_more_footer.dart';
import '../../../shared/money.dart';
import '../../../shared/product_image.dart';
import '../../cart/ui/cart_providers.dart';
import '../../cart/ui/cart_screen.dart';
import '../../home/home_shell.dart';
import '../../offers/data/offer_models.dart';
import '../../offers/ui/offer_providers.dart';
import '../../offers/ui/offer_screen.dart';
import '../data/catalogue_models.dart';
import 'catalogue_providers.dart';
import 'product_screen.dart';
import 'widgets/product_card.dart';

/// The shop's front: who is buying, what is on offer this week, the categories, the products.
class CatalogueScreen extends ConsumerStatefulWidget {
  const CatalogueScreen({super.key});

  @override
  ConsumerState<CatalogueScreen> createState() => _CatalogueScreenState();
}

class _CatalogueScreenState extends ConsumerState<CatalogueScreen> {
  final _search = TextEditingController();
  Timer? _debounce;

  @override
  void dispose() {
    _debounce?.cancel();
    _search.dispose();
    super.dispose();
  }

  /// Wait for the typing to stop before asking the server.
  ///
  /// Without this, "riz basmati" is eleven searches, ten of them thrown away - and on a 3G
  /// connection the answers arrive out of order, so the list flickers between results for
  /// "ri" and "riz b".
  void _onSearchChanged(String value) {
    setState(() {}); // the clear button
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () async {
      // The catalogue is written in French, so "أرز" finds nothing as typed: an Arabic search
      // is put into French first. If that fails the words are searched as they are.
      final query = await ref.read(contentTranslatorProvider).toFrench(value);
      if (!mounted || _search.text != value) return; // typed on meanwhile
      ref.read(catalogueFilterProvider.notifier).search(query);
    });
  }

  void _clearFilters() {
    _search.clear();
    ref.read(catalogueFilterProvider.notifier).clear();
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionProvider);
    final filter = ref.watch(catalogueFilterProvider);
    final products = ref.watch(productsProvider);
    final l10n = context.l10n;
    final browsing = filter.query.isEmpty && filter.categoryId == null;

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(categoriesProvider);
            ref.invalidate(productsProvider);
            ref.invalidate(offersProvider);
            await ref.read(productsProvider.future);
          },
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(child: _Header(name: session.user?.fullName)),

              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 14),
                  child: TextField(
                    controller: _search,
                    onChanged: _onSearchChanged,
                    textInputAction: TextInputAction.search,
                    decoration: InputDecoration(
                      hintText: l10n.searchHint,
                      prefixIcon: const Icon(Icons.search),
                      suffixIcon: _search.text.isEmpty
                          ? null
                          : IconButton(
                              icon: const Icon(Icons.close),
                              onPressed: () {
                                _search.clear();
                                ref
                                    .read(catalogueFilterProvider.notifier)
                                    .search('');
                                setState(() {});
                              },
                            ),
                    ),
                  ),
                ),
              ),

              // Said once, at the top, rather than repeated under every price: an account
              // waiting for approval sees no prices anywhere, and needs to know why once.
              if (session.user?.clientType == null)
                const SliverToBoxAdapter(child: _PendingApprovalBanner()),

              // The shop window, only while browsing: in the middle of a search it would push
              // the results down for nothing.
              if (browsing) const SliverToBoxAdapter(child: _Showcase()),

              SliverToBoxAdapter(
                child: _Categories(selected: filter.categoryId),
              ),

              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 18, 16, 10),
                  child: Text(
                    l10n.allProducts,
                    style: AppTheme.display(context, size: 20),
                  ),
                ),
              ),

              products.when(
                loading: () => const SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(child: CircularProgressIndicator()),
                ),
                error: (e, _) => SliverFillRemaining(
                  hasScrollBody: false,
                  child: _Message(
                    icon: Icons.wifi_off,
                    title: l10n.catalogueUnavailable,
                    detail: '$e',
                    onRetry: () => ref.invalidate(productsProvider),
                  ),
                ),
                data: (page) => page.items.isEmpty
                    ? SliverFillRemaining(
                        hasScrollBody: false,
                        child: _Message(
                          icon: Icons.search_off,
                          title: l10n.noProducts,
                          detail: browsing
                              ? l10n.catalogueEmpty
                              : l10n.noProductsFiltered,
                          onRetry: browsing ? null : _clearFilters,
                          retryLabel: l10n.showAll,
                        ),
                      )
                    : SliverMainAxisGroup(
                        slivers: [
                          SliverPadding(
                            padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
                            sliver: SliverGrid(
                              gridDelegate:
                                  const SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: 2,
                                    mainAxisSpacing: 14,
                                    crossAxisSpacing: 14,
                                    childAspectRatio: 0.62,
                                  ),
                              delegate: SliverChildBuilderDelegate(
                                childCount: page.items.length,
                                (context, i) {
                                  final product = page.items[i];
                                  return ProductCard(
                                    product: product,
                                    onTap: () => Navigator.of(context).push(
                                      MaterialPageRoute(
                                        builder: (_) => ProductScreen(
                                          idOrSlug: product.slug.isEmpty
                                              ? product.id
                                              : product.slug,
                                        ),
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ),
                          ),
                          // Below the grid, the footer that fetches the next page of products.
                          SliverToBoxAdapter(
                            child: LoadMoreFooter(
                              hasMore: !page.last,
                              loading: page.loadingMore,
                              error: page.moreError,
                              onLoadMore: () => ref
                                  .read(productsProvider.notifier)
                                  .loadMore(),
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

/// The brand, a greeting by name, and the basket.
class _Header extends StatelessWidget {
  const _Header({required this.name});

  final String? name;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final first = (name ?? '').trim().split(RegExp(r'\s+')).first;
    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(16, 12, 8, 10),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            // cacheWidth: the source is 1024 px for the store; shown at 44, decoded at 132.
            child: Image.asset(
              'assets/icon/app_icon.png',
              width: 44,
              height: 44,
              cacheWidth: 132,
              filterQuality: FilterQuality.medium,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  first.isEmpty ? l10n.greetingAnonymous : l10n.greeting(first),
                  style: const TextStyle(fontSize: 12.5, color: AppTheme.muted),
                ),
                Text('Market Food', style: AppTheme.display(context, size: 22)),
              ],
            ),
          ),
          const _CartButton(),
        ],
      ),
    );
  }
}

/// The basket, with how much is in it.
///
/// The count comes from the shared cart, so it can never drift from what the cart screen
/// shows - the two read the same value rather than each keeping their own.
class _CartButton extends ConsumerWidget {
  const _CartButton();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(cartCountProvider);

    return Stack(
      alignment: Alignment.center,
      children: [
        Container(
          margin: const EdgeInsets.all(4),
          decoration: AppTheme.card(radius: 14),
          child: IconButton(
            tooltip: context.l10n.cartTooltip,
            icon: const Icon(
              Icons.shopping_basket_outlined,
              color: AppTheme.ink,
            ),
            onPressed: () => Navigator.of(
              context,
            ).push(MaterialPageRoute(builder: (_) => const CartScreen())),
          ),
        ),
        if (count > 0)
          PositionedDirectional(
            top: 0,
            end: 0,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              constraints: const BoxConstraints(minWidth: 20),
              decoration: BoxDecoration(
                color: AppTheme.brass,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppTheme.cream, width: 2),
              ),
              child: Text(
                count > 99 ? '99+' : '$count',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10.5,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

/// The shop window: this week's basket offers if there are any, otherwise the brand's promise.
class _Showcase extends ConsumerWidget {
  const _Showcase();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final offers = ref.watch(offersProvider).value ?? const <Offer>[];
    final priced = offers.where((o) => o.price != null).toList();
    if (priced.isEmpty) return const _BrandBanner();

    final l10n = context.l10n;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsetsDirectional.fromSTEB(16, 4, 8, 8),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  l10n.offersOfMoment,
                  style: AppTheme.display(context, size: 20),
                ),
              ),
              TextButton(
                onPressed: () => ref.read(homeTabProvider.notifier).go(1),
                child: Text(l10n.seeAll),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 168,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: priced.length,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (context, i) => _OfferBanner(offer: priced[i]),
          ),
        ),
      ],
    );
  }
}

class _OfferBanner extends StatelessWidget {
  const _OfferBanner({required this.offer});

  final Offer offer;

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width * 0.78;
    return GestureDetector(
      onTap: () => Navigator.of(
        context,
      ).push(MaterialPageRoute(builder: (_) => OfferScreen(slug: offer.slug))),
      child: Container(
        width: width,
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          boxShadow: AppTheme.shadow,
          gradient: AppTheme.forestGradient,
        ),
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (offer.imageUrl != null)
              ProductImage(url: offer.imageUrl, name: offer.name, radius: 0),
            // The words must stay readable over any photo.
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0x10172C21), Color(0xE6172C21)],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (offer.savingsPercent > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 9,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.brass,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        Money.percentOff(offer.savingsPercent),
                        textDirection: TextDirection.ltr,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  const Spacer(),
                  TrText(
                    offer.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTheme.display(
                      context,
                      size: 20,
                      colour: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        Money.of(offer.price!),
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                        ),
                      ),
                      if (offer.componentsTotal != null &&
                          offer.componentsTotal! > offer.price!) ...[
                        const SizedBox(width: 8),
                        Text(
                          Money.of(offer.componentsTotal!),
                          style: const TextStyle(
                            color: Colors.white60,
                            decoration: TextDecoration.lineThrough,
                            decorationColor: Colors.white60,
                            fontSize: 12.5,
                          ),
                        ),
                      ],
                      const Spacer(),
                      Text(
                        context.l10n.productCount(offer.items.length),
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// When there is no offer to show: what Market Food is, in one forest-green card.
class _BrandBanner extends StatelessWidget {
  const _BrandBanner();

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    Widget perk(IconData icon, String text) => Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Row(
        children: [
          Icon(icon, size: 16, color: AppTheme.brassLight),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 4),
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
      decoration: BoxDecoration(
        gradient: AppTheme.forestGradient,
        borderRadius: BorderRadius.circular(20),
        boxShadow: AppTheme.shadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l10n.heroTitle,
            style: AppTheme.display(context, size: 22, colour: Colors.white),
          ),
          const SizedBox(height: 6),
          perk(Icons.local_shipping_outlined, l10n.perkDelivery),
          perk(Icons.payments_outlined, l10n.cashOnDelivery),
          perk(Icons.trending_down, l10n.perkTiers),
        ],
      ),
    );
  }
}

class _Categories extends ConsumerWidget {
  const _Categories({required this.selected});

  final String? selected;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categories = ref.watch(categoriesProvider);

    return categories.maybeWhen(
      data: (list) => list.isEmpty
          ? const SizedBox.shrink()
          : Padding(
              padding: const EdgeInsets.only(top: 16),
              child: SizedBox(
                height: 42,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: list.length + 1,
                  separatorBuilder: (_, _) => const SizedBox(width: 8),
                  itemBuilder: (context, i) {
                    if (i == 0) {
                      return _Chip(
                        label: context.l10n.allCategories,
                        icon: Icons.apps,
                        selected: selected == null,
                        onTap: () => ref
                            .read(catalogueFilterProvider.notifier)
                            .category(null),
                      );
                    }
                    final Category c = list[i - 1];
                    return _Chip(
                      label: c.name,
                      selected: selected == c.id,
                      onTap: () => ref
                          .read(catalogueFilterProvider.notifier)
                          .category(selected == c.id ? null : c.id),
                    );
                  },
                ),
              ),
            ),
      orElse: () => const SizedBox(height: 16),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({
    required this.label,
    required this.selected,
    required this.onTap,
    this.icon,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final colour = selected ? Colors.white : AppTheme.ink;
    return Material(
      color: selected ? AppTheme.emeraldDark : Colors.white,
      shape: StadiumBorder(
        side: BorderSide(
          color: selected ? AppTheme.emeraldDark : AppTheme.line,
        ),
      ),
      child: InkWell(
        customBorder: const StadiumBorder(),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 16, color: colour),
                const SizedBox(width: 6),
              ],
              TrText(
                label,
                style: TextStyle(
                  color: colour,
                  fontWeight: FontWeight.w600,
                  fontSize: 13.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PendingApprovalBanner extends StatelessWidget {
  const _PendingApprovalBanner();

  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    margin: const EdgeInsets.fromLTRB(16, 0, 16, 14),
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: AppTheme.brass50,
      border: Border.all(color: AppTheme.brass100),
      borderRadius: BorderRadius.circular(16),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(Icons.hourglass_top, color: AppTheme.brass, size: 20),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            context.l10n.pendingApprovalBanner,
            style: const TextStyle(
              fontSize: 13,
              color: AppTheme.ink700,
              height: 1.4,
            ),
          ),
        ),
      ],
    ),
  );
}

class _Message extends StatelessWidget {
  const _Message({
    required this.icon,
    required this.title,
    required this.detail,
    this.onRetry,
    this.retryLabel,
  });

  final IconData icon;
  final String title;
  final String detail;
  final VoidCallback? onRetry;
  final String? retryLabel;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.all(32),
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 72,
          height: 72,
          decoration: const BoxDecoration(
            color: AppTheme.sand,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, size: 32, color: AppTheme.muted),
        ),
        const SizedBox(height: 14),
        Text(title, style: AppTheme.display(context, size: 19)),
        const SizedBox(height: 6),
        // Often the server's own sentence.
        TrText(
          detail,
          textAlign: TextAlign.center,
          style: const TextStyle(color: AppTheme.muted),
        ),
        if (onRetry != null) ...[
          const SizedBox(height: 18),
          OutlinedButton(
            onPressed: onRetry,
            child: Text(retryLabel ?? context.l10n.retry),
          ),
        ],
      ],
    ),
  );
}
