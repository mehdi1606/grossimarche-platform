import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/i18n/language.dart';
import '../../../core/i18n/tr_text.dart';
import '../../../shared/money.dart';
import '../data/address_models.dart';
import '../data/address_repository.dart';
import 'address_providers.dart';

/// Add a delivery address.
///
/// The city is a list, never free text: delivery is priced per city and per district, and a
/// typed "Casa" would match no rate at all. Choosing from what Market Food actually serves is
/// also how a customer outside the delivery area finds out before placing an order.
class AddressFormSheet extends ConsumerStatefulWidget {
  const AddressFormSheet({super.key});

  static Future<bool?> show(BuildContext context) => showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (_) => const AddressFormSheet(),
  );

  @override
  ConsumerState<AddressFormSheet> createState() => _AddressFormSheetState();
}

class _AddressFormSheetState extends ConsumerState<AddressFormSheet> {
  final _label = TextEditingController();
  final _line = TextEditingController();
  DeliveryCity? _city;
  String? _district;
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _label.dispose();
    _line.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final city = _city;
    if (city == null) {
      setState(() => _error = context.l10n.errChooseCity);
      return;
    }
    if (_line.text.trim().isEmpty) {
      setState(() => _error = context.l10n.errFullAddress);
      return;
    }
    // A city that prices by district cannot deliver to "somewhere in the city": without the
    // district there is no rate, and the order would be quoted at the wrong price.
    if (city.districts.isNotEmpty && _district == null) {
      setState(() => _error = context.l10n.errDistrict);
      return;
    }

    setState(() {
      _saving = true;
      _error = null;
    });

    try {
      await ref
          .read(addressRepositoryProvider)
          .create(
            city: city.name,
            district: _district,
            addressLine: _line.text.trim(),
            label: _label.text.trim().isEmpty ? null : _label.text.trim(),
            isDefault: true,
          );
      ref.invalidate(addressesProvider);
      if (mounted) Navigator.of(context).pop(true);
    } on AddressFailure catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cities = ref.watch(deliveryCitiesProvider);
    final l10n = context.l10n;

    return Padding(
      padding: EdgeInsets.fromLTRB(
        20,
        20,
        20,
        MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              l10n.newAddress,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 18),

            cities.when(
              loading: () => const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (e, _) =>
                  TrText('$e', style: const TextStyle(color: Colors.red)),
              data: (list) => Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  DropdownButtonFormField<DeliveryCity>(
                    initialValue: _city,
                    decoration: InputDecoration(labelText: l10n.cityLabel),
                    items: [
                      for (final c in list)
                        DropdownMenuItem(
                          value: c,
                          child: Text(
                            '${c.name}  ·  ${Money.of(c.deliveryFee)}',
                          ),
                        ),
                    ],
                    onChanged: (c) => setState(() {
                      _city = c;
                      _district = null;
                      _error = null;
                    }),
                  ),
                  if (_city != null && _city!.districts.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: _district,
                      decoration: InputDecoration(
                        labelText: l10n.districtLabel,
                      ),
                      isExpanded: true,
                      items: [
                        for (final d in _city!.districts)
                          DropdownMenuItem(
                            value: d.name,
                            child: Text(
                              d.deliveryFee == null
                                  ? d.name
                                  : '${d.name}  ·  ${Money.of(d.deliveryFee!)}',
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                      ],
                      onChanged: (d) => setState(() {
                        _district = d;
                        _error = null;
                      }),
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 12),
            TextField(
              controller: _line,
              maxLines: 2,
              decoration: InputDecoration(
                labelText: l10n.fullAddressLabel,
                hintText: l10n.fullAddressHint,
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _label,
              decoration: InputDecoration(
                labelText: l10n.addressNameLabel,
                hintText: l10n.addressNameHint,
              ),
            ),

            if (_error != null) ...[
              const SizedBox(height: 12),
              TrText(
                _error!,
                style: TextStyle(color: Colors.red.shade700, fontSize: 13),
              ),
            ],

            const SizedBox(height: 20),
            FilledButton(
              onPressed: _saving ? null : _save,
              child: _saving
                  ? const SizedBox(
                      height: 22,
                      width: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.4,
                        color: Colors.white,
                      ),
                    )
                  : Text(l10n.save),
            ),
          ],
        ),
      ),
    );
  }
}
