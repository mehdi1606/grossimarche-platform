import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/i18n/language.dart';
import '../../../core/theme.dart';
import '../../../shared/money.dart';
import '../data/catalogue_models.dart';
import 'catalogue_providers.dart';

/// The sheet behind the filter button: how to sort, between which prices, and whether to
/// bother with what is out of stock.
///
/// It edits a copy and applies it on "Voir les résultats", never on a keystroke. A buyer
/// typing "1" then "150" in the minimum must not watch three result sets go by, and a reload
/// per character is three requests the shop's 3G cannot spare.
Future<void> showCatalogueFilterSheet(BuildContext context) =>
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (_) => const _FilterSheet(),
    );

class _FilterSheet extends ConsumerStatefulWidget {
  const _FilterSheet();

  @override
  ConsumerState<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends ConsumerState<_FilterSheet> {
  late ProductSort _sort;
  late bool _inStockOnly;
  late final TextEditingController _min;
  late final TextEditingController _max;

  @override
  void initState() {
    super.initState();
    final filter = ref.read(catalogueFilterProvider);
    _sort = filter.sort;
    _inStockOnly = filter.inStockOnly;
    _min = TextEditingController(text: _asText(filter.minPrice));
    _max = TextEditingController(text: _asText(filter.maxPrice));
  }

  @override
  void dispose() {
    _min.dispose();
    _max.dispose();
    super.dispose();
  }

  /// A whole number is written without decimals: a buyer typed "150", not "150.0".
  static String _asText(double? amount) {
    if (amount == null) return '';
    return amount == amount.roundToDouble()
        ? amount.round().toString()
        : amount.toString();
  }

  /// What the customer typed, as a number the server will accept.
  ///
  /// A comma is what a Moroccan keyboard and a French habit produce, and `double.tryParse`
  /// refuses it; so does a stray space. Anything still unreadable, and zero, mean "no bound"
  /// rather than an error message for a field nobody is obliged to fill.
  static double? _amount(TextEditingController field) {
    final text = field.text.trim().replaceAll(' ', '').replaceAll(',', '.');
    if (text.isEmpty) return null;
    final value = double.tryParse(text);
    return (value == null || value <= 0) ? null : value;
  }

  void _apply() {
    var min = _amount(_min);
    var max = _amount(_max);
    // Entered the other way round: swap rather than return nothing at all, which is what the
    // server would answer for a range that excludes every price.
    if (min != null && max != null && min > max) {
      final swapped = min;
      min = max;
      max = swapped;
    }
    ref
        .read(catalogueFilterProvider.notifier)
        .refine(
          sort: _sort,
          minPrice: min,
          maxPrice: max,
          inStockOnly: _inStockOnly,
        );
    Navigator.of(context).pop();
  }

  void _reset() {
    setState(() {
      _sort = ProductSort.newest;
      _inStockOnly = false;
      _min.clear();
      _max.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return SafeArea(
      top: false,
      child: Padding(
        // The keyboard, when a price field has focus: without this the buttons sit under it.
        padding: EdgeInsets.only(
          bottom: MediaQuery.viewInsetsOf(context).bottom,
        ),
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(l10n.filterSort, style: AppTheme.display(context, size: 20)),
              const SizedBox(height: 18),

              Text(l10n.sortLabel.toUpperCase(), style: AppTheme.eyebrow),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final sort in ProductSort.values)
                    _SortChip(
                      label: _sortLabel(l10n, sort),
                      selected: _sort == sort,
                      onTap: () => setState(() => _sort = sort),
                    ),
                ],
              ),

              const SizedBox(height: 22),
              Text(l10n.priceRange.toUpperCase(), style: AppTheme.eyebrow),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: _PriceField(
                      controller: _min,
                      label: l10n.priceMinLabel,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _PriceField(
                      controller: _max,
                      label: l10n.priceMaxLabel,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 18),
              // A switch rather than a chip: it is a yes/no about the whole list, and the
              // whole row is the target, which is easier to hit than a 20 px thumb.
              Container(
                decoration: AppTheme.card(radius: 16),
                child: SwitchListTile(
                  value: _inStockOnly,
                  onChanged: (on) => setState(() => _inStockOnly = on),
                  // No colours of its own: Material 3 draws a selected switch in the scheme's
                  // primary, which this theme has already set to the brand's forest green.
                  contentPadding: const EdgeInsetsDirectional.fromSTEB(
                    16,
                    4,
                    10,
                    4,
                  ),
                  title: Text(
                    l10n.inStockOnly,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14.5,
                    ),
                  ),
                  secondary: const Icon(
                    Icons.inventory_2_outlined,
                    color: AppTheme.emeraldDark,
                  ),
                ),
              ),

              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _reset,
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size.fromHeight(52),
                      ),
                      child: Text(l10n.filtersReset),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: FilledButton(
                      onPressed: _apply,
                      child: Text(l10n.filtersApply),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

String _sortLabel(AppLocalizations l10n, ProductSort sort) => switch (sort) {
  ProductSort.newest => l10n.sortNewest,
  ProductSort.priceAsc => l10n.sortPriceAsc,
  ProductSort.priceDesc => l10n.sortPriceDesc,
  ProductSort.alphabetical => l10n.sortName,
};

class _SortChip extends StatelessWidget {
  const _SortChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Material(
    color: selected ? AppTheme.emeraldDark : Colors.white,
    shape: StadiumBorder(
      side: BorderSide(color: selected ? AppTheme.emeraldDark : AppTheme.line),
    ),
    child: InkWell(
      customBorder: const StadiumBorder(),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : AppTheme.ink,
            fontWeight: FontWeight.w600,
            fontSize: 13.5,
          ),
        ),
      ),
    ),
  );
}

class _PriceField extends StatelessWidget {
  const _PriceField({required this.controller, required this.label});

  final TextEditingController controller;
  final String label;

  @override
  Widget build(BuildContext context) => TextField(
    controller: controller,
    // Digits, a comma and a dot: the number pad, and nothing a price cannot contain.
    keyboardType: const TextInputType.numberWithOptions(decimal: true),
    inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]'))],
    // The amount reads left to right in both languages, as everywhere else prices do.
    textDirection: TextDirection.ltr,
    decoration: InputDecoration(
      labelText: label,
      suffixText: Money.symbol,
      isDense: true,
    ),
  );
}
