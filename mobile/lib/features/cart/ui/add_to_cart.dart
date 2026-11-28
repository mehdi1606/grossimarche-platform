import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/i18n/language.dart';
import '../../../core/i18n/tr_text.dart';
import 'cart_providers.dart';
import 'cart_screen.dart';

/// Add a product the way a wholesale buyer expects, from the grid or from its page.
///
/// The first tap puts in the minimum order quantity, not one: a product sold from 10 kg up
/// cannot be added as a single kilo, and the customer should not learn the rule by being told
/// no. Once it is in the cart, each tap adds one more - setting the minimum again would quietly
/// cut a 40 kg line back to 10 kg.
Future<void> addToCart(
  BuildContext context,
  WidgetRef ref, {
  required String productId,
  required String name,
  required int minOrderQuantity,
  String? arabicName,
}) async {
  final cart = ref.read(cartProvider.notifier);
  final messenger = ScaffoldMessenger.of(context);
  final navigator = Navigator.of(context);
  final l10n = context.l10n;
  // The cart may still be loading when the customer taps; the line must be counted first.
  try {
    await ref.read(cartProvider.future);
  } catch (_) {
    // Unavailable cart: the change below reports the problem.
  }
  final have = cart.quantityOf(productId);
  final want = have > 0 ? have + 1 : max(minOrderQuantity, 1);
  final error = await cart.setQuantity(productId, want);
  messenger
    ..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(
        duration: const Duration(seconds: 3),
        content: error != null
            ? TrText(error, style: const TextStyle(color: Colors.white))
            : TrText(
                name,
                // The catalogue's own Arabic when the caller has it: the card the customer
                // just tapped reads in Arabic, and the confirmation under it should too.
                arabic: arabicName,
                style: const TextStyle(color: Colors.white),
                format: (n) => have > 0
                    ? l10n.quantityInCart(n, want)
                    : l10n.addedToCart(n),
              ),
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
}
