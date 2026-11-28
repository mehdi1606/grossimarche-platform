import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:market_food/core/i18n/content_translator.dart';
import 'package:market_food/core/i18n/language.dart';
import 'package:market_food/core/i18n/tr_text.dart';

/// A translation service that knows nothing and asks nobody.
///
/// Standing in for the real one keeps these tests about [TrText]'s own decision - stored
/// Arabic or French - and keeps the request (and its retry timers) out of a widget test that
/// has no server to answer it.
class _SilentTranslator extends ContentTranslator {
  _SilentTranslator() : super(Dio());

  @override
  String translate(String text) => text;
}

void main() {
  /// A product name on screen, in [locale], with whatever Arabic the catalogue holds.
  Future<void> show(WidgetTester tester, Locale locale, {String? arabic}) =>
      tester.pumpWidget(
        ProviderScope(
          overrides: [
            contentTranslatorProvider.overrideWith((ref) => _SilentTranslator()),
          ],
          child: MaterialApp(
            locale: locale,
            supportedLocales: supportedLanguages,
            // The same four the app itself installs. Without the Cupertino one, Flutter
            // warns that `ar` is not covered by every delegate, and a warning in a widget
            // test is a failure.
            localizationsDelegates: const [
              AppLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            home: Scaffold(body: TrText('Riz basmati', arabic: arabic)),
          ),
        ),
      );

  testWidgets('shows the stored Arabic at once, with no request', (
    tester,
  ) async {
    await show(tester, const Locale('ar'), arabic: 'أرز بسمتي');

    // On the very first frame: that is the whole point of translating at write time.
    expect(find.text('أرز بسمتي'), findsOneWidget);
    expect(find.text('Riz basmati'), findsNothing);
  });

  testWidgets('falls back to the French while nothing is stored', (
    tester,
  ) async {
    // A product nobody has translated yet, and one whose Arabic column was saved blank: both
    // go to the translation service, and neither may render an empty label.
    await show(tester, const Locale('ar'));
    expect(find.text('Riz basmati'), findsOneWidget);

    await show(tester, const Locale('ar'), arabic: '   ');
    expect(find.text('Riz basmati'), findsOneWidget);
  });

  testWidgets('leaves French screens in French', (tester) async {
    await show(tester, const Locale('fr'), arabic: 'أرز بسمتي');
    expect(find.text('Riz basmati'), findsOneWidget);
  });
}
