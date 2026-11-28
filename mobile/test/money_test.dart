import 'package:flutter_test/flutter_test.dart';
import 'package:market_food/shared/money.dart';

void main() {
  // Money.symbol is set once at start-up from the shop's default currency; these tests put
  // it back so one of them cannot change the prices the next one reads.
  final original = Money.symbol;
  tearDown(() => Money.symbol = original);

  test('prints dirhams until the shop says otherwise', () {
    expect(Money.symbol, Money.fallbackSymbol);
    // No thousands here on purpose: fr_FR separates them with a space whose exact code point
    // has changed between intl versions, and this test is about the symbol.
    expect(Money.of(250), contains('250,00 DH'));
  });

  test('follows the currency the API returns', () {
    Money.symbol = 'MAD';
    expect(Money.of(20), contains('20,00 MAD'));
    expect(Money.perUnit(12.5, 'kg'), contains('12,50 MAD / kg'));
  });

  test('keeps the amount to the left of the symbol in Arabic too', () {
    // The isolate is what stops the bidirectional algorithm printing "DH 20,00" inside an
    // Arabic sentence; the invoice writes 20,00 DH in both languages, and so does the app.
    expect(Money.of(20).codeUnitAt(0), 0x2066);
    expect(Money.of(20).endsWith(String.fromCharCode(0x2069)), isTrue);
  });
}
