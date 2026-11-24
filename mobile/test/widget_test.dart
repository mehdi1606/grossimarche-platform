import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
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
