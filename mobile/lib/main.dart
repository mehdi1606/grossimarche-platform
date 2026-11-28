import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart';

import 'core/currency.dart';
import 'core/i18n/language.dart';
import 'core/navigation.dart';
import 'core/providers.dart';
import 'core/theme.dart';
import 'features/auth/data/auth_repository.dart';
import 'features/auth/ui/login_screen.dart';
import 'features/home/home_shell.dart';
import 'shared/money.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Month names for order dates in both languages - "12 oct. 2026" / "12 أكتوبر 2026".
  // Without this the formatter throws the first time a localized pattern is used.
  await initializeDateFormatting('fr');
  await initializeDateFormatting('ar');
  // Western digits in Arabic dates, as Moroccan invoices, prices and phone numbers use them;
  // "١٢" beside "12,50 DH" would read as two different number systems on one line.
  DateFormat.useNativeDigitsByDefaultFor('ar', false);
  final language = await LanguageStore().initial();
  // The shop's currency symbol, before the first price is drawn - see CurrencyStore for why
  // this is read here and not from a provider. Amounts are untouched: the API already prices
  // in this currency.
  Money.symbol = await CurrencyStore().start();
  runApp(
    ProviderScope(
      overrides: [
        languageProvider.overrideWith(() => LanguageNotifier(language)),
      ],
      child: const MarketFoodApp(),
    ),
  );
}

class MarketFoodApp extends ConsumerStatefulWidget {
  const MarketFoodApp({super.key});

  @override
  ConsumerState<MarketFoodApp> createState() => _MarketFoodAppState();
}

class _MarketFoodAppState extends ConsumerState<MarketFoodApp> {
  @override
  void initState() {
    super.initState();
    _restoreSession();
  }

  /// Decide, once, whether the stored session is still worth anything.
  ///
  /// A refresh token survives thirty days, so a customer who signed in last week must not be
  /// asked again. Asking the server for the profile is what proves it: the interceptor
  /// renews the access token on the way, and a refusal clears the store.
  Future<void> _restoreSession() async {
    void settle(Session session) {
      if (mounted) ref.read(sessionProvider.notifier).set(session);
    }

    if (!await ref.read(tokenStoreProvider).hasSession) {
      settle(const Session.none());
      return;
    }

    try {
      // The /me payload is the same UserResponse the sign-in response carries.
      final response = await ref
          .read(apiClientProvider)
          .dio
          .get<Map<String, dynamic>>('/me');
      final body = response.data;
      if (response.statusCode == 200 && body != null) {
        final user = SignedInUser.fromJson(body);
        if (user.isCustomer) {
          settle(Session.of(user));
          return;
        }
        // A staff session stored by an earlier build: end it rather than open the shop on an
        // account that has no trade and no prices.
        await ref.read(authRepositoryProvider).signOut();
      }
    } catch (_) {
      // Fall through: a phone with no signal at launch lands on the sign-in screen rather
      // than on a catalogue it cannot load. Lot 2 brings the cached catalogue that makes an
      // offline launch worth something, and this is where that decision will be revisited.
    }
    settle(const Session.none());
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionProvider);
    final language = ref.watch(languageProvider);

    // The back office can switch a language off. A phone left on one that is no longer
    // offered would read half the shop in a language nobody maintains, so the stored choice
    // follows the shop's list and falls back to its default language.
    ref.listen<AsyncValue<ShopLanguages>>(shopLanguagesProvider, (_, next) {
      final shop = next.value;
      if (shop == null) return;
      if (!shop.locales.any(
        (l) => l.languageCode == ref.read(languageProvider).languageCode,
      )) {
        ref.read(languageProvider.notifier).set(shop.fallback);
      }
      // No `fireImmediately`: this listen is what starts the request, so the first value is
      // always still loading - and a provider must not be written to while building.
    });

    // Push follows the session: on at sign-in, off - and the device forgotten - at sign-out.
    ref.listen<Session>(sessionProvider, (previous, next) {
      final push = ref.read(pushServiceProvider);
      if (next.status == SessionStatus.signedIn &&
          previous?.status != SessionStatus.signedIn) {
        push.start(onOpenOrder: openOrder, onOpenOffer: openOffer);
      } else if (next.status == SessionStatus.signedOut &&
          previous?.status == SessionStatus.signedIn) {
        push.stop();
        // Signed out from deep inside the app (expired session, deleted account): the screens
        // pushed over the home would otherwise stay on top of the sign-in screen.
        navigatorKey.currentState?.popUntil((route) => route.isFirst);
      }
    });

    return MaterialApp(
      navigatorKey: navigatorKey,
      scaffoldMessengerKey: scaffoldMessengerKey,
      navigatorObservers: [ClearSnackBarsOnNavigation()],
      title: 'Market Food',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(language),

      // French or Arabic, as chosen on the sign-in screen or in the account. Arabic turns the
      // whole layout right-to-left: Flutter mirrors rows, paddings and back arrows itself.
      locale: language,
      supportedLocales: supportedLanguages,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],

      home: switch (session.status) {
        SessionStatus.unknown => const _Splash(),
        SessionStatus.signedOut => const LoginScreen(),
        SessionStatus.signedIn => const HomeShell(),
      },
    );
  }
}

/// Shown only while the secure store is being read - a fraction of a second, but without it
/// the sign-in screen flashes at every launch for someone who is already signed in.
class _Splash extends StatelessWidget {
  const _Splash();

  @override
  Widget build(BuildContext context) => const Scaffold(
    body: Center(child: CircularProgressIndicator(color: AppTheme.emeraldDark)),
  );
}
