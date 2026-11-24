import 'dart:math';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../cart/ui/cart_providers.dart';
import '../../catalogue/data/catalogue_repository.dart';
import '../../catalogue/ui/catalogue_providers.dart';
import '../data/order_models.dart';

/// What "Commander à nouveau" managed to put in the cart.
class ReorderResult {
  const ReorderResult({required this.added, required this.skipped});

  final int added;

  /// Names of the lines that could not be added: delisted, out of stock, or no longer priced
  /// for this customer. Said out loud rather than silently dropped.
  final List<String> skipped;
}

/// Rebuild a past order in the cart, as the website does.
///
/// A wholesale customer buys the same basket again and again; making them find twenty products
/// one by one is what sends them back to the phone. It fills the cart rather than placing the
/// order, so today's prices and stock are seen before anything is committed.
///
/// Each product is read from today's catalogue, never from the old line: its price may have
/// changed, and the quantity is capped at what is on the shelf now. A product already in the
/// cart is raised to the order's quantity, never lowered.
Future<ReorderResult> reorder(WidgetRef ref, OrderDetail order) async {
  final catalogue = ref.read(catalogueRepositoryProvider);
  final cart = ref.read(cartProvider.notifier);
  try {
    await ref.read(cartProvider.future);
  } catch (_) {
    // An unreadable cart is reported by the first change below.
  }

  var added = 0;
  final skipped = <String>[];
  for (final line in order.lines) {
    final id = line.productId;
    if (id == null) {
      skipped.add(line.name);
      continue;
    }
    try {
      final product = await catalogue.product(id);
      final minimum = max(product.minOrderQuantity, 1);
      final quantity = min(max(line.quantity, minimum), product.stockQuantity);
      if (product.price == null || quantity < minimum) {
        skipped.add(line.name);
        continue;
      }
      final want = max(cart.quantityOf(id), quantity);
      final refused = await cart.setQuantity(id, want);
      if (refused == null) {
        added++;
      } else {
        skipped.add(line.name);
      }
    } on CatalogueFailure {
      skipped.add(line.name);
    }
  }
  return ReorderResult(added: added, skipped: skipped);
}
