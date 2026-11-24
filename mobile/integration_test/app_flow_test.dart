// The whole customer journey, driven through the real UI against the real backend.
//
// Run with tool/e2e.py, which reads the test account from .env.local and passes it in;
// nothing secret is written here. It needs the local stack running and an emulator.
//
// What it proves that unit tests cannot: that each screen actually reaches its endpoint,
// that the server's answers render, and that the steps chain - sign in, browse, buy, follow,
// cancel - the way a customer would do them.

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:market_food/core/api/token_store.dart';
import 'package:market_food/features/auth/ui/forgot_password_screen.dart';
import 'package:market_food/features/cart/ui/cart_screen.dart';
import 'package:market_food/features/catalogue/ui/widgets/product_card.dart';
import 'package:market_food/features/orders/ui/order_detail_screen.dart';
import 'package:market_food/features/orders/ui/order_providers.dart';
import 'package:market_food/main.dart' as app;

const _email = String.fromEnvironment('E2E_EMAIL');
const _password = String.fromEnvironment('E2E_PASSWORD');

/// Milliseconds each step took, from the tap to the screen showing what it should.
final _timings = <String, int>{};

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  // On a real device, typed text goes to the real keyboard unless this is registered, and
  // enterText then does nothing at all - silently in profile mode, where the assertion that
  // would have said so is compiled out. The fields stayed empty and the app, rightly,
  // refused the sign-in for a missing e-mail.
  binding.testTextInput.register();

  testWidgets('parcours client complet', (tester) async {
    expect(_email, isNotEmpty, reason: 'E2E_EMAIL manquant : lancer via tool/e2e.py');

    // Start signed out, whatever a previous run left in the secure store.
    await TokenStore().clear();

    final launch = Stopwatch()..start();
    await app.main();
    await _waitFor(tester, find.text('Se connecter'));
    _timings['demarrage_jusqu_a_la_connexion'] = launch.elapsedMilliseconds;

    // ---- 1. A wrong password is refused with the server's own sentence ----------------
    await _type(tester, 0, _email);
    await _type(tester, 1, 'mauvais-mot-de-passe-42');
    await _tap(tester, find.text('Se connecter'));
    await _waitFor(tester, find.textContaining('incorrect'));

    // ---- 2. Forgotten password: request a code, refuse a wrong one ---------------------
    await _tap(tester, find.text('Mot de passe oublié ?'));
    await _waitFor(tester, find.text('Recevoir le code'));
    await _tap(tester, find.text('Recevoir le code'));
    await _waitFor(tester, find.text('Code à 6 chiffres'));
    // Scoped to this screen: the sign-in form underneath has fields - and, from step 1, an
    // error banner - of its own, which an unscoped finder would happily pick.
    final forgot = find.byType(ForgotPasswordScreen);
    await tester.enterText(
        find.descendant(of: forgot, matching: find.byType(TextField)).first,
        '000000'); // auto-verifies at 6
    await _waitFor(tester, find.descendant(
        of: forgot, matching: find.byIcon(Icons.error_outline))); // the server's refusal
    expect(find.text('Vérifier le code'), findsOneWidget, reason: 'reste à l\'étape du code');
    await _back(tester);
    await _settle(tester);

    // ---- 3. Apply for an account, both steps, up to the pending screen ------------------
    await _tap(tester, find.text('Demander l\'ouverture d\'un compte'));
    await _waitFor(tester, find.text('Quelle est votre activité ?'));
    await _tap(tester, find.byIcon(Icons.storefront_outlined).first);
    await _waitFor(tester, find.text('Votre commerce'));
    final unique = DateTime.now().millisecondsSinceEpoch;
    await _typeLabeled(tester, 'Pâtisserie Al Manar', 'Commerce E2E $unique');
    await _typeLabeled(tester, 'Prénom et nom', 'Inscription Test');
    await _typeLabeled(tester, '06 12 34 56 78', '06${unique.toString().substring(5)}');
    await _choose(tester, 'Choisissez votre ville', 0);
    if (find.text('Choisissez votre quartier').evaluate().isNotEmpty) {
      await _choose(tester, 'Choisissez votre quartier', 0);
    }
    await _typeLabeled(tester, '12, rue Ibn Batouta', '3, rue du Test');
    await _typeLabeled(tester, 'vous@votre-commerce.ma', 'e2e.signup.$unique@marketfood.test');
    await _typeLabeled(tester, '10 caractères minimum', 'Inscription2026Test');
    await _tap(tester, find.text('Envoyer ma demande'));
    await _waitFor(tester, find.text('Demande envoyée'));
    await _tap(tester, find.text('Retour à la connexion'));
    await _waitFor(tester, find.text('Se connecter'));

    // ---- 4. Sign in for real ----------------------------------------------------------
    await _type(tester, 0, _email);
    await _type(tester, 1, _password);
    var watch = Stopwatch()..start();
    await _tap(tester, find.text('Se connecter'));
    await _waitFor(tester, find.byType(ProductCard));
    _timings['connexion_jusqu_au_catalogue'] = watch.elapsedMilliseconds;
    expect(find.textContaining('DH'), findsWidgets, reason: 'compte validé : prix affichés');

    // Frame statistics over everything a customer does after signing in, read from the
    // engine's own per-frame timings. Not binding.watchPerformance: that traces through the
    // Dart VM service, which an emulator cannot reach back to on the host - the run died on
    // "connection refused" after every screen had already passed.
    final frames = <FrameTiming>[];
    void collect(List<FrameTiming> t) => frames.addAll(t);
    SchedulerBinding.instance.addTimingsCallback(collect);
    {
      // ---- 5. Product, then the cart ------------------------------------------------
      watch = Stopwatch()..start();
      await _tap(tester, find.byType(ProductCard).first);
      await _waitFor(tester, find.textContaining('au panier'));
      _timings['ouverture_fiche_produit'] = watch.elapsedMilliseconds;

      watch = Stopwatch()..start();
      await _tap(tester, find.textContaining('au panier').last);
      // "ajouté au panier", or "N au panier" if an interrupted earlier run left it there.
      await _waitFor(tester, find.descendant(
          of: find.byType(SnackBar), matching: find.textContaining('au panier')));
      _timings['ajout_au_panier'] = watch.elapsedMilliseconds;

      // A review: stars and a comment, sent for moderation (tool/e2e.py removes it after).
      // The cart's snackbar sits at the bottom of the screen, exactly where the review button
      // lands once scrolled to; a customer would wait four seconds, the test dismisses it.
      tester.state<ScaffoldMessengerState>(find.byType(ScaffoldMessenger).first)
          .removeCurrentSnackBar();
      await _settle(tester, const Duration(milliseconds: 300));
      // The local test product belongs to baskets: they are offered on its page.
      await _scrollTo(tester, find.text('Disponible dans ces paniers'),
          within: find.byType(ListView).first);

      final reviewButton = find.byWidgetPredicate((w) =>
          w is Text &&
          (w.data == 'Donnez votre avis' || w.data == 'Soyez le premier à donner votre avis'));
      await _scrollTo(tester, reviewButton, within: find.byType(ListView).first);
      await _tap(tester, reviewButton);
      await _waitFor(tester, find.text('Publier mon avis'));
      await _tap(tester, find.byTooltip('4 étoiles'));
      await _settle(tester, const Duration(milliseconds: 300));
      expect(find.text('Très bien'), findsOneWidget, reason: 'chaque note dit ce qu\'elle veut dire');
      await _typeLabeled(tester, 'Qualité, emballage, livraison... ce qui aiderait un autre commerçant.',
          'Bon produit, livraison rapide.');
      await _tap(tester, find.text('Publier mon avis'));
      await _waitFor(tester, find.text('Merci ! Votre avis sera publié après modération.'));
      await _back(tester);
      await _settle(tester);

      await _tap(tester, find.byTooltip('Mon panier'));
      await _waitFor(tester, find.text('Commander'));
      // Measured until the server's new quantity is on screen - the round trip the customer
      // actually waits for, not a fixed pause.
      final before = find.descendant(
          of: find.byType(CartScreen), matching: find.byWidgetPredicate(
              (w) => w is Text && RegExp(r'^\d+$').hasMatch(w.data ?? '')));
      final quantity = int.parse((before.evaluate().first.widget as Text).data!);
      watch = Stopwatch()..start();
      // The cart's own stepper - the catalogue cards underneath have a "+" too.
      await _tap(tester,
          find.descendant(of: find.byType(CartScreen), matching: find.byIcon(Icons.add)).first);
      await _waitFor(tester, find.descendant(
          of: find.byType(CartScreen), matching: find.text('${quantity + 1}')));
      _timings['changement_quantite'] = watch.elapsedMilliseconds;

      // ---- 6. Order, with the address saved at registration ---------------------------
      await _tap(tester, find.text('Commander'));
      await _waitFor(tester, find.text('Confirmer la commande'));
      await _waitFor(tester, find.byIcon(Icons.radio_button_checked));

      // Promo code: a wrong one is explained and nothing is taken off; the test code (made
      // by tool/e2e.py on the local stack) is applied and shown in the totals.
      await _typeLabeled(tester, 'Votre code', 'NEXISTEPAS');
      await _tap(tester, find.text('Appliquer'));
      await _waitFor(tester, find.text('Code promo invalide.'));
      await _typeLabeled(tester, 'Votre code', 'E2EPROMO');
      await _tap(tester, find.text('Appliquer'));
      await _waitFor(tester, find.textContaining('Code E2EPROMO'));
      expect(find.text('Retirer'), findsOneWidget);

      watch = Stopwatch()..start();
      await _tap(tester, find.text('Confirmer la commande'));
      await _waitFor(tester, find.text('Commande enregistrée'));
      _timings['passage_de_commande'] = watch.elapsedMilliseconds;

      // ---- 7. Follow it ---------------------------------------------------------------
      // A cash-on-delivery order is created already confirmed (CheckoutService), and a
      // customer may only cancel a pending one - so the right outcome is a confirmed order
      // with no cancel button, not a cancellation.
      await _tap(tester, find.text('Suivre ma commande'));
      await _waitFor(tester, find.text('Confirmée'));
      await _scrollTo(tester, find.text('Paiement à la livraison'),
          within: find.byType(OrderDetailScreen));
      expect(find.widgetWithText(OutlinedButton, 'Annuler la commande'), findsNothing,
          reason: 'commande confirmée : plus annulable par le client');
      expect(find.textContaining('ajouté au panier'), findsNothing,
          reason: 'le message du panier ne doit pas suivre le client jusqu\'ici');
      expect(find.text('Code promo'), findsOneWidget,
          reason: 'la remise du code doit figurer sur la commande');

      // The invoice: the button is there, and what it downloads is a real PDF. Tapping it
      // would hand over to another app (a PDF reader or the share sheet), which a test
      // cannot come back from - so the download it runs is checked directly.
      await _scrollTo(tester, find.text('Facture PDF'), within: find.byType(OrderDetailScreen));
      final detail = tester.widget<OrderDetailScreen>(find.byType(OrderDetailScreen));
      final container = ProviderScope.containerOf(tester.element(find.byType(OrderDetailScreen)));
      final pdf = await container.read(orderRepositoryProvider).invoice(detail.orderId);
      expect(String.fromCharCodes(pdf.take(4)), '%PDF', reason: 'la facture doit être un PDF');

      // Order again: the same products go back in the cart, at today's prices.
      await _scrollTo(tester, find.text('Commander à nouveau'),
          within: find.byType(OrderDetailScreen));
      await _tap(tester, find.text('Commander à nouveau'));
      await _waitFor(tester, find.descendant(
          of: find.byType(SnackBar), matching: find.textContaining('au panier')));
      await _back(tester);
      await _settle(tester);

      // ---- 8. The other tabs ---------------------------------------------------------
      for (final (tab, expected) in [
        ('Offres', 'Offres paniers'),
        ('Commandes', 'Mes commandes'),
        ('Compte', 'Mon compte'),
      ]) {
        watch = Stopwatch()..start();
        await _tap(tester, find.text(tab).last);
        await _waitFor(tester, find.text(expected));
        _timings['onglet_${tab.toLowerCase()}'] = watch.elapsedMilliseconds;
        if (tab == 'Commandes') {
          // The counters over the whole history, above the list.
          await _waitFor(tester, find.text('Livrées'));
          expect(find.text('En cours'), findsOneWidget);
        }
      }

      // Android back from another tab returns to the catalogue instead of closing the app.
      await tester.binding.handlePopRoute();
      await _waitFor(tester, find.text('Rechercher un produit'));
      await _tap(tester, find.text('Compte').last);
      await _waitFor(tester, find.text('Mon compte'));
    }

    // ---- 8b. Password change reaches the server --------------------------------------
    // With a wrong current password, so the account keeps its password: the server's refusal
    // proves the customer's request got through and was checked.
    await _scrollTo(tester, find.text('Changer mon mot de passe'),
        within: find.byType(ListView).first);
    await _tap(tester, find.text('Changer mon mot de passe'));
    await _waitFor(tester, find.text('Enregistrer'));
    await _typeLabeled(tester, 'Votre mot de passe', 'pas-le-bon-mot-de-passe');
    await _typeLabeled(tester, '10 caractères minimum', 'NouveauMotDePasse2026');
    await _typeLabeled(tester, 'Ressaisissez-le', 'NouveauMotDePasse2026');
    await _tap(tester, find.text('Enregistrer'));
    await _waitFor(tester, find.text('Mot de passe actuel incorrect.'));
    await _back(tester);

    // ---- 8b''. My details: the sheet saves, and a bad new e-mail is refused locally -------
    // The pencil is on the profile card, at the top of the page: scroll back up to it.
    await tester.dragUntilVisible(
        find.byTooltip('Modifier le nom'), find.byType(ListView).first, const Offset(0, 400));
    await _settle(tester, const Duration(milliseconds: 400));
    await _tap(tester, find.byTooltip('Modifier le nom'));
    await _waitFor(tester, find.text('Mes informations'));
    await _tap(tester, find.text('Changer'));
    await _waitFor(tester, find.text('Recevoir le code'));
    await _typeLabeled(tester, 'vous@votre-commerce.ma', 'pas-une-adresse');
    await _tap(tester, find.text('Recevoir le code'));
    await _waitFor(tester, find.text('Saisissez une adresse e-mail valide.'));
    await _tap(tester, find.byType(BackButtonIcon));
    await _waitFor(tester, find.text('Mes informations'));
    await _tap(tester, find.text('Enregistrer'));
    await _waitFor(tester, find.text('Informations mises à jour.'));
    await _settle(tester);

    // ---- 8b'. Help: the FAQ answers, the contact page lists how to reach the shop -------
    await _scrollTo(tester, find.text('Questions fréquentes'), within: find.byType(ListView).first);
    await _tap(tester, find.text('Questions fréquentes'));
    await _waitFor(tester, find.text('Comment fonctionne le paiement à la livraison ?'));
    await _tap(tester, find.text('Comment fonctionne le paiement à la livraison ?'));
    await _waitFor(tester, find.textContaining('directement au livreur'));
    await _back(tester);
    await _tap(tester, find.text('Contact'));
    await _waitFor(tester, find.text('marketfood98@gmail.com'));
    expect(find.text('WhatsApp'), findsOneWidget);
    await _back(tester);

    // ---- 8c. Arabic --------------------------------------------------------------------
    // The app's own words come from the Arabic catalogue at once; the layout turns
    // right-to-left; product names arrive from the translation service a moment later.
    await _scrollTo(tester, find.text('العربية'), within: find.byType(ListView).first);
    await _tap(tester, find.text('العربية'));
    await _waitFor(tester, find.text('حسابي'));
    expect(Directionality.of(tester.element(find.text('حسابي'))), TextDirection.rtl);
    await _tap(tester, find.text('الكتالوج').last);
    await _waitFor(tester, find.text('ابحث عن منتج'));
    final arabicName = find.descendant(
        of: find.byType(ProductCard),
        matching: find.byWidgetPredicate(
            (w) => w is Text && RegExp(r'[؀-ۿ]').hasMatch(w.data ?? '')));
    await _waitFor(tester, arabicName, timeout: const Duration(seconds: 40));
    // Back to French for the rest of the run - and for the next one, since the choice is kept.
    await _tap(tester, find.text('الحساب').last);
    await _waitFor(tester, find.text('حسابي'));
    await _scrollTo(tester, find.text('Français'), within: find.byType(ListView).first);
    await _tap(tester, find.text('Français'));
    await _waitFor(tester, find.text('Mon compte'));
    await _scrollTo(tester, find.text('Se déconnecter'), within: find.byType(ListView).first);
    await _settle(tester, const Duration(seconds: 2)); // timings arrive in batches
    SchedulerBinding.instance.removeTimingsCallback(collect);

    // ---- 9. Sign out ------------------------------------------------------------------
    await _tap(tester, find.text('Se déconnecter'));
    await _waitFor(tester, find.text('Se connecter'));

    binding.reportData = {
      'etapes_ms': _timings,
      'images': _frameStats(frames),
    };
  }, timeout: const Timeout(Duration(minutes: 6)));
}

/// Pump until [finder] matches, or fail with a message naming what never appeared.
///
/// Not pumpAndSettle: a spinner animates forever, so "settled" never comes while a request
/// is in flight - which is exactly when the test needs to keep waiting.
Future<void> _waitFor(WidgetTester tester, Finder finder,
    {Duration timeout = const Duration(seconds: 25)}) async {
  final end = DateTime.now().add(timeout);
  while (DateTime.now().isBefore(end)) {
    await tester.pump(const Duration(milliseconds: 100));
    if (finder.evaluate().isNotEmpty) return;
  }
  // Say what WAS on screen. "X never appeared" alone sends you guessing; the error banner
  // the app showed instead is usually the whole answer.
  final shown = find
      .byType(Text)
      .evaluate()
      .map((e) => (e.widget as Text).data ?? (e.widget as Text).textSpan?.toPlainText())
      .whereType<String>()
      .where((s) => s.trim().isNotEmpty)
      .toSet()
      .join(' | ');
  throw TestFailure('Jamais affiché après ${timeout.inSeconds} s : $finder\n'
      'A l\'écran à ce moment : $shown');
}

/// Drag the list inside [within] until [target] has been built, a screenful at a time.
Future<void> _scrollTo(WidgetTester tester, Finder target, {required Finder within}) async {
  final list = find.descendant(of: within, matching: find.byType(Scrollable)).first;
  for (var i = 0; i < 8 && target.evaluate().isEmpty; i++) {
    await tester.drag(list, const Offset(0, -400), warnIfMissed: false);
    await _settle(tester, const Duration(milliseconds: 400));
  }
  if (target.evaluate().isEmpty) {
    await _waitFor(tester, target, timeout: const Duration(seconds: 1)); // fails with a dump
  }
}

/// Go back with the app bar's back arrow. Not tester.pageBack(): it looks for a button whose
/// tooltip is the English "Back", and this app speaks French - its tooltip reads "Retour".
Future<void> _back(WidgetTester tester) async {
  await tester.tap(find.byType(BackButton).last);
  await _settle(tester);
}

Future<void> _settle(WidgetTester tester, [Duration d = const Duration(milliseconds: 800)]) async {
  final end = DateTime.now().add(d);
  while (DateTime.now().isBefore(end)) {
    await tester.pump(const Duration(milliseconds: 100));
  }
}

Future<void> _tap(WidgetTester tester, Finder finder) async {
  await tester.ensureVisible(finder.first);
  await tester.pump(const Duration(milliseconds: 100));
  await tester.tap(finder.first);
  await tester.pump(const Duration(milliseconds: 100));
}

/// Type into the n-th text field on screen.
Future<void> _type(WidgetTester tester, int index, String text) async {
  final field = find.byType(TextField).at(index);
  await tester.ensureVisible(field);
  await tester.enterText(field, text);
  await tester.pump(const Duration(milliseconds: 50));
}

/// Type into the field whose hint reads [hint].
Future<void> _typeLabeled(WidgetTester tester, String hint, String text) async {
  final field = find.widgetWithText(TextField, hint);
  await tester.ensureVisible(field);
  await tester.enterText(field, text);
  await tester.pump(const Duration(milliseconds: 50));
}

/// Open the dropdown showing [placeholder] and pick its n-th item.
Future<void> _choose(WidgetTester tester, String placeholder, int index) async {
  // The field itself, not its hint text: the hint is painted behind the field's own tap area.
  await _tap(tester, find.ancestor(
      of: find.text(placeholder),
      matching: find.byWidgetPredicate((w) => w is DropdownButtonFormField)));
  await _settle(tester, const Duration(milliseconds: 600));
  final items = find.byWidgetPredicate((w) => w is DropdownMenuItem);
  await tester.tap(items.at(index), warnIfMissed: false);
  await _settle(tester, const Duration(milliseconds: 600));
}

/// Build and raster time per frame. A frame over 16.7 ms misses the 60 Hz screen refresh and
/// is what a customer sees as a stutter.
Map<String, Object> _frameStats(List<FrameTiming> frames) {
  if (frames.isEmpty) return {'images': 0};
  double ms(Duration d) => d.inMicroseconds / 1000;
  List<double> sorted(Iterable<double> v) => v.toList()..sort();
  final build = sorted(frames.map((f) => ms(f.buildDuration)));
  final raster = sorted(frames.map((f) => ms(f.rasterDuration)));
  double p90(List<double> v) => v[(v.length * 0.9).floor().clamp(0, v.length - 1)];
  double avg(List<double> v) => v.reduce((a, b) => a + b) / v.length;
  String f(double v) => v.toStringAsFixed(1);
  return {
    'images': frames.length,
    'construction_moyenne_ms': f(avg(build)),
    'construction_90e_percentile_ms': f(p90(build)),
    'construction_pire_ms': f(build.last),
    'rendu_moyen_ms': f(avg(raster)),
    'rendu_90e_percentile_ms': f(p90(raster)),
    'images_au_dela_de_16_7_ms': frames
        .where((fr) => ms(fr.buildDuration) > 16.7 || ms(fr.rasterDuration) > 16.7)
        .length,
  };
}
