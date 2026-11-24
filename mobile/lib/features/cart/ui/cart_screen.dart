import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/i18n/language.dart';
import '../../../core/i18n/tr_text.dart';
import '../../../core/theme.dart';
import '../../../shared/money.dart';
import '../../../shared/product_image.dart';
import '../../checkout/ui/checkout_screen.dart';
import '../../home/home_shell.dart';
import '../data/cart_models.dart';
import 'cart_providers.dart';

class CartScreen extends ConsumerWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartProvider);
    final l10n = context.l10n;
    final lines = cart.value?.items.length ?? 0;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Text(l10n.cartTitle),
            if (lines > 0) ...[
              const SizedBox(width: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                decoration: BoxDecoration(
                  color: AppTheme.forest100,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  l10n.cartLineCount(lines),
                  style: Theme.of(context).textTheme.labelMedium!.copyWith(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.forest700,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
      body: cart.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => _Centered(
          icon: Icons.error_outline,
          title: l10n.cartUnavailable,
          detail: '$e',
          action: l10n.retry,
          onAction: () => ref.read(cartProvider.notifier).reload(),
        ),
        data: (c) => c.isEmpty
            ? _Centered(
                icon: Icons.shopping_basket_outlined,
                title: l10n.cartEmptyTitle,
                detail: l10n.cartEmptyDetail,
                action: l10n.continueShopping,
                onAction: () {
                  ref.read(homeTabProvider.notifier).go(0);
                  Navigator.of(context).popUntil((r) => r.isFirst);
                },
              )
            : _Filled(cart: c),
      ),
      bottomNavigationBar: cart.maybeWhen(
        data: (c) => c.isEmpty ? null : _Summary(cart: c),
        orElse: () => null,
      ),
    );
  }
}

class _Filled extends StatelessWidget {
  const _Filled({required this.cart});

  final Cart cart;

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
      itemCount: cart.items.length,
      separatorBuilder: (_, _) => const SizedBox(height: 12),
      itemBuilder: (context, i) => _Line(item: cart.items[i]),
    );
  }
}

class _Line extends ConsumerWidget {
  const _Line({required this.item});

  final CartItem item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    Future<void> change(int quantity) async {
      final messenger = ScaffoldMessenger.of(context);
      final refused = await ref
          .read(cartProvider.notifier)
          .setQuantity(item.productId, quantity);
      if (refused != null) {
        messenger
          ..hideCurrentSnackBar()
          ..showSnackBar(
            SnackBar(
              content: TrText(
                refused,
                style: const TextStyle(color: Colors.white),
              ),
            ),
          );
      }
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: AppTheme.card(),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            decoration: BoxDecoration(
              color: AppTheme.sand,
              borderRadius: BorderRadius.circular(14),
            ),
            child: ProductImage(
              url: item.imageUrl,
              name: item.name,
              size: 84,
              radius: 14,
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
                    fontWeight: FontWeight.w700,
                    fontSize: 14.5,
                  ),
                ),
                const SizedBox(height: 3),
                Wrap(
                  crossAxisAlignment: WrapCrossAlignment.center,
                  spacing: 8,
                  children: [
                    Text(
                      Money.perUnit(item.effectiveUnitPrice, item.unit),
                      style: const TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.emeraldDark,
                      ),
                    ),
                    // The list price, struck through, only when the ladder actually beat it.
                    if (item.hasDiscount)
                      Text(
                        Money.of(item.unitPrice!),
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.muted,
                          decoration: TextDecoration.lineThrough,
                          decorationColor: AppTheme.muted,
                        ),
                      ),
                  ],
                ),
                if (item.stockIssue) ...[
                  const SizedBox(height: 6),
                  _Warning(
                    context.l10n.stockShort(item.availableStock, item.unit),
                    critical: true,
                  ),
                ] else if (item.priceChanged) ...[
                  const SizedBox(height: 6),
                  _Warning(context.l10n.priceChanged),
                ],
                const SizedBox(height: 10),
                Row(
                  children: [
                    _Stepper(quantity: item.quantity, onChanged: change),
                    const Spacer(),
                    Text(
                      Money.of(item.lineTotal),
                      style: const TextStyle(
                        fontSize: 15.5,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.ink,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Minus, the number, plus - and a bin at one.
///
/// The minus turning into a bin at the last unit is what stops a customer tapping minus,
/// landing on zero, and wondering whether the line is gone or merely empty.
class _Stepper extends StatelessWidget {
  const _Stepper({required this.quantity, required this.onChanged});

  final int quantity;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    Widget button(
      IconData icon,
      VoidCallback onTap, {
      bool filled = false,
      Color? colour,
    }) => Material(
      color: filled ? AppTheme.emeraldDark : Colors.white,
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: SizedBox(
          width: 32,
          height: 32,
          child: Icon(
            icon,
            size: 17,
            color: colour ?? (filled ? Colors.white : AppTheme.ink),
          ),
        ),
      ),
    );

    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: AppTheme.sand,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          button(
            quantity <= 1 ? Icons.delete_outline : Icons.remove,
            () => onChanged(quantity - 1),
            colour: quantity <= 1 ? AppTheme.danger : null,
          ),
          SizedBox(
            width: 34,
            child: Text(
              '$quantity',
              textAlign: TextAlign.center,
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
            ),
          ),
          button(Icons.add, () => onChanged(quantity + 1), filled: true),
        ],
      ),
    );
  }
}

class _Warning extends StatelessWidget {
  const _Warning(this.text, {this.critical = false});

  final String text;
  final bool critical;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
    decoration: BoxDecoration(
      color: critical ? const Color(0xFFFEF3F2) : AppTheme.brass50,
      borderRadius: BorderRadius.circular(8),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(
          critical ? Icons.error_outline : Icons.info_outline,
          size: 14,
          color: critical ? AppTheme.danger : AppTheme.brass,
        ),
        const SizedBox(width: 5),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 11.5,
              color: critical ? AppTheme.danger : AppTheme.brass,
            ),
          ),
        ),
      ],
    ),
  );
}

/// The totals and the way out, in a panel pinned to the bottom where a thumb already is.
class _Summary extends StatelessWidget {
  const _Summary({required this.cart});

  final Cart cart;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
        boxShadow: AppTheme.shadowLarge,
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 14),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _Row(l10n.subtotal, Money.of(cart.subtotal)),
              if (cart.discountTotal > 0)
                _Row(
                  l10n.bundleDiscount,
                  '- ${Money.of(cart.discountTotal)}',
                  saving: true,
                ),
              _Row(
                l10n.delivery,
                cart.deliveryFee > 0
                    ? Money.of(cart.deliveryFee)
                    : l10n.deliveryAtCheckout,
              ),
              const Divider(height: 20),
              _Row(l10n.total, Money.of(cart.total), big: true),
              const SizedBox(height: 14),
              FilledButton(
                // A cart the server says is short of stock cannot be ordered - better to stop
                // here than to be refused after choosing an address.
                onPressed: cart.hasStockIssue
                    ? null
                    : () => Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => const CheckoutScreen(),
                        ),
                      ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      cart.hasStockIssue ? l10n.fixStockIssues : l10n.checkout,
                    ),
                    if (!cart.hasStockIssue) ...[
                      const SizedBox(width: 8),
                      Icon(Icons.arrow_forward, size: 20),
                    ],
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

class _Row extends StatelessWidget {
  const _Row(this.label, this.value, {this.big = false, this.saving = false});

  final String label;
  final String value;
  final bool big;
  final bool saving;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 3),
    child: Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: big ? 16 : 13.5,
            fontWeight: big ? FontWeight.w700 : FontWeight.w400,
            color: big ? AppTheme.ink : AppTheme.muted,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: big ? 22 : 13.5,
            fontWeight: big ? FontWeight.w800 : FontWeight.w600,
            color: big
                ? AppTheme.emeraldDark
                : (saving ? AppTheme.brass : AppTheme.ink),
          ),
        ),
      ],
    ),
  );
}

class _Centered extends StatelessWidget {
  const _Centered({
    required this.icon,
    required this.title,
    required this.detail,
    this.action,
    this.onAction,
  });

  final IconData icon;
  final String title;
  final String detail;
  final String? action;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 96,
            height: 96,
            decoration: const BoxDecoration(
              color: AppTheme.sand,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 44, color: AppTheme.emeraldDark),
          ),
          const SizedBox(height: 18),
          Text(
            title,
            textAlign: TextAlign.center,
            style: AppTheme.display(context, size: 22),
          ),
          const SizedBox(height: 8),
          // Often the server's own sentence.
          TrText(
            detail,
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppTheme.muted, height: 1.45),
          ),
          if (action != null) ...[
            const SizedBox(height: 22),
            FilledButton(
              onPressed: onAction,
              style: FilledButton.styleFrom(minimumSize: const Size(220, 50)),
              child: Text(action!),
            ),
          ],
        ],
      ),
    ),
  );
}
