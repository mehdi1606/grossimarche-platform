import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../data/cart_models.dart';
import '../data/cart_repository.dart';

final cartRepositoryProvider = Provider<CartRepository>(
  (ref) => CartRepository(ref.watch(apiClientProvider)),
);

/// The cart, held for the whole app so the badge in the app bar and the cart screen can never
/// disagree about how many items there are.
class CartNotifier extends AsyncNotifier<Cart> {
  @override
  Future<Cart> build() {
    // Each account has its own cart on the server; the one loaded for the previous customer
    // must not be shown to the next.
    ref.watch(accountKeyProvider);
    return ref.watch(cartRepositoryProvider).load();
  }

  /// How many units of a product are already in the cart. Zero if none, or not loaded.
  int quantityOf(String productId) {
    for (final item in state.value?.items ?? const <CartItem>[]) {
      if (item.productId == productId) return item.quantity;
    }
    return 0;
  }

  /// Set a line to a quantity. Zero removes it.
  ///
  /// The screen stays on the old cart until the server answers, rather than guessing the new
  /// total: the ladder means adding one unit can change the price of all the others, and a
  /// number that corrects itself half a second later reads as a bug.
  ///
  /// Returns why the server refused, or null. A refusal (stock, minimum quantity) leaves the
  /// cart as it was: replacing it with an error would blank the whole cart screen over one line.
  Future<String?> setQuantity(String productId, int quantity) =>
      _apply((repository) => repository.setQuantity(productId, quantity));

  /// Put every product of a basket offer in the cart, at least at the basket's quantity.
  ///
  /// "At least" matters: a customer who already has 20 kg of rice must not see it cut to the
  /// basket's 10 kg because they tapped "add the basket". Lines are raised, never lowered.
  /// Sent one after another rather than in parallel, so each answer is the cart with the
  /// previous line already counted - and the last one is the cart with the saving applied.
  ///
  /// Returns why the server refused a line, or null. Lines accepted before the refusal stay in
  /// the cart, so the cart is reloaded to show exactly what made it in.
  Future<String?> addAll(Map<String, int> quantities) async {
    final repository = ref.read(cartRepositoryProvider);
    final current = {
      for (final item in state.value?.items ?? const <CartItem>[])
        item.productId: item.quantity,
    };
    final refused = await _apply((repository) async {
      Cart? cart;
      for (final entry in quantities.entries) {
        final have = current[entry.key] ?? 0;
        if (have >= entry.value) continue;
        cart = await repository.setQuantity(entry.key, entry.value);
      }
      return cart ?? await repository.load();
    });
    if (refused != null) {
      try {
        state = AsyncData(await repository.load());
      } on CartFailure {
        // Keep what is shown; the refusal is what the customer needs to read.
      }
    }
    return refused;
  }

  Future<String?> clear() => _apply((repository) async {
    await repository.clear();
    return const Cart.empty();
  });

  Future<String?> _apply(
    Future<Cart> Function(CartRepository repository) change,
  ) async {
    try {
      state = AsyncData(await change(ref.read(cartRepositoryProvider)));
      return null;
    } on CartFailure catch (e) {
      // A cart that never loaded has nothing to keep; show the error in its place.
      if (!state.hasValue) state = AsyncError(e, StackTrace.current);
      return e.message;
    }
  }

  Future<void> reload() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => ref.read(cartRepositoryProvider).load(),
    );
  }
}

final cartProvider = AsyncNotifierProvider<CartNotifier, Cart>(
  CartNotifier.new,
);

/// How many units are in the cart, for the badge. Zero while it is loading or failed - a
/// badge is decoration, and must never be the thing that shows an error.
final cartCountProvider = Provider<int>(
  (ref) =>
      ref.watch(cartProvider).maybeWhen(data: (c) => c.count, orElse: () => 0),
);
