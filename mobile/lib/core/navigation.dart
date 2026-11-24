import 'package:flutter/material.dart';

import '../features/offers/ui/offer_screen.dart';
import '../features/orders/ui/order_detail_screen.dart';

/// The app's navigator, reachable from outside any widget.
///
/// A push notification is handled by code that has no BuildContext - it fires while the app
/// is in the background, or launches it cold. This key is how that code still opens the
/// right screen instead of dropping the customer on the catalogue.
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

final GlobalKey<ScaffoldMessengerState> scaffoldMessengerKey =
    GlobalKey<ScaffoldMessengerState>();

/// Clears any snack bar when the screen changes.
///
/// A message belongs to the screen that raised it. The messenger is app-wide, so without
/// this "Riz ajouté au panier" stayed on screen through the cart, the checkout and the order
/// confirmation - found by the end-to-end test, three screens after the product page.
class ClearSnackBarsOnNavigation extends NavigatorObserver {
  void _clear() => scaffoldMessengerKey.currentState?.clearSnackBars();

  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) => _clear();

  @override
  void didPop(Route<dynamic> route, Route<dynamic>? previousRoute) => _clear();

  @override
  void didReplace({Route<dynamic>? newRoute, Route<dynamic>? oldRoute}) =>
      _clear();
}

/// Open an order, from a notification or anywhere else that only knows its id.
void openOrder(String orderId) {
  navigatorKey.currentState?.push(
    MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: orderId)),
  );
}

/// Open a basket offer - where a "new basket" notification lands, carrying the slug the
/// server puts in its data payload.
void openOffer(String slug) {
  navigatorKey.currentState?.push(
    MaterialPageRoute(builder: (_) => OfferScreen(slug: slug)),
  );
}
