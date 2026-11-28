import 'package:intl/intl.dart';

/// Prices, written the way the rest of Market Food writes them: `1 250,00 DH`.
///
/// French formatting throughout - a comma for decimals, a space for thousands - because the
/// storefront and the invoices do the same, and a customer comparing the app to their e-mailed
/// invoice must not find two different numbers for one amount.
class Money {
  const Money._();

  static final NumberFormat _format = NumberFormat('#,##0.00', 'fr_FR');

  /// The symbol every amount in the app is printed with.
  ///
  /// `DH` until the shop's own answer is known: the back office has a Currencies page, and
  /// `GET /currencies/default` is what it sets. Set once, before the first frame, by
  /// `CurrencyStore` - see lib/core/currency.dart, which also explains why nothing here
  /// converts an amount. The API already prices in that currency; only its name was in doubt.
  static String symbol = fallbackSymbol;

  /// What Market Food has always printed, and what a phone with no signal still prints.
  static const String fallbackSymbol = 'DH';

  // Left-to-right isolate: inside an Arabic sentence the bidirectional algorithm would
  // otherwise print "DH 20,00", and "−38 %" as "% 38−". The invoice writes 20,00 DH in both
  // languages, and so does the app.
  static final _ltr = String.fromCharCode(0x2066);
  static final _end = String.fromCharCode(0x2069);

  static String of(double amount) =>
      '$_ltr${_format.format(amount)} $symbol$_end';

  /// A discount badge: −38 %.
  static String percentOff(int percent) => '$_ltr−$percent %$_end';

  /// A unit price, for a ladder rung or a line: `12,50 DH / kg`.
  static String perUnit(double amount, String unit) => unit.isEmpty
      ? of(amount)
      : '$_ltr${_format.format(amount)} $symbol / $unit$_end';
}
