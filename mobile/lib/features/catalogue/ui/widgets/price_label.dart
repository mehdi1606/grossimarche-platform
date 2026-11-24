import 'package:flutter/material.dart';

import '../../../../core/i18n/language.dart';
import '../../../../core/theme.dart';
import '../../../../shared/money.dart';

/// A price, or an honest explanation of why there isn't one.
///
/// The API returns null rather than a number when the account has no trade attached - an
/// application Market Food has not approved yet. Printing 0,00 DH there would be a lie, and
/// hiding the line entirely would leave the customer wondering whether the app is broken. So
/// the absence is given a reason.
///
/// The amount is bold and green; the unit is quiet beside it, so the eye reads the number.
class PriceLabel extends StatelessWidget {
  const PriceLabel({
    super.key,
    required this.price,
    required this.unit,
    this.large = false,
  });

  final double? price;
  final String unit;
  final bool large;

  @override
  Widget build(BuildContext context) {
    final amount = price;

    if (amount == null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.lock_outline,
            size: large ? 18 : 14,
            color: AppTheme.muted,
          ),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              context.l10n.priceOnApproval,
              style: TextStyle(
                fontSize: large ? 15 : 12,
                color: AppTheme.muted,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      );
    }

    return Text.rich(
      TextSpan(
        children: [
          TextSpan(
            text: Money.of(amount),
            style: TextStyle(
              fontSize: large ? 28 : 15.5,
              fontWeight: FontWeight.w800,
              color: AppTheme.emeraldDark,
              letterSpacing: -0.2,
            ),
          ),
          if (unit.isNotEmpty)
            TextSpan(
              text: ' / $unit',
              style: TextStyle(
                fontSize: large ? 15 : 11.5,
                fontWeight: FontWeight.w500,
                color: AppTheme.muted,
              ),
            ),
        ],
      ),
      // Prices read left to right in both languages, as on the invoice.
      textDirection: TextDirection.ltr,
    );
  }
}
