import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/i18n/language.dart';
import '../../core/providers.dart';
import '../../core/theme.dart';
import '../account/ui/account_screen.dart';
import '../catalogue/ui/catalogue_screen.dart';
import '../offers/ui/offers_screen.dart';
import '../orders/ui/orders_screen.dart';

/// Which tab is showing. A provider rather than widget state, so a screen can send the
/// customer to another tab - the catalogue's "Voir tout" opens the offers.
class HomeTabNotifier extends Notifier<int> {
  @override
  int build() {
    // The next customer to sign in starts on the catalogue, not on the last one's tab.
    ref.watch(accountKeyProvider);
    return 0;
  }

  void go(int index) => state = index;
}

final homeTabProvider = NotifierProvider<HomeTabNotifier, int>(
  HomeTabNotifier.new,
);

/// The four places a customer goes, one tap apart.
///
/// An IndexedStack keeps each tab alive: a buyer who scrolled halfway down the catalogue,
/// checked an order and came back finds the catalogue where they left it, not reloaded from
/// the top.
class HomeShell extends ConsumerWidget {
  const HomeShell({super.key});

  static const _pages = [
    CatalogueScreen(),
    OffersScreen(),
    OrdersScreen(),
    AccountScreen(),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final index = ref.watch(homeTabProvider);
    final l10n = context.l10n;

    // Android's back button on another tab returns to the catalogue rather than closing the
    // app; only from the catalogue does it leave.
    return PopScope(
      canPop: index == 0,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) ref.read(homeTabProvider.notifier).go(0);
      },
      child: Scaffold(
        body: IndexedStack(index: index, children: _pages),
        bottomNavigationBar: DecoratedBox(
          decoration: const BoxDecoration(
            border: Border(top: BorderSide(color: AppTheme.line)),
          ),
          child: NavigationBar(
            selectedIndex: index,
            onDestinationSelected: ref.read(homeTabProvider.notifier).go,
            destinations: [
              NavigationDestination(
                icon: const Icon(Icons.storefront_outlined),
                selectedIcon: const Icon(Icons.storefront),
                label: l10n.tabCatalogue,
              ),
              NavigationDestination(
                icon: const Icon(Icons.local_offer_outlined),
                selectedIcon: const Icon(Icons.local_offer),
                label: l10n.tabOffers,
              ),
              NavigationDestination(
                icon: const Icon(Icons.receipt_long_outlined),
                selectedIcon: const Icon(Icons.receipt_long),
                label: l10n.tabOrders,
              ),
              NavigationDestination(
                icon: const Icon(Icons.person_outline),
                selectedIcon: const Icon(Icons.person),
                label: l10n.tabAccount,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
