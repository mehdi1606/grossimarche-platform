import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_ar.dart';
import 'app_localizations_fr.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('ar'),
    Locale('fr'),
  ];

  /// No description provided for @retry.
  ///
  /// In fr, this message translates to:
  /// **'Réessayer'**
  String get retry;

  /// No description provided for @cancel.
  ///
  /// In fr, this message translates to:
  /// **'Annuler'**
  String get cancel;

  /// No description provided for @save.
  ///
  /// In fr, this message translates to:
  /// **'Enregistrer'**
  String get save;

  /// No description provided for @see.
  ///
  /// In fr, this message translates to:
  /// **'Voir'**
  String get see;

  /// No description provided for @add.
  ///
  /// In fr, this message translates to:
  /// **'Ajouter'**
  String get add;

  /// No description provided for @delete.
  ///
  /// In fr, this message translates to:
  /// **'Supprimer'**
  String get delete;

  /// No description provided for @change.
  ///
  /// In fr, this message translates to:
  /// **'Changer'**
  String get change;

  /// No description provided for @keep.
  ///
  /// In fr, this message translates to:
  /// **'Garder'**
  String get keep;

  /// No description provided for @total.
  ///
  /// In fr, this message translates to:
  /// **'Total'**
  String get total;

  /// No description provided for @subtotal.
  ///
  /// In fr, this message translates to:
  /// **'Sous-total'**
  String get subtotal;

  /// No description provided for @bundleDiscount.
  ///
  /// In fr, this message translates to:
  /// **'Remise paniers'**
  String get bundleDiscount;

  /// No description provided for @delivery.
  ///
  /// In fr, this message translates to:
  /// **'Livraison'**
  String get delivery;

  /// No description provided for @cashOnDelivery.
  ///
  /// In fr, this message translates to:
  /// **'Paiement à la livraison'**
  String get cashOnDelivery;

  /// No description provided for @couponDiscount.
  ///
  /// In fr, this message translates to:
  /// **'Code promo'**
  String get couponDiscount;

  /// No description provided for @showPassword.
  ///
  /// In fr, this message translates to:
  /// **'Afficher'**
  String get showPassword;

  /// No description provided for @hidePassword.
  ///
  /// In fr, this message translates to:
  /// **'Masquer'**
  String get hidePassword;

  /// No description provided for @language.
  ///
  /// In fr, this message translates to:
  /// **'Langue'**
  String get language;

  /// No description provided for @languageFrench.
  ///
  /// In fr, this message translates to:
  /// **'Français'**
  String get languageFrench;

  /// No description provided for @languageArabic.
  ///
  /// In fr, this message translates to:
  /// **'العربية'**
  String get languageArabic;

  /// No description provided for @loginTitle.
  ///
  /// In fr, this message translates to:
  /// **'Connexion'**
  String get loginTitle;

  /// No description provided for @loginSubtitle.
  ///
  /// In fr, this message translates to:
  /// **'Accédez à vos tarifs professionnels.'**
  String get loginSubtitle;

  /// No description provided for @emailLabel.
  ///
  /// In fr, this message translates to:
  /// **'Adresse e-mail'**
  String get emailLabel;

  /// No description provided for @passwordLabel.
  ///
  /// In fr, this message translates to:
  /// **'Mot de passe'**
  String get passwordLabel;

  /// No description provided for @passwordHint.
  ///
  /// In fr, this message translates to:
  /// **'Votre mot de passe'**
  String get passwordHint;

  /// No description provided for @forgotPasswordLink.
  ///
  /// In fr, this message translates to:
  /// **'Mot de passe oublié ?'**
  String get forgotPasswordLink;

  /// No description provided for @signIn.
  ///
  /// In fr, this message translates to:
  /// **'Se connecter'**
  String get signIn;

  /// No description provided for @noAccountYet.
  ///
  /// In fr, this message translates to:
  /// **'Pas encore de compte professionnel ?'**
  String get noAccountYet;

  /// No description provided for @requestAccount.
  ///
  /// In fr, this message translates to:
  /// **'Demander l\'ouverture d\'un compte'**
  String get requestAccount;

  /// No description provided for @errEmailInvalid.
  ///
  /// In fr, this message translates to:
  /// **'Saisissez une adresse e-mail valide.'**
  String get errEmailInvalid;

  /// No description provided for @errPasswordMissing.
  ///
  /// In fr, this message translates to:
  /// **'Saisissez votre mot de passe.'**
  String get errPasswordMissing;

  /// No description provided for @signupTradeTitle.
  ///
  /// In fr, this message translates to:
  /// **'Quelle est votre activité ?'**
  String get signupTradeTitle;

  /// No description provided for @stepOf.
  ///
  /// In fr, this message translates to:
  /// **'Étape {step} sur {total}'**
  String stepOf(Object step, Object total);

  /// No description provided for @signupTradeSubtitle.
  ///
  /// In fr, this message translates to:
  /// **'Nos tarifs de gros dépendent de votre métier. Choisissez le vôtre pour continuer.'**
  String get signupTradeSubtitle;

  /// No description provided for @signupNoTrades.
  ///
  /// In fr, this message translates to:
  /// **'Aucune activité n\'est proposée pour le moment. Contactez-nous et nous ouvrirons votre compte manuellement.'**
  String get signupNoTrades;

  /// No description provided for @signupBusinessTitle.
  ///
  /// In fr, this message translates to:
  /// **'Votre commerce'**
  String get signupBusinessTitle;

  /// No description provided for @signupBusinessSubtitle.
  ///
  /// In fr, this message translates to:
  /// **'Votre demande est validée par notre équipe, puis vous recevez un e-mail pour vous connecter.'**
  String get signupBusinessSubtitle;

  /// No description provided for @signupYourTrade.
  ///
  /// In fr, this message translates to:
  /// **'Votre activité : {trade}'**
  String signupYourTrade(Object trade);

  /// No description provided for @businessNameLabel.
  ///
  /// In fr, this message translates to:
  /// **'Nom du commerce'**
  String get businessNameLabel;

  /// No description provided for @yourNameLabel.
  ///
  /// In fr, this message translates to:
  /// **'Votre nom'**
  String get yourNameLabel;

  /// No description provided for @yourNameHint.
  ///
  /// In fr, this message translates to:
  /// **'Prénom et nom'**
  String get yourNameHint;

  /// No description provided for @phoneLabel.
  ///
  /// In fr, this message translates to:
  /// **'Téléphone'**
  String get phoneLabel;

  /// No description provided for @deliveryAddressSection.
  ///
  /// In fr, this message translates to:
  /// **'Adresse de livraison'**
  String get deliveryAddressSection;

  /// No description provided for @citiesLoadError.
  ///
  /// In fr, this message translates to:
  /// **'Impossible de charger les villes de livraison.'**
  String get citiesLoadError;

  /// No description provided for @cityLabel.
  ///
  /// In fr, this message translates to:
  /// **'Ville'**
  String get cityLabel;

  /// No description provided for @cityHint.
  ///
  /// In fr, this message translates to:
  /// **'Choisissez votre ville'**
  String get cityHint;

  /// No description provided for @districtLabel.
  ///
  /// In fr, this message translates to:
  /// **'Quartier'**
  String get districtLabel;

  /// No description provided for @districtHintPickCity.
  ///
  /// In fr, this message translates to:
  /// **'Choisissez d\'abord la ville'**
  String get districtHintPickCity;

  /// No description provided for @districtNone.
  ///
  /// In fr, this message translates to:
  /// **'Aucun quartier à préciser'**
  String get districtNone;

  /// No description provided for @districtHint.
  ///
  /// In fr, this message translates to:
  /// **'Choisissez votre quartier'**
  String get districtHint;

  /// No description provided for @streetLabel.
  ///
  /// In fr, this message translates to:
  /// **'Rue et numéro'**
  String get streetLabel;

  /// No description provided for @streetHelp.
  ///
  /// In fr, this message translates to:
  /// **'Saisie une seule fois : elle sera reprise à chaque commande.'**
  String get streetHelp;

  /// No description provided for @passwordCreateHelp.
  ///
  /// In fr, this message translates to:
  /// **'Au moins {min} caractères. C\'est vous qui le choisissez.'**
  String passwordCreateHelp(Object min);

  /// No description provided for @passwordMinHint.
  ///
  /// In fr, this message translates to:
  /// **'{min} caractères minimum'**
  String passwordMinHint(Object min);

  /// No description provided for @sendRequest.
  ///
  /// In fr, this message translates to:
  /// **'Envoyer ma demande'**
  String get sendRequest;

  /// No description provided for @haveAccount.
  ///
  /// In fr, this message translates to:
  /// **'Vous avez déjà un compte ? Se connecter'**
  String get haveAccount;

  /// No description provided for @errBusinessName.
  ///
  /// In fr, this message translates to:
  /// **'Indiquez le nom de votre commerce.'**
  String get errBusinessName;

  /// No description provided for @errYourName.
  ///
  /// In fr, this message translates to:
  /// **'Indiquez votre nom.'**
  String get errYourName;

  /// No description provided for @errPhone.
  ///
  /// In fr, this message translates to:
  /// **'Indiquez un numéro de téléphone valide.'**
  String get errPhone;

  /// No description provided for @errDeliveryCity.
  ///
  /// In fr, this message translates to:
  /// **'Choisissez votre ville de livraison.'**
  String get errDeliveryCity;

  /// No description provided for @errDistrict.
  ///
  /// In fr, this message translates to:
  /// **'Choisissez votre quartier.'**
  String get errDistrict;

  /// No description provided for @errStreet.
  ///
  /// In fr, this message translates to:
  /// **'Indiquez la rue et le numéro.'**
  String get errStreet;

  /// No description provided for @errPasswordShort.
  ///
  /// In fr, this message translates to:
  /// **'Le mot de passe doit contenir au moins {min} caractères.'**
  String errPasswordShort(Object min);

  /// No description provided for @pendingTitle.
  ///
  /// In fr, this message translates to:
  /// **'Demande envoyée'**
  String get pendingTitle;

  /// No description provided for @pendingThanks.
  ///
  /// In fr, this message translates to:
  /// **'Merci. Votre compte est créé et attend la validation de notre équipe.'**
  String get pendingThanks;

  /// No description provided for @pendingDetail.
  ///
  /// In fr, this message translates to:
  /// **'Nous vérifions votre commerce, généralement sous 24 à 48 heures ouvrables. Vous recevrez un e-mail dès que votre compte sera actif ; vos tarifs apparaîtront alors automatiquement.'**
  String get pendingDetail;

  /// No description provided for @backToLogin.
  ///
  /// In fr, this message translates to:
  /// **'Retour à la connexion'**
  String get backToLogin;

  /// No description provided for @forgotTitle.
  ///
  /// In fr, this message translates to:
  /// **'Mot de passe oublié'**
  String get forgotTitle;

  /// No description provided for @forgotEmailLabel.
  ///
  /// In fr, this message translates to:
  /// **'Adresse e-mail du compte'**
  String get forgotEmailLabel;

  /// No description provided for @forgotEmailHelp.
  ///
  /// In fr, this message translates to:
  /// **'Nous vous enverrons un code à 6 chiffres, valable 15 minutes.'**
  String get forgotEmailHelp;

  /// No description provided for @receiveCode.
  ///
  /// In fr, this message translates to:
  /// **'Recevoir le code'**
  String get receiveCode;

  /// No description provided for @codeSentTo.
  ///
  /// In fr, this message translates to:
  /// **'Code envoyé à {email}. Pensez à vérifier vos spams.'**
  String codeSentTo(Object email);

  /// No description provided for @codeLabel.
  ///
  /// In fr, this message translates to:
  /// **'Code à 6 chiffres'**
  String get codeLabel;

  /// No description provided for @verifyCode.
  ///
  /// In fr, this message translates to:
  /// **'Vérifier le code'**
  String get verifyCode;

  /// No description provided for @changeEmail.
  ///
  /// In fr, this message translates to:
  /// **'Changer d\'adresse'**
  String get changeEmail;

  /// No description provided for @resendCode.
  ///
  /// In fr, this message translates to:
  /// **'Renvoyer le code'**
  String get resendCode;

  /// No description provided for @codeResent.
  ///
  /// In fr, this message translates to:
  /// **'Un nouveau code a été envoyé.'**
  String get codeResent;

  /// No description provided for @codeVerified.
  ///
  /// In fr, this message translates to:
  /// **'Code vérifié. Choisissez votre nouveau mot de passe.'**
  String get codeVerified;

  /// No description provided for @newPasswordLabel.
  ///
  /// In fr, this message translates to:
  /// **'Nouveau mot de passe'**
  String get newPasswordLabel;

  /// No description provided for @passwordMinHelp.
  ///
  /// In fr, this message translates to:
  /// **'Au moins {min} caractères.'**
  String passwordMinHelp(Object min);

  /// No description provided for @confirmPasswordLabel.
  ///
  /// In fr, this message translates to:
  /// **'Confirmer le mot de passe'**
  String get confirmPasswordLabel;

  /// No description provided for @confirmPasswordHint.
  ///
  /// In fr, this message translates to:
  /// **'Ressaisissez-le'**
  String get confirmPasswordHint;

  /// No description provided for @sessionsWillClose.
  ///
  /// In fr, this message translates to:
  /// **'Toutes vos sessions ouvertes seront fermées : vous devrez vous reconnecter, ici et sur vos autres appareils.'**
  String get sessionsWillClose;

  /// No description provided for @savePassword.
  ///
  /// In fr, this message translates to:
  /// **'Enregistrer le mot de passe'**
  String get savePassword;

  /// No description provided for @passwordUpdatedSignIn.
  ///
  /// In fr, this message translates to:
  /// **'Mot de passe mis à jour. Connectez-vous.'**
  String get passwordUpdatedSignIn;

  /// No description provided for @errEmailMissing.
  ///
  /// In fr, this message translates to:
  /// **'Saisissez votre adresse e-mail.'**
  String get errEmailMissing;

  /// No description provided for @errCodeMissing.
  ///
  /// In fr, this message translates to:
  /// **'Saisissez le code reçu par e-mail.'**
  String get errCodeMissing;

  /// No description provided for @errPasswordsDiffer.
  ///
  /// In fr, this message translates to:
  /// **'Les deux mots de passe ne correspondent pas.'**
  String get errPasswordsDiffer;

  /// No description provided for @stepEmail.
  ///
  /// In fr, this message translates to:
  /// **'Votre e-mail'**
  String get stepEmail;

  /// No description provided for @stepCode.
  ///
  /// In fr, this message translates to:
  /// **'Le code reçu'**
  String get stepCode;

  /// No description provided for @stepNewPassword.
  ///
  /// In fr, this message translates to:
  /// **'Nouveau mot de passe'**
  String get stepNewPassword;

  /// No description provided for @tabCatalogue.
  ///
  /// In fr, this message translates to:
  /// **'Catalogue'**
  String get tabCatalogue;

  /// No description provided for @tabOffers.
  ///
  /// In fr, this message translates to:
  /// **'Offres'**
  String get tabOffers;

  /// No description provided for @tabOrders.
  ///
  /// In fr, this message translates to:
  /// **'Commandes'**
  String get tabOrders;

  /// No description provided for @tabAccount.
  ///
  /// In fr, this message translates to:
  /// **'Compte'**
  String get tabAccount;

  /// No description provided for @searchHint.
  ///
  /// In fr, this message translates to:
  /// **'Rechercher un produit'**
  String get searchHint;

  /// No description provided for @cartTooltip.
  ///
  /// In fr, this message translates to:
  /// **'Mon panier'**
  String get cartTooltip;

  /// No description provided for @catalogueUnavailable.
  ///
  /// In fr, this message translates to:
  /// **'Catalogue indisponible'**
  String get catalogueUnavailable;

  /// No description provided for @noProducts.
  ///
  /// In fr, this message translates to:
  /// **'Aucun produit'**
  String get noProducts;

  /// No description provided for @noProductsFiltered.
  ///
  /// In fr, this message translates to:
  /// **'Essayez une autre recherche ou une autre catégorie.'**
  String get noProductsFiltered;

  /// No description provided for @catalogueEmpty.
  ///
  /// In fr, this message translates to:
  /// **'Le catalogue est vide pour le moment.'**
  String get catalogueEmpty;

  /// No description provided for @showAll.
  ///
  /// In fr, this message translates to:
  /// **'Tout afficher'**
  String get showAll;

  /// No description provided for @allCategories.
  ///
  /// In fr, this message translates to:
  /// **'Tout'**
  String get allCategories;

  /// No description provided for @pendingApprovalBanner.
  ///
  /// In fr, this message translates to:
  /// **'Votre compte attend sa validation par Market Food. Vous pouvez parcourir le catalogue ; les prix de votre activité apparaîtront une fois le compte validé.'**
  String get pendingApprovalBanner;

  /// No description provided for @badgeOutOfStock.
  ///
  /// In fr, this message translates to:
  /// **'Rupture'**
  String get badgeOutOfStock;

  /// No description provided for @badgeTiered.
  ///
  /// In fr, this message translates to:
  /// **'Dégressif'**
  String get badgeTiered;

  /// No description provided for @fromQuantity.
  ///
  /// In fr, this message translates to:
  /// **'À partir de {quantity} {unit}'**
  String fromQuantity(Object quantity, Object unit);

  /// No description provided for @priceOnApproval.
  ///
  /// In fr, this message translates to:
  /// **'Prix sur validation du compte'**
  String get priceOnApproval;

  /// No description provided for @productTitle.
  ///
  /// In fr, this message translates to:
  /// **'Produit'**
  String get productTitle;

  /// No description provided for @description.
  ///
  /// In fr, this message translates to:
  /// **'Description'**
  String get description;

  /// No description provided for @addToCart.
  ///
  /// In fr, this message translates to:
  /// **'Ajouter au panier'**
  String get addToCart;

  /// No description provided for @addQuantityToCart.
  ///
  /// In fr, this message translates to:
  /// **'Ajouter {quantity} {unit} au panier'**
  String addQuantityToCart(Object quantity, Object unit);

  /// No description provided for @orderAfterApproval.
  ///
  /// In fr, this message translates to:
  /// **'Commande possible après validation'**
  String get orderAfterApproval;

  /// No description provided for @outOfStock.
  ///
  /// In fr, this message translates to:
  /// **'Rupture de stock'**
  String get outOfStock;

  /// No description provided for @inStock.
  ///
  /// In fr, this message translates to:
  /// **'En stock · {quantity} {unit}'**
  String inStock(Object quantity, Object unit);

  /// No description provided for @minimumQuantity.
  ///
  /// In fr, this message translates to:
  /// **'minimum {quantity} {unit}'**
  String minimumQuantity(Object quantity, Object unit);

  /// No description provided for @tiersTitle.
  ///
  /// In fr, this message translates to:
  /// **'Plus vous achetez, moins cher'**
  String get tiersTitle;

  /// No description provided for @addedToCart.
  ///
  /// In fr, this message translates to:
  /// **'{name} ajouté au panier'**
  String addedToCart(Object name);

  /// No description provided for @quantityInCart.
  ///
  /// In fr, this message translates to:
  /// **'{name} : {quantity} au panier'**
  String quantityInCart(Object name, Object quantity);

  /// No description provided for @reviewsTitle.
  ///
  /// In fr, this message translates to:
  /// **'Avis clients'**
  String get reviewsTitle;

  /// No description provided for @reviewsCount.
  ///
  /// In fr, this message translates to:
  /// **'{count, plural, =0{Aucun avis} =1{1 avis} other{{count} avis}}'**
  String reviewsCount(int count);

  /// No description provided for @noRatingYet.
  ///
  /// In fr, this message translates to:
  /// **'Aucune note pour le moment'**
  String get noRatingYet;

  /// No description provided for @reviewWrite.
  ///
  /// In fr, this message translates to:
  /// **'Donnez votre avis'**
  String get reviewWrite;

  /// No description provided for @reviewFirst.
  ///
  /// In fr, this message translates to:
  /// **'Soyez le premier à donner votre avis'**
  String get reviewFirst;

  /// No description provided for @reviewInvite.
  ///
  /// In fr, this message translates to:
  /// **'Vous avez acheté ce produit ? Votre avis aide les autres commerçants.'**
  String get reviewInvite;

  /// No description provided for @reviewPlaceholder.
  ///
  /// In fr, this message translates to:
  /// **'Qualité, emballage, livraison... ce qui aiderait un autre commerçant.'**
  String get reviewPlaceholder;

  /// No description provided for @reviewPublish.
  ///
  /// In fr, this message translates to:
  /// **'Publier mon avis'**
  String get reviewPublish;

  /// No description provided for @reviewThanks.
  ///
  /// In fr, this message translates to:
  /// **'Merci ! Votre avis sera publié après modération.'**
  String get reviewThanks;

  /// No description provided for @reviewYourRating.
  ///
  /// In fr, this message translates to:
  /// **'Votre note'**
  String get reviewYourRating;

  /// No description provided for @reviewAnonymous.
  ///
  /// In fr, this message translates to:
  /// **'Client'**
  String get reviewAnonymous;

  /// No description provided for @reviewsSeeAll.
  ///
  /// In fr, this message translates to:
  /// **'Voir tous les avis'**
  String get reviewsSeeAll;

  /// No description provided for @rating1.
  ///
  /// In fr, this message translates to:
  /// **'Décevant'**
  String get rating1;

  /// No description provided for @rating2.
  ///
  /// In fr, this message translates to:
  /// **'Moyen'**
  String get rating2;

  /// No description provided for @rating3.
  ///
  /// In fr, this message translates to:
  /// **'Correct'**
  String get rating3;

  /// No description provided for @rating4.
  ///
  /// In fr, this message translates to:
  /// **'Très bien'**
  String get rating4;

  /// No description provided for @rating5.
  ///
  /// In fr, this message translates to:
  /// **'Excellent'**
  String get rating5;

  /// No description provided for @ratingStars.
  ///
  /// In fr, this message translates to:
  /// **'{count, plural, =1{1 étoile} other{{count} étoiles}}'**
  String ratingStars(int count);

  /// No description provided for @cartTitle.
  ///
  /// In fr, this message translates to:
  /// **'Mon panier'**
  String get cartTitle;

  /// No description provided for @cartUnavailable.
  ///
  /// In fr, this message translates to:
  /// **'Panier indisponible'**
  String get cartUnavailable;

  /// No description provided for @cartEmptyTitle.
  ///
  /// In fr, this message translates to:
  /// **'Votre panier est vide'**
  String get cartEmptyTitle;

  /// No description provided for @cartEmptyDetail.
  ///
  /// In fr, this message translates to:
  /// **'Parcourez le catalogue et ajoutez vos produits.'**
  String get cartEmptyDetail;

  /// No description provided for @stockShort.
  ///
  /// In fr, this message translates to:
  /// **'Stock insuffisant : {quantity} {unit} disponibles.'**
  String stockShort(Object quantity, Object unit);

  /// No description provided for @priceChanged.
  ///
  /// In fr, this message translates to:
  /// **'Le prix de ce produit a changé depuis son ajout.'**
  String get priceChanged;

  /// No description provided for @deliveryAtCheckout.
  ///
  /// In fr, this message translates to:
  /// **'Calculée à la commande'**
  String get deliveryAtCheckout;

  /// No description provided for @fixStockIssues.
  ///
  /// In fr, this message translates to:
  /// **'Ajustez les quantités en rupture'**
  String get fixStockIssues;

  /// No description provided for @checkout.
  ///
  /// In fr, this message translates to:
  /// **'Commander'**
  String get checkout;

  /// No description provided for @checkoutTitle.
  ///
  /// In fr, this message translates to:
  /// **'Commander'**
  String get checkoutTitle;

  /// No description provided for @deliveryAddressTitle.
  ///
  /// In fr, this message translates to:
  /// **'Adresse de livraison'**
  String get deliveryAddressTitle;

  /// No description provided for @addAddress.
  ///
  /// In fr, this message translates to:
  /// **'Ajouter une adresse'**
  String get addAddress;

  /// No description provided for @paymentTitle.
  ///
  /// In fr, this message translates to:
  /// **'Paiement'**
  String get paymentTitle;

  /// No description provided for @driverNoteTitle.
  ///
  /// In fr, this message translates to:
  /// **'Note pour le livreur'**
  String get driverNoteTitle;

  /// No description provided for @driverNoteHint.
  ///
  /// In fr, this message translates to:
  /// **'Horaire de passage, repère, étage…'**
  String get driverNoteHint;

  /// No description provided for @couponTitle.
  ///
  /// In fr, this message translates to:
  /// **'Code promo'**
  String get couponTitle;

  /// No description provided for @couponHint.
  ///
  /// In fr, this message translates to:
  /// **'Votre code'**
  String get couponHint;

  /// No description provided for @couponApply.
  ///
  /// In fr, this message translates to:
  /// **'Appliquer'**
  String get couponApply;

  /// No description provided for @couponRemove.
  ///
  /// In fr, this message translates to:
  /// **'Retirer'**
  String get couponRemove;

  /// No description provided for @couponEmpty.
  ///
  /// In fr, this message translates to:
  /// **'Saisissez un code promo.'**
  String get couponEmpty;

  /// No description provided for @couponInvalid.
  ///
  /// In fr, this message translates to:
  /// **'Code promo invalide.'**
  String get couponInvalid;

  /// No description provided for @couponLine.
  ///
  /// In fr, this message translates to:
  /// **'Code {code}'**
  String couponLine(Object code);

  /// No description provided for @deliveryByCity.
  ///
  /// In fr, this message translates to:
  /// **'Selon la ville choisie'**
  String get deliveryByCity;

  /// No description provided for @confirmOrder.
  ///
  /// In fr, this message translates to:
  /// **'Confirmer la commande'**
  String get confirmOrder;

  /// No description provided for @errChooseAddress.
  ///
  /// In fr, this message translates to:
  /// **'Choisissez une adresse de livraison.'**
  String get errChooseAddress;

  /// No description provided for @noAddressTitle.
  ///
  /// In fr, this message translates to:
  /// **'Aucune adresse enregistrée'**
  String get noAddressTitle;

  /// No description provided for @noAddressDetail.
  ///
  /// In fr, this message translates to:
  /// **'Nous devons savoir où livrer votre commande.'**
  String get noAddressDetail;

  /// No description provided for @orderPlacedTitle.
  ///
  /// In fr, this message translates to:
  /// **'Commande enregistrée'**
  String get orderPlacedTitle;

  /// No description provided for @orderPlacedDetail.
  ///
  /// In fr, this message translates to:
  /// **'Notre équipe la prépare. Vous serez prévenu à chaque étape.'**
  String get orderPlacedDetail;

  /// No description provided for @orderNumber.
  ///
  /// In fr, this message translates to:
  /// **'Numéro de commande'**
  String get orderNumber;

  /// No description provided for @totalOnDelivery.
  ///
  /// In fr, this message translates to:
  /// **'Total à payer à la livraison'**
  String get totalOnDelivery;

  /// No description provided for @trackOrder.
  ///
  /// In fr, this message translates to:
  /// **'Suivre ma commande'**
  String get trackOrder;

  /// No description provided for @backToCatalogue.
  ///
  /// In fr, this message translates to:
  /// **'Retour au catalogue'**
  String get backToCatalogue;

  /// No description provided for @ordersTitle.
  ///
  /// In fr, this message translates to:
  /// **'Mes commandes'**
  String get ordersTitle;

  /// No description provided for @noOrders.
  ///
  /// In fr, this message translates to:
  /// **'Aucune commande pour le moment'**
  String get noOrders;

  /// No description provided for @orderTitle.
  ///
  /// In fr, this message translates to:
  /// **'Ma commande'**
  String get orderTitle;

  /// No description provided for @cancelOrderQuestion.
  ///
  /// In fr, this message translates to:
  /// **'Annuler la commande ?'**
  String get cancelOrderQuestion;

  /// No description provided for @cancelOrderDetail.
  ///
  /// In fr, this message translates to:
  /// **'Elle ne sera ni préparée ni livrée.'**
  String get cancelOrderDetail;

  /// No description provided for @cancelOrder.
  ///
  /// In fr, this message translates to:
  /// **'Annuler la commande'**
  String get cancelOrder;

  /// No description provided for @placedOn.
  ///
  /// In fr, this message translates to:
  /// **'Passée le {date}'**
  String placedOn(Object date);

  /// No description provided for @items.
  ///
  /// In fr, this message translates to:
  /// **'Articles'**
  String get items;

  /// No description provided for @free.
  ///
  /// In fr, this message translates to:
  /// **'Offerte'**
  String get free;

  /// No description provided for @noteLabel.
  ///
  /// In fr, this message translates to:
  /// **'Note : {note}'**
  String noteLabel(Object note);

  /// No description provided for @cancelPossible.
  ///
  /// In fr, this message translates to:
  /// **'Possible tant que Market Food ne l\'a pas validée.'**
  String get cancelPossible;

  /// No description provided for @orderCancelled.
  ///
  /// In fr, this message translates to:
  /// **'Cette commande a été annulée.'**
  String get orderCancelled;

  /// No description provided for @orderCancelledOn.
  ///
  /// In fr, this message translates to:
  /// **'Annulée le {date}.'**
  String orderCancelledOn(Object date);

  /// No description provided for @invoicePdf.
  ///
  /// In fr, this message translates to:
  /// **'Facture PDF'**
  String get invoicePdf;

  /// No description provided for @invoiceShare.
  ///
  /// In fr, this message translates to:
  /// **'Partager la facture'**
  String get invoiceShare;

  /// No description provided for @invoiceSubject.
  ///
  /// In fr, this message translates to:
  /// **'Facture {number}'**
  String invoiceSubject(Object number);

  /// No description provided for @invoiceSaveError.
  ///
  /// In fr, this message translates to:
  /// **'La facture n\'a pas pu être enregistrée sur le téléphone.'**
  String get invoiceSaveError;

  /// No description provided for @statusPending.
  ///
  /// In fr, this message translates to:
  /// **'En attente de validation'**
  String get statusPending;

  /// No description provided for @statusConfirmed.
  ///
  /// In fr, this message translates to:
  /// **'Confirmée'**
  String get statusConfirmed;

  /// No description provided for @statusPreparing.
  ///
  /// In fr, this message translates to:
  /// **'En préparation'**
  String get statusPreparing;

  /// No description provided for @statusOutForDelivery.
  ///
  /// In fr, this message translates to:
  /// **'En cours de livraison'**
  String get statusOutForDelivery;

  /// No description provided for @statusDelivered.
  ///
  /// In fr, this message translates to:
  /// **'Livrée'**
  String get statusDelivered;

  /// No description provided for @statusCancelled.
  ///
  /// In fr, this message translates to:
  /// **'Annulée'**
  String get statusCancelled;

  /// No description provided for @offersTitle.
  ///
  /// In fr, this message translates to:
  /// **'Offres paniers'**
  String get offersTitle;

  /// No description provided for @noOffersApproved.
  ///
  /// In fr, this message translates to:
  /// **'Aucune offre pour votre activité en ce moment'**
  String get noOffersApproved;

  /// No description provided for @noOffersPending.
  ///
  /// In fr, this message translates to:
  /// **'Les offres apparaîtront une fois votre compte validé'**
  String get noOffersPending;

  /// No description provided for @noOffersApprovedDetail.
  ///
  /// In fr, this message translates to:
  /// **'Vous serez prévenu dès qu\'un nouveau panier sort.'**
  String get noOffersApprovedDetail;

  /// No description provided for @noOffersPendingDetail.
  ///
  /// In fr, this message translates to:
  /// **'Chaque offre est tarifée pour un type d\'activité.'**
  String get noOffersPendingDetail;

  /// No description provided for @productCount.
  ///
  /// In fr, this message translates to:
  /// **'{count, plural, =1{1 produit} other{{count} produits}}'**
  String productCount(int count);

  /// No description provided for @unavailable.
  ///
  /// In fr, this message translates to:
  /// **'Indisponible'**
  String get unavailable;

  /// No description provided for @offerTitle.
  ///
  /// In fr, this message translates to:
  /// **'Offre panier'**
  String get offerTitle;

  /// No description provided for @offerAdded.
  ///
  /// In fr, this message translates to:
  /// **'Panier ajouté : la remise s\'applique automatiquement.'**
  String get offerAdded;

  /// No description provided for @offerUntil.
  ///
  /// In fr, this message translates to:
  /// **'Jusqu\'au {date}'**
  String offerUntil(Object date);

  /// No description provided for @offerContents.
  ///
  /// In fr, this message translates to:
  /// **'Ce que contient le panier'**
  String get offerContents;

  /// No description provided for @itemOutOfStock.
  ///
  /// In fr, this message translates to:
  /// **'En rupture'**
  String get itemOutOfStock;

  /// No description provided for @boughtSeparately.
  ///
  /// In fr, this message translates to:
  /// **'Achetés séparément'**
  String get boughtSeparately;

  /// No description provided for @offerPrice.
  ///
  /// In fr, this message translates to:
  /// **'Prix du panier'**
  String get offerPrice;

  /// No description provided for @youSave.
  ///
  /// In fr, this message translates to:
  /// **'Vous économisez {amount}'**
  String youSave(Object amount);

  /// No description provided for @offerOtherTrade.
  ///
  /// In fr, this message translates to:
  /// **'Offre réservée à une autre activité'**
  String get offerOtherTrade;

  /// No description provided for @offerAdd.
  ///
  /// In fr, this message translates to:
  /// **'Ajouter le panier'**
  String get offerAdd;

  /// No description provided for @offerUnavailable.
  ///
  /// In fr, this message translates to:
  /// **'Panier indisponible'**
  String get offerUnavailable;

  /// No description provided for @offerAutoDiscount.
  ///
  /// In fr, this message translates to:
  /// **'La remise s\'applique automatiquement dès que votre panier contient tous ces produits.'**
  String get offerAutoDiscount;

  /// No description provided for @accountTitle.
  ///
  /// In fr, this message translates to:
  /// **'Mon compte'**
  String get accountTitle;

  /// No description provided for @noName.
  ///
  /// In fr, this message translates to:
  /// **'Sans nom'**
  String get noName;

  /// No description provided for @tradeLabel.
  ///
  /// In fr, this message translates to:
  /// **'Activité : {trade}'**
  String tradeLabel(Object trade);

  /// No description provided for @awaitingApproval.
  ///
  /// In fr, this message translates to:
  /// **'En attente de validation'**
  String get awaitingApproval;

  /// No description provided for @editName.
  ///
  /// In fr, this message translates to:
  /// **'Modifier le nom'**
  String get editName;

  /// No description provided for @addressesTitle.
  ///
  /// In fr, this message translates to:
  /// **'Adresses de livraison'**
  String get addressesTitle;

  /// No description provided for @noAddresses.
  ///
  /// In fr, this message translates to:
  /// **'Aucune adresse enregistrée.'**
  String get noAddresses;

  /// No description provided for @defaultAddress.
  ///
  /// In fr, this message translates to:
  /// **'Par défaut'**
  String get defaultAddress;

  /// No description provided for @makeDefault.
  ///
  /// In fr, this message translates to:
  /// **'Utiliser par défaut'**
  String get makeDefault;

  /// No description provided for @changePassword.
  ///
  /// In fr, this message translates to:
  /// **'Changer mon mot de passe'**
  String get changePassword;

  /// No description provided for @signOut.
  ///
  /// In fr, this message translates to:
  /// **'Se déconnecter'**
  String get signOut;

  /// No description provided for @deleteAccount.
  ///
  /// In fr, this message translates to:
  /// **'Supprimer mon compte'**
  String get deleteAccount;

  /// No description provided for @deleteAccountQuestion.
  ///
  /// In fr, this message translates to:
  /// **'Supprimer mon compte ?'**
  String get deleteAccountQuestion;

  /// No description provided for @deleteAccountDetail.
  ///
  /// In fr, this message translates to:
  /// **'Votre nom, vos coordonnées, vos adresses et votre panier seront effacés, et vous ne pourrez plus vous connecter.\n\nVos commandes passées sont conservées de façon anonyme : ce sont des pièces comptables que Market Food doit garder.'**
  String get deleteAccountDetail;

  /// No description provided for @deleteForever.
  ///
  /// In fr, this message translates to:
  /// **'Supprimer définitivement'**
  String get deleteForever;

  /// No description provided for @passwordScreenTitle.
  ///
  /// In fr, this message translates to:
  /// **'Mot de passe'**
  String get passwordScreenTitle;

  /// No description provided for @currentPasswordLabel.
  ///
  /// In fr, this message translates to:
  /// **'Mot de passe actuel'**
  String get currentPasswordLabel;

  /// No description provided for @errCurrentPasswordMissing.
  ///
  /// In fr, this message translates to:
  /// **'Saisissez votre mot de passe actuel.'**
  String get errCurrentPasswordMissing;

  /// No description provided for @passwordChanged.
  ///
  /// In fr, this message translates to:
  /// **'Mot de passe modifié.'**
  String get passwordChanged;

  /// No description provided for @newAddress.
  ///
  /// In fr, this message translates to:
  /// **'Nouvelle adresse'**
  String get newAddress;

  /// No description provided for @fullAddressLabel.
  ///
  /// In fr, this message translates to:
  /// **'Adresse complète'**
  String get fullAddressLabel;

  /// No description provided for @fullAddressHint.
  ///
  /// In fr, this message translates to:
  /// **'Rue, numéro, repère'**
  String get fullAddressHint;

  /// No description provided for @addressNameLabel.
  ///
  /// In fr, this message translates to:
  /// **'Nom de l\'adresse (facultatif)'**
  String get addressNameLabel;

  /// No description provided for @addressNameHint.
  ///
  /// In fr, this message translates to:
  /// **'Boutique, dépôt…'**
  String get addressNameHint;

  /// No description provided for @errChooseCity.
  ///
  /// In fr, this message translates to:
  /// **'Choisissez votre ville.'**
  String get errChooseCity;

  /// No description provided for @errFullAddress.
  ///
  /// In fr, this message translates to:
  /// **'Indiquez l\'adresse complète.'**
  String get errFullAddress;

  /// No description provided for @reorder.
  ///
  /// In fr, this message translates to:
  /// **'Commander à nouveau'**
  String get reorder;

  /// No description provided for @reorderAdded.
  ///
  /// In fr, this message translates to:
  /// **'{count, plural, =1{1 article ajouté au panier} other{{count} articles ajoutés au panier}}'**
  String reorderAdded(int count);

  /// No description provided for @reorderSkipped.
  ///
  /// In fr, this message translates to:
  /// **'Indisponibles : {names}'**
  String reorderSkipped(Object names);

  /// No description provided for @reorderNothing.
  ///
  /// In fr, this message translates to:
  /// **'Aucun article de cette commande n\'est disponible actuellement.'**
  String get reorderNothing;

  /// No description provided for @similarProducts.
  ///
  /// In fr, this message translates to:
  /// **'Produits similaires'**
  String get similarProducts;

  /// No description provided for @inBundles.
  ///
  /// In fr, this message translates to:
  /// **'Disponible dans ces paniers'**
  String get inBundles;

  /// No description provided for @inBundlesText.
  ///
  /// In fr, this message translates to:
  /// **'Le même produit, moins cher dans un ensemble complet.'**
  String get inBundlesText;

  /// No description provided for @statsTotal.
  ///
  /// In fr, this message translates to:
  /// **'Commandes'**
  String get statsTotal;

  /// No description provided for @statsPending.
  ///
  /// In fr, this message translates to:
  /// **'En attente'**
  String get statsPending;

  /// No description provided for @statsInProgress.
  ///
  /// In fr, this message translates to:
  /// **'En cours'**
  String get statsInProgress;

  /// No description provided for @statsDelivered.
  ///
  /// In fr, this message translates to:
  /// **'Livrées'**
  String get statsDelivered;

  /// No description provided for @helpSection.
  ///
  /// In fr, this message translates to:
  /// **'Aide et informations'**
  String get helpSection;

  /// No description provided for @contactTitle.
  ///
  /// In fr, this message translates to:
  /// **'Contact'**
  String get contactTitle;

  /// No description provided for @contactIntro.
  ///
  /// In fr, this message translates to:
  /// **'Une question sur une commande, un produit ou un partenariat ? Notre équipe est là pour vous aider.'**
  String get contactIntro;

  /// No description provided for @contactPhone.
  ///
  /// In fr, this message translates to:
  /// **'Téléphone'**
  String get contactPhone;

  /// No description provided for @contactWhatsapp.
  ///
  /// In fr, this message translates to:
  /// **'WhatsApp'**
  String get contactWhatsapp;

  /// No description provided for @contactEmail.
  ///
  /// In fr, this message translates to:
  /// **'E-mail'**
  String get contactEmail;

  /// No description provided for @contactAddress.
  ///
  /// In fr, this message translates to:
  /// **'Adresse'**
  String get contactAddress;

  /// No description provided for @contactAddressLine1.
  ///
  /// In fr, this message translates to:
  /// **'EL Alia N 141'**
  String get contactAddressLine1;

  /// No description provided for @contactAddressLine2.
  ///
  /// In fr, this message translates to:
  /// **'Mohammedia, Maroc'**
  String get contactAddressLine2;

  /// No description provided for @contactOpenError.
  ///
  /// In fr, this message translates to:
  /// **'Impossible d\'ouvrir cette application sur le téléphone.'**
  String get contactOpenError;

  /// No description provided for @faqTitle.
  ///
  /// In fr, this message translates to:
  /// **'Questions fréquentes'**
  String get faqTitle;

  /// No description provided for @faqIntro.
  ///
  /// In fr, this message translates to:
  /// **'Tout ce qu\'il faut savoir pour commander en gros sur Market Food.'**
  String get faqIntro;

  /// No description provided for @faqQOrder.
  ///
  /// In fr, this message translates to:
  /// **'Comment passer une commande ?'**
  String get faqQOrder;

  /// No description provided for @faqAOrder.
  ///
  /// In fr, this message translates to:
  /// **'Parcourez le catalogue, ajoutez vos produits au panier puis validez la commande. Votre compte professionnel doit être validé pour voir les prix et commander.'**
  String get faqAOrder;

  /// No description provided for @faqQCod.
  ///
  /// In fr, this message translates to:
  /// **'Comment fonctionne le paiement à la livraison ?'**
  String get faqQCod;

  /// No description provided for @faqACod.
  ///
  /// In fr, this message translates to:
  /// **'Vous réglez le montant de votre commande directement au livreur, à la réception. Aucun paiement en ligne n\'est requis.'**
  String get faqACod;

  /// No description provided for @faqQTiers.
  ///
  /// In fr, this message translates to:
  /// **'Qu\'est-ce que les tarifs dégressifs ?'**
  String get faqQTiers;

  /// No description provided for @faqATiers.
  ///
  /// In fr, this message translates to:
  /// **'Plus vous commandez en quantité, plus le prix unitaire baisse. Les paliers de prix sont affichés sur la fiche de chaque produit.'**
  String get faqATiers;

  /// No description provided for @faqQDelivery.
  ///
  /// In fr, this message translates to:
  /// **'Quels sont les délais de livraison ?'**
  String get faqQDelivery;

  /// No description provided for @faqADelivery.
  ///
  /// In fr, this message translates to:
  /// **'Nous livrons vos commandes en gros partout au Maroc. Le délai dépend de votre ville ; il vous est communiqué lors de la commande.'**
  String get faqADelivery;

  /// No description provided for @faqQMinimum.
  ///
  /// In fr, this message translates to:
  /// **'Y a-t-il un minimum de commande ?'**
  String get faqQMinimum;

  /// No description provided for @faqAMinimum.
  ///
  /// In fr, this message translates to:
  /// **'Certains produits ont une quantité minimale de commande, indiquée sur leur fiche. Sinon, vous commandez la quantité de votre choix.'**
  String get faqAMinimum;

  /// No description provided for @faqQPromo.
  ///
  /// In fr, this message translates to:
  /// **'Comment utiliser un code promo ?'**
  String get faqQPromo;

  /// No description provided for @faqAPromo.
  ///
  /// In fr, this message translates to:
  /// **'Saisissez votre code promo à l\'écran « Commander », avant de confirmer : la réduction s\'applique si le code est valide.'**
  String get faqAPromo;

  /// No description provided for @faqQTracking.
  ///
  /// In fr, this message translates to:
  /// **'Comment suivre mes commandes ?'**
  String get faqQTracking;

  /// No description provided for @faqATracking.
  ///
  /// In fr, this message translates to:
  /// **'L\'onglet « Commandes » affiche l\'historique et le statut de chacune de vos commandes. Vous pouvez aussi y télécharger la facture et commander à nouveau.'**
  String get faqATracking;

  /// No description provided for @faqQContact.
  ///
  /// In fr, this message translates to:
  /// **'Comment vous contacter ?'**
  String get faqQContact;

  /// No description provided for @faqAContact.
  ///
  /// In fr, this message translates to:
  /// **'Par téléphone, WhatsApp ou e-mail, depuis la page Contact de votre compte. Notre équipe vous répond rapidement.'**
  String get faqAContact;

  /// No description provided for @termsTitle.
  ///
  /// In fr, this message translates to:
  /// **'Conditions générales de vente'**
  String get termsTitle;

  /// No description provided for @privacyTitle.
  ///
  /// In fr, this message translates to:
  /// **'Politique de confidentialité'**
  String get privacyTitle;

  /// No description provided for @greeting.
  ///
  /// In fr, this message translates to:
  /// **'Bonjour {name}'**
  String greeting(Object name);

  /// No description provided for @greetingAnonymous.
  ///
  /// In fr, this message translates to:
  /// **'Bonjour'**
  String get greetingAnonymous;

  /// No description provided for @heroTitle.
  ///
  /// In fr, this message translates to:
  /// **'Le marché de gros, dans votre poche'**
  String get heroTitle;

  /// No description provided for @perkDelivery.
  ///
  /// In fr, this message translates to:
  /// **'Livraison partout au Maroc'**
  String get perkDelivery;

  /// No description provided for @perkTiers.
  ///
  /// In fr, this message translates to:
  /// **'Prix dégressifs'**
  String get perkTiers;

  /// No description provided for @offersOfMoment.
  ///
  /// In fr, this message translates to:
  /// **'Offres du moment'**
  String get offersOfMoment;

  /// No description provided for @seeAll.
  ///
  /// In fr, this message translates to:
  /// **'Voir tout'**
  String get seeAll;

  /// No description provided for @allProducts.
  ///
  /// In fr, this message translates to:
  /// **'Tous les produits'**
  String get allProducts;

  /// No description provided for @offersHeroTitle.
  ///
  /// In fr, this message translates to:
  /// **'Des paniers complets, à prix de gros.'**
  String get offersHeroTitle;

  /// No description provided for @offersHeroText.
  ///
  /// In fr, this message translates to:
  /// **'Ajoutez un panier entier en un tap : la remise s\'applique automatiquement à la commande.'**
  String get offersHeroText;

  /// No description provided for @continueShopping.
  ///
  /// In fr, this message translates to:
  /// **'Continuer mes achats'**
  String get continueShopping;

  /// No description provided for @cartLineCount.
  ///
  /// In fr, this message translates to:
  /// **'{count, plural, =0{Aucun article} =1{1 article} other{{count} articles}}'**
  String cartLineCount(int count);

  /// No description provided for @discoverCatalogue.
  ///
  /// In fr, this message translates to:
  /// **'Découvrir le catalogue'**
  String get discoverCatalogue;

  /// No description provided for @orderCount.
  ///
  /// In fr, this message translates to:
  /// **'{count, plural, =0{Aucune commande} =1{1 commande} other{{count} commandes}}'**
  String orderCount(int count);

  /// No description provided for @settingsSection.
  ///
  /// In fr, this message translates to:
  /// **'Paramètres'**
  String get settingsSection;

  /// No description provided for @securitySection.
  ///
  /// In fr, this message translates to:
  /// **'Compte et sécurité'**
  String get securitySection;

  /// No description provided for @editProfileTitle.
  ///
  /// In fr, this message translates to:
  /// **'Mes informations'**
  String get editProfileTitle;

  /// No description provided for @editProfileSubtitle.
  ///
  /// In fr, this message translates to:
  /// **'Mettez à jour vos coordonnées. Elles figurent sur vos commandes et vos factures.'**
  String get editProfileSubtitle;

  /// No description provided for @tradeLockedHelp.
  ///
  /// In fr, this message translates to:
  /// **'Votre activité fixe vos prix : seul Market Food peut la modifier. Contactez-nous si elle a changé.'**
  String get tradeLockedHelp;

  /// No description provided for @newEmailLabel.
  ///
  /// In fr, this message translates to:
  /// **'Nouvelle adresse e-mail'**
  String get newEmailLabel;

  /// No description provided for @newEmailHelp.
  ///
  /// In fr, this message translates to:
  /// **'Nous enverrons un code à 6 chiffres à cette adresse pour la confirmer. Elle deviendra votre identifiant de connexion.'**
  String get newEmailHelp;

  /// No description provided for @profileUpdated.
  ///
  /// In fr, this message translates to:
  /// **'Informations mises à jour.'**
  String get profileUpdated;

  /// No description provided for @emailUpdated.
  ///
  /// In fr, this message translates to:
  /// **'Adresse e-mail mise à jour.'**
  String get emailUpdated;

  /// No description provided for @errSameEmail.
  ///
  /// In fr, this message translates to:
  /// **'C\'est déjà votre adresse e-mail.'**
  String get errSameEmail;

  /// No description provided for @tradeFieldLabel.
  ///
  /// In fr, this message translates to:
  /// **'Activité'**
  String get tradeFieldLabel;

  /// No description provided for @filterSort.
  ///
  /// In fr, this message translates to:
  /// **'Filtrer et trier'**
  String get filterSort;

  /// No description provided for @sortLabel.
  ///
  /// In fr, this message translates to:
  /// **'Trier par'**
  String get sortLabel;

  /// No description provided for @sortNewest.
  ///
  /// In fr, this message translates to:
  /// **'Nouveautés'**
  String get sortNewest;

  /// No description provided for @sortPriceAsc.
  ///
  /// In fr, this message translates to:
  /// **'Prix croissant'**
  String get sortPriceAsc;

  /// No description provided for @sortPriceDesc.
  ///
  /// In fr, this message translates to:
  /// **'Prix décroissant'**
  String get sortPriceDesc;

  /// No description provided for @sortName.
  ///
  /// In fr, this message translates to:
  /// **'Nom (A-Z)'**
  String get sortName;

  /// No description provided for @priceRange.
  ///
  /// In fr, this message translates to:
  /// **'Fourchette de prix'**
  String get priceRange;

  /// No description provided for @priceMinLabel.
  ///
  /// In fr, this message translates to:
  /// **'Prix minimum'**
  String get priceMinLabel;

  /// No description provided for @priceMaxLabel.
  ///
  /// In fr, this message translates to:
  /// **'Prix maximum'**
  String get priceMaxLabel;

  /// No description provided for @inStockOnly.
  ///
  /// In fr, this message translates to:
  /// **'Produits en stock uniquement'**
  String get inStockOnly;

  /// No description provided for @filtersReset.
  ///
  /// In fr, this message translates to:
  /// **'Réinitialiser'**
  String get filtersReset;

  /// No description provided for @filtersApply.
  ///
  /// In fr, this message translates to:
  /// **'Voir les résultats'**
  String get filtersApply;

  /// No description provided for @productSpecs.
  ///
  /// In fr, this message translates to:
  /// **'Caractéristiques'**
  String get productSpecs;

  /// The best quantity-discount rung, on one line under a product card's price.
  ///
  /// In fr, this message translates to:
  /// **'dès {quantity} {unit} : {price}'**
  String tierFromPrice(int quantity, String unit, String price);

  /// No description provided for @paymentCard.
  ///
  /// In fr, this message translates to:
  /// **'Paiement par carte'**
  String get paymentCard;

  /// No description provided for @paymentAwaiting.
  ///
  /// In fr, this message translates to:
  /// **'En attente de paiement'**
  String get paymentAwaiting;

  /// No description provided for @paymentPaid.
  ///
  /// In fr, this message translates to:
  /// **'Payée'**
  String get paymentPaid;

  /// No description provided for @paymentFailed.
  ///
  /// In fr, this message translates to:
  /// **'Paiement échoué'**
  String get paymentFailed;

  /// No description provided for @paymentRefunded.
  ///
  /// In fr, this message translates to:
  /// **'Remboursée'**
  String get paymentRefunded;

  /// No description provided for @aboutTitle.
  ///
  /// In fr, this message translates to:
  /// **'À propos'**
  String get aboutTitle;

  /// No description provided for @aboutHeroTitle.
  ///
  /// In fr, this message translates to:
  /// **'Le marché de gros en ligne du Maroc'**
  String get aboutHeroTitle;

  /// No description provided for @aboutHeroText.
  ///
  /// In fr, this message translates to:
  /// **'Market Food approvisionne les commerçants, restaurateurs et professionnels du Maroc : des milliers de références de gros, des prix qui baissent avec la quantité, une livraison partout dans le pays et le paiement à la livraison.'**
  String get aboutHeroText;

  /// No description provided for @aboutMissionTitle.
  ///
  /// In fr, this message translates to:
  /// **'Notre mission'**
  String get aboutMissionTitle;

  /// No description provided for @aboutMissionText.
  ///
  /// In fr, this message translates to:
  /// **'Rendre l\'approvisionnement en gros simple, transparent et accessible à tous les professionnels.'**
  String get aboutMissionText;

  /// No description provided for @aboutHowTitle.
  ///
  /// In fr, this message translates to:
  /// **'Comment ça marche'**
  String get aboutHowTitle;

  /// No description provided for @aboutWhoTitle.
  ///
  /// In fr, this message translates to:
  /// **'À qui nous vendons'**
  String get aboutWhoTitle;

  /// No description provided for @aboutWhoText.
  ///
  /// In fr, this message translates to:
  /// **'Aux professionnels : épiceries, supérettes, restaurants, cafés, hôtels et revendeurs. Chaque compte est validé par notre équipe, et vos prix dépendent de votre activité.'**
  String get aboutWhoText;

  /// No description provided for @aboutTiersTitle.
  ///
  /// In fr, this message translates to:
  /// **'Des prix dégressifs'**
  String get aboutTiersTitle;

  /// No description provided for @aboutTiersText.
  ///
  /// In fr, this message translates to:
  /// **'Plus la quantité est grande, plus le prix unitaire baisse. Les paliers sont affichés sur la fiche de chaque produit, avant d\'ajouter au panier.'**
  String get aboutTiersText;

  /// No description provided for @aboutCodTitle.
  ///
  /// In fr, this message translates to:
  /// **'Paiement à la livraison'**
  String get aboutCodTitle;

  /// No description provided for @aboutCodText.
  ///
  /// In fr, this message translates to:
  /// **'Aucun paiement en ligne : vous réglez le montant de la commande au livreur, à la réception de la marchandise.'**
  String get aboutCodText;

  /// No description provided for @aboutDeliveryTitle.
  ///
  /// In fr, this message translates to:
  /// **'Livraison partout au Maroc'**
  String get aboutDeliveryTitle;

  /// No description provided for @aboutDeliveryText.
  ///
  /// In fr, this message translates to:
  /// **'Nous livrons vos commandes dans tout le pays. Le délai dépend de votre ville et vous est communiqué à la commande ; chaque étape se suit dans l\'onglet « Commandes ».'**
  String get aboutDeliveryText;

  /// No description provided for @aboutTeamTitle.
  ///
  /// In fr, this message translates to:
  /// **'Une équipe joignable'**
  String get aboutTeamTitle;

  /// No description provided for @aboutTeamText.
  ///
  /// In fr, this message translates to:
  /// **'Une question sur une commande, un produit ou un partenariat ? Notre équipe répond par téléphone, WhatsApp ou e-mail.'**
  String get aboutTeamText;

  /// No description provided for @aboutContactTitle.
  ///
  /// In fr, this message translates to:
  /// **'Besoin d\'aide ?'**
  String get aboutContactTitle;

  /// No description provided for @aboutContactText.
  ///
  /// In fr, this message translates to:
  /// **'Appelez-nous, écrivez-nous sur WhatsApp ou par e-mail.'**
  String get aboutContactText;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['ar', 'fr'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'ar':
      return AppLocalizationsAr();
    case 'fr':
      return AppLocalizationsFr();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
