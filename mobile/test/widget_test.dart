import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:market_food/core/i18n/language.dart';
import 'package:market_food/core/providers.dart';
import 'package:market_food/features/auth/ui/login_screen.dart';
import 'package:market_food/main.dart';

void main() {
  testWidgets('shows the sign-in screen when no session is stored', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        // Overridden rather than letting the app read the real secure store: a widget test
        // runs without a platform channel, and the point here is the routing decision.
        overrides: [
          sessionProvider.overrideWith(
            () => _FixedSession(const Session.none()),
          ),
          // The app asks the server which languages the shop offers as soon as it builds.
          // There is no server here, and the attempt outlives the test: the request's own
          // timeout is still pending when the tree is torn down, and the test framework
          // fails on the leftover timer rather than on anything this test is about.
          shopLanguagesProvider.overrideWith((ref) => ShopLanguages.shipped),
        ],
        child: const MarketFoodApp(),
      ),
    );
    await tester.pump();

    expect(find.byType(LoginScreen), findsOneWidget);
    expect(find.text('Se connecter'), findsOneWidget);
    expect(find.text('Mot de passe oublié ?'), findsOneWidget);
    expect(find.text('Demander l\'ouverture d\'un compte'), findsOneWidget);
  });
}

class _FixedSession extends SessionNotifier {
  _FixedSession(this._initial);

  final Session _initial;

  @override
  Session build() => _initial;
}
