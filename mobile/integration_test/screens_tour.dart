// A walk through the main screens that photographs each one, in French then in Arabic -
// for reviewing the design, not for testing behaviour. Run with tool/screens.py; the images
// land in build/screens/.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:market_food/core/api/token_store.dart';
import 'package:market_food/features/auth/ui/forgot_password_screen.dart';
import 'package:market_food/features/catalogue/ui/widgets/product_card.dart';
import 'package:market_food/main.dart' as app;

const _email = String.fromEnvironment('E2E_EMAIL');
const _password = String.fromEnvironment('E2E_PASSWORD');

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  binding.testTextInput.register();

  testWidgets('tour des écrans', (tester) async {
    await TokenStore().clear();
    await app.main();
    await binding.convertFlutterSurfaceToImage();

    Future<void> shot(String name) async {
      await _settle(tester, const Duration(milliseconds: 1500)); // images and fades
      await binding.takeScreenshot(name);
    }

    await _waitFor(tester, find.text('Se connecter'));
    await shot('01_connexion');

    await tester.tap(find.text("Demander l'ouverture d'un compte"));
    await _waitFor(tester, find.text('Quelle est votre activité ?'));
    await shot('01b_inscription_activite');
    await tester.tap(find.byIcon(Icons.storefront_outlined).first);
    await _waitFor(tester, find.text('Votre commerce'));
    await shot('01c_inscription_commerce');
    await tester.tap(find.byType(BackButton).first);
    await _waitFor(tester, find.text('Mot de passe oublié ?'));

    await tester.tap(find.text('Mot de passe oublié ?'));
    await _waitFor(tester, find.text('Recevoir le code'));
    final forgot = find.byType(ForgotPasswordScreen);
    Finder field() => find.descendant(of: forgot, matching: find.byType(TextField)).first;
    await tester.enterText(field(), _email);
    await tester.tap(find.text('Recevoir le code'));
    await _waitFor(tester, find.text('Vérifier le code'));
    await shot('01d_code_vide');
    await tester.enterText(field(), '482');
    await shot('01e_code_partiel');
    await tester.tap(find.byType(BackButton).last);
    await _waitFor(tester, find.text('Mot de passe oublié ?'));

    await tester.enterText(find.byType(TextField).at(0), _email);
    await tester.enterText(find.byType(TextField).at(1), _password);
    await tester.tap(find.text('Se connecter').last);
    await _waitFor(tester, find.byType(ProductCard));
    await shot('02_catalogue');

    await tester.tap(find.byType(ProductCard).first);
    await _waitFor(tester, find.textContaining('au panier'));
    await shot('03_produit');
    await tester.drag(find.byType(ListView).first, const Offset(0, -700));
    await shot('04_produit_bas');
    await tester.tap(find.byType(BackButton).last);
    await _settle(tester);

    await tester.tap(find.byTooltip('Mon panier'));
    await _waitFor(tester, find.text('Mon panier'));
    await shot('05_panier');
    await tester.tap(find.text('Commander').last);
    await _waitFor(tester, find.text('Confirmer la commande'));
    await shot('05b_commander');
    await tester.drag(find.byType(ListView).first, const Offset(0, -900));
    await shot('05c_commander_bas');
    await tester.tap(find.byType(BackButton).last);
    await _settle(tester);
    await tester.tap(find.byType(BackButton).last);
    await _settle(tester);

    for (final (tab, title, name) in [
      ('Offres', 'Offres paniers', '06_offres'),
      ('Commandes', 'Mes commandes', '07_commandes'),
      ('Compte', 'Mon compte', '08_compte'),
    ]) {
      await tester.tap(find.text(tab).last);
      await _waitFor(tester, find.text(title));
      await shot(name);
      if (tab == 'Compte') {
        await tester.tap(find.byTooltip('Modifier le nom'));
        await _waitFor(tester, find.text('Mes informations'));
        await shot('08b_mes_informations');
        await tester.tap(find.text('Changer'));
        await _waitFor(tester, find.text('Recevoir le code'));
        await shot('08c_nouvel_email');
        await tester.binding.handlePopRoute();
        await _settle(tester);
      }
      if (tab == 'Offres') {
        await tester.tap(find.byIcon(Icons.arrow_forward).first);
        await _waitFor(tester, find.text('Ajouter le panier'));
        await shot('06b_offre');
        await tester.tap(find.byType(BackButton).last);
        await _settle(tester);
      }
    }

    await tester.tap(find.text('Commandes').last);
    await _settle(tester);
    await tester.tap(find.textContaining('GM-').first);
    await _waitFor(tester, find.text('Ma commande'));
    await shot('09_commande');
    await tester.tap(find.byType(BackButton).last);
    await _settle(tester);

    // The same screens, in Arabic.
    await tester.tap(find.text('Compte').last);
    await _settle(tester);
    await tester.dragUntilVisible(
        find.text('العربية'), find.byType(ListView).first, const Offset(0, -300));
    await tester.tap(find.text('العربية'));
    await _waitFor(tester, find.text('حسابي'));
    await tester.tap(find.text('الكتالوج').last);
    await _settle(tester, const Duration(seconds: 4)); // product names being translated
    await shot('10_catalogue_ar');
    await tester.tap(find.byType(ProductCard).first);
    await _settle(tester, const Duration(seconds: 3));
    await shot('11_produit_ar');
    await tester.tap(find.byType(BackButton).last);
    await _settle(tester);
    await tester.tap(find.text('الحساب').last);
    await _settle(tester);
    await shot('12_compte_ar');

    // Back to French, and signed out, as found.
    await tester.dragUntilVisible(
        find.text('Français'), find.byType(ListView).first, const Offset(0, -300));
    await tester.tap(find.text('Français'));
    await _waitFor(tester, find.text('Mon compte'));
    await tester.dragUntilVisible(
        find.text('Se déconnecter'), find.byType(ListView).first, const Offset(0, -300));
    await tester.tap(find.text('Se déconnecter'));
    await _waitFor(tester, find.text('Se connecter'));
  }, timeout: const Timeout(Duration(minutes: 5)));
}

Future<void> _waitFor(WidgetTester tester, Finder finder) async {
  final end = DateTime.now().add(const Duration(seconds: 25));
  while (DateTime.now().isBefore(end)) {
    await tester.pump(const Duration(milliseconds: 100));
    if (finder.evaluate().isNotEmpty) return;
  }
  throw TestFailure('Jamais affiché : $finder');
}

Future<void> _settle(WidgetTester tester, [Duration d = const Duration(milliseconds: 800)]) async {
  final end = DateTime.now().add(d);
  while (DateTime.now().isBefore(end)) {
    await tester.pump(const Duration(milliseconds: 100));
  }
}
