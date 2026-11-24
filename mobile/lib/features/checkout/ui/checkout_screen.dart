import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/i18n/language.dart';
import '../../../core/i18n/tr_text.dart';
import '../../../core/providers.dart';
import '../../../core/theme.dart';
import '../../../shared/money.dart';
import '../../address/data/address_models.dart';
import '../../address/ui/address_form_sheet.dart';
import '../../address/ui/address_providers.dart';
import '../../cart/ui/cart_providers.dart';
import '../../orders/ui/order_providers.dart';
import '../data/checkout_repository.dart';
import 'order_placed_screen.dart';

final checkoutRepositoryProvider = Provider<CheckoutRepository>(
  (ref) => CheckoutRepository(ref.watch(apiClientProvider)),
);

/// Choose where it goes, and confirm.
class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  final _note = TextEditingController();
  final _coupon = TextEditingController();
  String? _addressId;
  bool _placing = false;
  String? _error;

  /// The promo code the server accepted, with what it takes off. Null until one is applied.
  CouponPreview? _applied;
  bool _checkingCoupon = false;
  String? _couponError;

  /// Generated once, for this screen, and reused on every retry.
  ///
  /// The point is the retry: if the first attempt times out, the order may well have been
  /// created anyway. Sending the same key means the server hands back that same order
  /// instead of creating a second one, and the customer gets one delivery rather than two.
  late final String _idempotencyKey = _newKey();

  static String _newKey() {
    final random = Random.secure();
    final bytes = List<int>.generate(16, (_) => random.nextInt(256));
    return bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
  }

  @override
  void dispose() {
    _note.dispose();
    _coupon.dispose();
    super.dispose();
  }

  Future<void> _applyCoupon() async {
    final code = _coupon.text.trim();
    FocusScope.of(context).unfocus();
    if (code.isEmpty) {
      setState(() => _couponError = context.l10n.couponEmpty);
      return;
    }
    setState(() {
      _checkingCoupon = true;
      _couponError = null;
    });
    try {
      final preview = await ref
          .read(checkoutRepositoryProvider)
          .previewCoupon(code);
      if (!mounted) return;
      setState(() {
        if (preview.valid) {
          _applied = preview;
          _error = null;
        } else {
          _couponError = preview.message ?? context.l10n.couponInvalid;
        }
      });
    } on CheckoutFailure catch (e) {
      if (mounted) setState(() => _couponError = e.message);
    } finally {
      if (mounted) setState(() => _checkingCoupon = false);
    }
  }

  void _removeCoupon() => setState(() {
    _applied = null;
    _couponError = null;
    _coupon.clear();
  });

  Future<void> _place() async {
    final addressId = _addressId;
    if (addressId == null) {
      setState(() => _error = context.l10n.errChooseAddress);
      return;
    }

    setState(() {
      _placing = true;
      _error = null;
    });

    try {
      final order = await ref
          .read(checkoutRepositoryProvider)
          .placeOrder(
            addressId: addressId,
            idempotencyKey: _idempotencyKey,
            note: _note.text.trim().isEmpty ? null : _note.text.trim(),
            couponCode: _applied?.code,
          );
      // The server emptied the cart; the app must forget its copy or the badge keeps the
      // old count until the next launch.
      await ref.read(cartProvider.notifier).reload();
      // The Orders tab is kept alive by the shell; without this it would still show the list
      // from before this order existed.
      ref.invalidate(ordersProvider);
      ref.invalidate(orderStatsProvider);
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => OrderPlacedScreen(order: order)),
        (route) => route.isFirst,
      );
    } on CheckoutFailure catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _placing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final addresses = ref.watch(addressesProvider);
    final cart = ref
        .watch(cartProvider)
        .maybeWhen(data: (c) => c, orElse: () => null);
    final l10n = context.l10n;
    // The server recomputes all of this when the order is placed; this is the same
    // arithmetic, so the number on the button is the number on the invoice.
    final total = cart == null
        ? null
        : max(0.0, cart.total - (_applied?.discount ?? 0));

    return Scaffold(
      appBar: AppBar(title: Text(l10n.checkoutTitle)),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
        children: [
          _Panel(
            number: 1,
            title: l10n.deliveryAddressTitle,
            child: addresses.when(
              loading: () => const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: CircularProgressIndicator(),
                ),
              ),
              error: (e, _) =>
                  TrText('$e', style: const TextStyle(color: AppTheme.danger)),
              data: (list) {
                // Pre-select the default address, so the common case is one tap on "Confirmer".
                if (_addressId == null && list.isNotEmpty) {
                  final preferred = list.firstWhere(
                    (a) => a.isDefault,
                    orElse: () => list.first,
                  );
                  _addressId = preferred.id;
                }
                if (list.isEmpty) {
                  return _NoAddress(
                    onAdd: () async {
                      if (await AddressFormSheet.show(context) == true) {
                        setState(() => _addressId = null);
                      }
                    },
                  );
                }
                return Column(
                  children: [
                    for (final a in list)
                      _AddressTile(
                        address: a,
                        selected: _addressId == a.id,
                        onTap: () => setState(() {
                          _addressId = a.id;
                          _error = null;
                        }),
                      ),
                    Align(
                      alignment: AlignmentDirectional.centerStart,
                      child: TextButton.icon(
                        onPressed: () => AddressFormSheet.show(context),
                        icon: const Icon(Icons.add, size: 18),
                        label: Text(l10n.addAddress),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),

          _Panel(
            number: 2,
            title: l10n.paymentTitle,
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.forest50,
                border: Border.all(color: AppTheme.emeraldDark, width: 1.4),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.payments_outlined,
                      color: AppTheme.emeraldDark,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      l10n.cashOnDelivery,
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                  const Icon(
                    Icons.check_circle,
                    color: AppTheme.emeraldDark,
                    size: 22,
                  ),
                ],
              ),
            ),
          ),

          _Panel(
            number: 3,
            title: l10n.driverNoteTitle,
            child: TextField(
              controller: _note,
              maxLines: 2,
              maxLength: 500,
              decoration: InputDecoration(
                hintText: l10n.driverNoteHint,
                counterText: '',
              ),
            ),
          ),

          _Panel(
            number: 4,
            title: l10n.couponTitle,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_applied != null)
                  _AppliedCoupon(
                    coupon: _applied!,
                    onRemove: _placing ? null : _removeCoupon,
                  )
                else
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _coupon,
                          textCapitalization: TextCapitalization.characters,
                          autocorrect: false,
                          textInputAction: TextInputAction.done,
                          onSubmitted: (_) =>
                              _checkingCoupon ? null : _applyCoupon(),
                          onChanged: (_) {
                            if (_couponError != null) {
                              setState(() => _couponError = null);
                            }
                          },
                          decoration: InputDecoration(
                            hintText: l10n.couponHint,
                            prefixIcon: const Icon(Icons.local_offer_outlined),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      SizedBox(
                        height: 54,
                        child: OutlinedButton(
                          onPressed: _checkingCoupon ? null : _applyCoupon,
                          child: _checkingCoupon
                              ? const SizedBox(
                                  height: 18,
                                  width: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : Text(l10n.couponApply),
                        ),
                      ),
                    ],
                  ),
                if (_applied == null && _couponError != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: TrText(
                      _couponError!,
                      style: const TextStyle(
                        fontSize: 12.5,
                        color: AppTheme.danger,
                      ),
                    ),
                  ),
              ],
            ),
          ),

          if (cart != null)
            Container(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              decoration: AppTheme.card(),
              child: Column(
                children: [
                  _Total(l10n.subtotal, Money.of(cart.subtotal)),
                  if (cart.discountTotal > 0)
                    _Total(
                      l10n.bundleDiscount,
                      '- ${Money.of(cart.discountTotal)}',
                      saving: true,
                    ),
                  if (_applied != null)
                    _Total(
                      l10n.couponLine(_applied!.code),
                      '- ${Money.of(_applied!.discount)}',
                      saving: true,
                    ),
                  _Total(
                    l10n.delivery,
                    cart.deliveryFee > 0
                        ? Money.of(cart.deliveryFee)
                        : l10n.deliveryByCity,
                  ),
                  const Divider(height: 18),
                  _Total(l10n.total, Money.of(total!), big: true),
                ],
              ),
            ),

          if (_error != null) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF3F2),
                border: Border.all(color: const Color(0xFFFECDCA)),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.error_outline,
                    size: 18,
                    color: AppTheme.danger,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TrText(
                      _error!,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppTheme.danger,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
      // The total and the button, pinned where the thumb is.
      bottomNavigationBar: Container(
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
                if (total != null) ...[
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n.total,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.muted,
                        ),
                      ),
                      Text(
                        Money.of(total),
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.emeraldDark,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 14),
                ],
                Expanded(
                  child: FilledButton(
                    onPressed: _placing ? null : _place,
                    child: _placing
                        ? const SizedBox(
                            height: 22,
                            width: 22,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.4,
                              color: Colors.white,
                            ),
                          )
                        : FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Text(l10n.confirmOrder),
                          ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _AddressTile extends StatelessWidget {
  const _AddressTile({
    required this.address,
    required this.selected,
    required this.onTap,
  });

  final Address address;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(12),
    child: Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: selected ? AppTheme.forest50 : Colors.white,
        border: Border.all(
          color: selected ? AppTheme.emeraldDark : AppTheme.line,
          width: selected ? 1.6 : 1,
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(
            selected ? Icons.radio_button_checked : Icons.radio_button_off,
            size: 20,
            color: selected ? AppTheme.emeraldDark : Colors.black26,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (address.label != null)
                  Text(
                    address.label!,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                    ),
                  ),
                Text(
                  address.summary,
                  style: const TextStyle(fontSize: 13, color: AppTheme.muted),
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

class _NoAddress extends StatelessWidget {
  const _NoAddress({required this.onAdd});

  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(18),
    decoration: AppTheme.card(radius: 16),
    child: Column(
      children: [
        const Icon(
          Icons.location_off_outlined,
          size: 36,
          color: Colors.black26,
        ),
        const SizedBox(height: 10),
        Text(
          context.l10n.noAddressTitle,
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 4),
        Text(
          context.l10n.noAddressDetail,
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 13, color: AppTheme.muted),
        ),
        const SizedBox(height: 14),
        FilledButton(onPressed: onAdd, child: Text(context.l10n.addAddress)),
      ],
    ),
  );
}

class _AppliedCoupon extends StatelessWidget {
  const _AppliedCoupon({required this.coupon, required this.onRemove});

  final CouponPreview coupon;
  final VoidCallback? onRemove;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsetsDirectional.fromSTEB(14, 6, 6, 6),
    decoration: BoxDecoration(
      border: Border.all(color: AppTheme.emeraldDark),
      borderRadius: BorderRadius.circular(12),
      color: AppTheme.forest50,
    ),
    child: Row(
      children: [
        const Icon(Icons.local_offer, size: 18, color: AppTheme.emeraldDark),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            '${coupon.code} : - ${Money.of(coupon.discount)}',
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
        ),
        TextButton(
          onPressed: onRemove,
          style: TextButton.styleFrom(foregroundColor: AppTheme.muted),
          child: Text(context.l10n.couponRemove),
        ),
      ],
    ),
  );
}

class _Total extends StatelessWidget {
  const _Total(this.label, this.value, {this.big = false, this.saving = false});

  final String label;
  final String value;
  final bool big;
  final bool saving;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 4),
    child: Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Flexible(
          child: Text(
            label,
            style: TextStyle(
              fontSize: big ? 16 : 13.5,
              fontWeight: big ? FontWeight.w700 : FontWeight.w400,
              color: big ? AppTheme.ink : AppTheme.muted,
            ),
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: big ? 21 : 13.5,
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

/// One numbered step of the checkout, in a white card.
class _Panel extends StatelessWidget {
  const _Panel({
    required this.number,
    required this.title,
    required this.child,
  });

  final int number;
  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 14),
    padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
    decoration: AppTheme.card(),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Container(
              width: 24,
              height: 24,
              alignment: Alignment.center,
              decoration: const BoxDecoration(
                color: AppTheme.emeraldDark,
                shape: BoxShape.circle,
              ),
              child: Text(
                '$number',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(title, style: AppTheme.display(context, size: 17)),
            ),
          ],
        ),
        const SizedBox(height: 12),
        child,
      ],
    ),
  );
}
