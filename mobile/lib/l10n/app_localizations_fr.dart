// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for French (`fr`).
class AppLocalizationsFr extends AppLocalizations {
  AppLocalizationsFr([String locale = 'fr']) : super(locale);

  @override
  String get retry => 'Réessayer';

  @override
  String get cancel => 'Annuler';

  @override
  String get save => 'Enregistrer';

  @override
  String get see => 'Voir';

  @override
  String get add => 'Ajouter';

  @override
  String get delete => 'Supprimer';

  @override
  String get change => 'Changer';

  @override
  String get keep => 'Garder';

  @override
  String get total => 'Total';

  @override
  String get subtotal => 'Sous-total';

  @override
  String get bundleDiscount => 'Remise paniers';

  @override
  String get delivery => 'Livraison';

  @override
  String get cashOnDelivery => 'Paiement à la livraison';

  @override
  String get couponDiscount => 'Code promo';

  @override
  String get showPassword => 'Afficher';

  @override
  String get hidePassword => 'Masquer';

  @override
  String get language => 'Langue';

  @override
  String get languageFrench => 'Français';

  @override
  String get languageArabic => 'العربية';

  @override
  String get loginTitle => 'Connexion';

  @override
  String get loginSubtitle => 'Accédez à vos tarifs professionnels.';

  @override
  String get emailLabel => 'Adresse e-mail';

  @override
  String get passwordLabel => 'Mot de passe';

  @override
  String get passwordHint => 'Votre mot de passe';

  @override
  String get forgotPasswordLink => 'Mot de passe oublié ?';

  @override
  String get signIn => 'Se connecter';

  @override
  String get noAccountYet => 'Pas encore de compte professionnel ?';

  @override
  String get requestAccount => 'Demander l\'ouverture d\'un compte';

  @override
  String get errEmailInvalid => 'Saisissez une adresse e-mail valide.';

  @override
  String get errPasswordMissing => 'Saisissez votre mot de passe.';

  @override
  String get signupTradeTitle => 'Quelle est votre activité ?';

  @override
  String stepOf(Object step, Object total) {
    return 'Étape $step sur $total';
  }

  @override
  String get signupTradeSubtitle =>
      'Nos tarifs de gros dépendent de votre métier. Choisissez le vôtre pour continuer.';

  @override
  String get signupNoTrades =>
      'Aucune activité n\'est proposée pour le moment. Contactez-nous et nous ouvrirons votre compte manuellement.';

  @override
  String get signupBusinessTitle => 'Votre commerce';

  @override
  String get signupBusinessSubtitle =>
      'Votre demande est validée par notre équipe, puis vous recevez un e-mail pour vous connecter.';

  @override
  String signupYourTrade(Object trade) {
    return 'Votre activité : $trade';
  }

  @override
  String get businessNameLabel => 'Nom du commerce';

  @override
  String get yourNameLabel => 'Votre nom';

  @override
  String get yourNameHint => 'Prénom et nom';

  @override
  String get phoneLabel => 'Téléphone';

  @override
  String get deliveryAddressSection => 'Adresse de livraison';

  @override
  String get citiesLoadError =>
      'Impossible de charger les villes de livraison.';

  @override
  String get cityLabel => 'Ville';

  @override
  String get cityHint => 'Choisissez votre ville';

  @override
  String get districtLabel => 'Quartier';

  @override
  String get districtHintPickCity => 'Choisissez d\'abord la ville';

  @override
  String get districtNone => 'Aucun quartier à préciser';

  @override
  String get districtHint => 'Choisissez votre quartier';

  @override
  String get streetLabel => 'Rue et numéro';

  @override
  String get streetHelp =>
      'Saisie une seule fois : elle sera reprise à chaque commande.';

  @override
  String passwordCreateHelp(Object min) {
    return 'Au moins $min caractères. C\'est vous qui le choisissez.';
  }

  @override
  String passwordMinHint(Object min) {
    return '$min caractères minimum';
  }

  @override
  String get sendRequest => 'Envoyer ma demande';

  @override
  String get haveAccount => 'Vous avez déjà un compte ? Se connecter';

  @override
  String get errBusinessName => 'Indiquez le nom de votre commerce.';

  @override
  String get errYourName => 'Indiquez votre nom.';

  @override
  String get errPhone => 'Indiquez un numéro de téléphone valide.';

  @override
  String get errDeliveryCity => 'Choisissez votre ville de livraison.';

  @override
  String get errDistrict => 'Choisissez votre quartier.';

  @override
  String get errStreet => 'Indiquez la rue et le numéro.';

  @override
  String errPasswordShort(Object min) {
    return 'Le mot de passe doit contenir au moins $min caractères.';
  }

  @override
  String get pendingTitle => 'Demande envoyée';

  @override
  String get pendingThanks =>
      'Merci. Votre compte est créé et attend la validation de notre équipe.';

  @override
  String get pendingDetail =>
      'Nous vérifions votre commerce, généralement sous 24 à 48 heures ouvrables. Vous recevrez un e-mail dès que votre compte sera actif ; vos tarifs apparaîtront alors automatiquement.';

  @override
  String get backToLogin => 'Retour à la connexion';

  @override
  String get forgotTitle => 'Mot de passe oublié';

  @override
  String get forgotEmailLabel => 'Adresse e-mail du compte';

  @override
  String get forgotEmailHelp =>
      'Nous vous enverrons un code à 6 chiffres, valable 15 minutes.';

  @override
  String get receiveCode => 'Recevoir le code';

  @override
  String codeSentTo(Object email) {
    return 'Code envoyé à $email. Pensez à vérifier vos spams.';
  }

  @override
  String get codeLabel => 'Code à 6 chiffres';

  @override
  String get verifyCode => 'Vérifier le code';

  @override
  String get changeEmail => 'Changer d\'adresse';

  @override
  String get resendCode => 'Renvoyer le code';

  @override
  String get codeResent => 'Un nouveau code a été envoyé.';

  @override
  String get codeVerified =>
      'Code vérifié. Choisissez votre nouveau mot de passe.';

  @override
  String get newPasswordLabel => 'Nouveau mot de passe';

  @override
  String passwordMinHelp(Object min) {
    return 'Au moins $min caractères.';
  }

  @override
  String get confirmPasswordLabel => 'Confirmer le mot de passe';

  @override
  String get confirmPasswordHint => 'Ressaisissez-le';

  @override
  String get sessionsWillClose =>
      'Toutes vos sessions ouvertes seront fermées : vous devrez vous reconnecter, ici et sur vos autres appareils.';

  @override
  String get savePassword => 'Enregistrer le mot de passe';

  @override
  String get passwordUpdatedSignIn =>
      'Mot de passe mis à jour. Connectez-vous.';

  @override
  String get errEmailMissing => 'Saisissez votre adresse e-mail.';

  @override
  String get errCodeMissing => 'Saisissez le code reçu par e-mail.';

  @override
  String get errPasswordsDiffer =>
      'Les deux mots de passe ne correspondent pas.';

  @override
  String get stepEmail => 'Votre e-mail';

  @override
  String get stepCode => 'Le code reçu';

  @override
  String get stepNewPassword => 'Nouveau mot de passe';

  @override
  String get tabCatalogue => 'Catalogue';

  @override
  String get tabOffers => 'Offres';

  @override
  String get tabOrders => 'Commandes';

  @override
  String get tabAccount => 'Compte';

  @override
  String get searchHint => 'Rechercher un produit';

  @override
  String get cartTooltip => 'Mon panier';

  @override
  String get catalogueUnavailable => 'Catalogue indisponible';

  @override
  String get noProducts => 'Aucun produit';

  @override
  String get noProductsFiltered =>
      'Essayez une autre recherche ou une autre catégorie.';

  @override
  String get catalogueEmpty => 'Le catalogue est vide pour le moment.';

  @override
  String get showAll => 'Tout afficher';

  @override
  String get allCategories => 'Tout';

  @override
  String get pendingApprovalBanner =>
      'Votre compte attend sa validation par Market Food. Vous pouvez parcourir le catalogue ; les prix de votre activité apparaîtront une fois le compte validé.';

  @override
  String get badgeOutOfStock => 'Rupture';

  @override
  String get badgeTiered => 'Dégressif';

  @override
  String fromQuantity(Object quantity, Object unit) {
    return 'À partir de $quantity $unit';
  }

  @override
  String get priceOnApproval => 'Prix sur validation du compte';

  @override
  String get productTitle => 'Produit';

  @override
  String get description => 'Description';

  @override
  String get addToCart => 'Ajouter au panier';

  @override
  String addQuantityToCart(Object quantity, Object unit) {
    return 'Ajouter $quantity $unit au panier';
  }

  @override
  String get orderAfterApproval => 'Commande possible après validation';

  @override
  String get outOfStock => 'Rupture de stock';

  @override
  String inStock(Object quantity, Object unit) {
    return 'En stock · $quantity $unit';
  }

  @override
  String minimumQuantity(Object quantity, Object unit) {
    return 'minimum $quantity $unit';
  }

  @override
  String get tiersTitle => 'Plus vous achetez, moins cher';

  @override
  String addedToCart(Object name) {
    return '$name ajouté au panier';
  }

  @override
  String quantityInCart(Object name, Object quantity) {
    return '$name : $quantity au panier';
  }

  @override
  String get reviewsTitle => 'Avis clients';

  @override
  String reviewsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count avis',
      one: '1 avis',
      zero: 'Aucun avis',
    );
    return '$_temp0';
  }

  @override
  String get noRatingYet => 'Aucune note pour le moment';

  @override
  String get reviewWrite => 'Donnez votre avis';

  @override
  String get reviewFirst => 'Soyez le premier à donner votre avis';

  @override
  String get reviewInvite =>
      'Vous avez acheté ce produit ? Votre avis aide les autres commerçants.';

  @override
  String get reviewPlaceholder =>
      'Qualité, emballage, livraison... ce qui aiderait un autre commerçant.';

  @override
  String get reviewPublish => 'Publier mon avis';

  @override
  String get reviewThanks => 'Merci ! Votre avis sera publié après modération.';

  @override
  String get reviewYourRating => 'Votre note';

  @override
  String get reviewAnonymous => 'Client';

  @override
  String get reviewsSeeAll => 'Voir tous les avis';

  @override
  String get rating1 => 'Décevant';

  @override
  String get rating2 => 'Moyen';

  @override
  String get rating3 => 'Correct';

  @override
  String get rating4 => 'Très bien';

  @override
  String get rating5 => 'Excellent';

  @override
  String ratingStars(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count étoiles',
      one: '1 étoile',
    );
    return '$_temp0';
  }

  @override
  String get cartTitle => 'Mon panier';

  @override
  String get cartUnavailable => 'Panier indisponible';

  @override
  String get cartEmptyTitle => 'Votre panier est vide';

  @override
  String get cartEmptyDetail =>
      'Parcourez le catalogue et ajoutez vos produits.';

  @override
  String stockShort(Object quantity, Object unit) {
    return 'Stock insuffisant : $quantity $unit disponibles.';
  }

  @override
  String get priceChanged => 'Le prix de ce produit a changé depuis son ajout.';

  @override
  String get deliveryAtCheckout => 'Calculée à la commande';

  @override
  String get fixStockIssues => 'Ajustez les quantités en rupture';

  @override
  String get checkout => 'Commander';

  @override
  String get checkoutTitle => 'Commander';

  @override
  String get deliveryAddressTitle => 'Adresse de livraison';

  @override
  String get addAddress => 'Ajouter une adresse';

  @override
  String get paymentTitle => 'Paiement';

  @override
  String get driverNoteTitle => 'Note pour le livreur';

  @override
  String get driverNoteHint => 'Horaire de passage, repère, étage…';

  @override
  String get couponTitle => 'Code promo';

  @override
  String get couponHint => 'Votre code';

  @override
  String get couponApply => 'Appliquer';

  @override
  String get couponRemove => 'Retirer';

  @override
  String get couponEmpty => 'Saisissez un code promo.';

  @override
  String get couponInvalid => 'Code promo invalide.';

  @override
  String couponLine(Object code) {
    return 'Code $code';
  }

  @override
  String get deliveryByCity => 'Selon la ville choisie';

  @override
  String get confirmOrder => 'Confirmer la commande';

  @override
  String get errChooseAddress => 'Choisissez une adresse de livraison.';

  @override
  String get noAddressTitle => 'Aucune adresse enregistrée';

  @override
  String get noAddressDetail => 'Nous devons savoir où livrer votre commande.';

  @override
  String get orderPlacedTitle => 'Commande enregistrée';

  @override
  String get orderPlacedDetail =>
      'Notre équipe la prépare. Vous serez prévenu à chaque étape.';

  @override
  String get orderNumber => 'Numéro de commande';

  @override
  String get totalOnDelivery => 'Total à payer à la livraison';

  @override
  String get trackOrder => 'Suivre ma commande';

  @override
  String get backToCatalogue => 'Retour au catalogue';

  @override
  String get ordersTitle => 'Mes commandes';

  @override
  String get noOrders => 'Aucune commande pour le moment';

  @override
  String get orderTitle => 'Ma commande';

  @override
  String get cancelOrderQuestion => 'Annuler la commande ?';

  @override
  String get cancelOrderDetail => 'Elle ne sera ni préparée ni livrée.';

  @override
  String get cancelOrder => 'Annuler la commande';

  @override
  String placedOn(Object date) {
    return 'Passée le $date';
  }

  @override
  String get items => 'Articles';

  @override
  String get free => 'Offerte';

  @override
  String noteLabel(Object note) {
    return 'Note : $note';
  }

  @override
  String get cancelPossible =>
      'Possible tant que Market Food ne l\'a pas validée.';

  @override
  String get orderCancelled => 'Cette commande a été annulée.';

  @override
  String orderCancelledOn(Object date) {
    return 'Annulée le $date.';
  }

  @override
  String get invoicePdf => 'Facture PDF';

  @override
  String get invoiceShare => 'Partager la facture';

  @override
  String invoiceSubject(Object number) {
    return 'Facture $number';
  }

  @override
  String get invoiceSaveError =>
      'La facture n\'a pas pu être enregistrée sur le téléphone.';

  @override
  String get statusPending => 'En attente de validation';

  @override
  String get statusConfirmed => 'Confirmée';

  @override
  String get statusPreparing => 'En préparation';

  @override
  String get statusOutForDelivery => 'En cours de livraison';

  @override
  String get statusDelivered => 'Livrée';

  @override
  String get statusCancelled => 'Annulée';

  @override
  String get offersTitle => 'Offres paniers';

  @override
  String get noOffersApproved =>
      'Aucune offre pour votre activité en ce moment';

  @override
  String get noOffersPending =>
      'Les offres apparaîtront une fois votre compte validé';

  @override
  String get noOffersApprovedDetail =>
      'Vous serez prévenu dès qu\'un nouveau panier sort.';

  @override
  String get noOffersPendingDetail =>
      'Chaque offre est tarifée pour un type d\'activité.';

  @override
  String productCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count produits',
      one: '1 produit',
    );
    return '$_temp0';
  }

  @override
  String get unavailable => 'Indisponible';

  @override
  String get offerTitle => 'Offre panier';

  @override
  String get offerAdded =>
      'Panier ajouté : la remise s\'applique automatiquement.';

  @override
  String offerUntil(Object date) {
    return 'Jusqu\'au $date';
  }

  @override
  String get offerContents => 'Ce que contient le panier';

  @override
  String get itemOutOfStock => 'En rupture';

  @override
  String get boughtSeparately => 'Achetés séparément';

  @override
  String get offerPrice => 'Prix du panier';

  @override
  String youSave(Object amount) {
    return 'Vous économisez $amount';
  }

  @override
  String get offerOtherTrade => 'Offre réservée à une autre activité';

  @override
  String get offerAdd => 'Ajouter le panier';

  @override
  String get offerUnavailable => 'Panier indisponible';

  @override
  String get offerAutoDiscount =>
      'La remise s\'applique automatiquement dès que votre panier contient tous ces produits.';

  @override
  String get accountTitle => 'Mon compte';

  @override
  String get noName => 'Sans nom';

  @override
  String tradeLabel(Object trade) {
    return 'Activité : $trade';
  }

  @override
  String get awaitingApproval => 'En attente de validation';

  @override
  String get editName => 'Modifier le nom';

  @override
  String get addressesTitle => 'Adresses de livraison';

  @override
  String get noAddresses => 'Aucune adresse enregistrée.';

  @override
  String get defaultAddress => 'Par défaut';

  @override
  String get makeDefault => 'Utiliser par défaut';

  @override
  String get changePassword => 'Changer mon mot de passe';

  @override
  String get signOut => 'Se déconnecter';

  @override
  String get deleteAccount => 'Supprimer mon compte';

  @override
  String get deleteAccountQuestion => 'Supprimer mon compte ?';

  @override
  String get deleteAccountDetail =>
      'Votre nom, vos coordonnées, vos adresses et votre panier seront effacés, et vous ne pourrez plus vous connecter.\n\nVos commandes passées sont conservées de façon anonyme : ce sont des pièces comptables que Market Food doit garder.';

  @override
  String get deleteForever => 'Supprimer définitivement';

  @override
  String get passwordScreenTitle => 'Mot de passe';

  @override
  String get currentPasswordLabel => 'Mot de passe actuel';

  @override
  String get errCurrentPasswordMissing =>
      'Saisissez votre mot de passe actuel.';

  @override
  String get passwordChanged => 'Mot de passe modifié.';

  @override
  String get newAddress => 'Nouvelle adresse';

  @override
  String get fullAddressLabel => 'Adresse complète';

  @override
  String get fullAddressHint => 'Rue, numéro, repère';

  @override
  String get addressNameLabel => 'Nom de l\'adresse (facultatif)';

  @override
  String get addressNameHint => 'Boutique, dépôt…';

  @override
  String get errChooseCity => 'Choisissez votre ville.';

  @override
  String get errFullAddress => 'Indiquez l\'adresse complète.';

  @override
  String get reorder => 'Commander à nouveau';

  @override
  String reorderAdded(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count articles ajoutés au panier',
      one: '1 article ajouté au panier',
    );
    return '$_temp0';
  }

  @override
  String reorderSkipped(Object names) {
    return 'Indisponibles : $names';
  }

  @override
  String get reorderNothing =>
      'Aucun article de cette commande n\'est disponible actuellement.';

  @override
  String get similarProducts => 'Produits similaires';

  @override
  String get inBundles => 'Disponible dans ces paniers';

  @override
  String get inBundlesText =>
      'Le même produit, moins cher dans un ensemble complet.';

  @override
  String get statsTotal => 'Commandes';

  @override
  String get statsPending => 'En attente';

  @override
  String get statsInProgress => 'En cours';

  @override
  String get statsDelivered => 'Livrées';

  @override
  String get helpSection => 'Aide et informations';

  @override
  String get contactTitle => 'Contact';

  @override
  String get contactIntro =>
      'Une question sur une commande, un produit ou un partenariat ? Notre équipe est là pour vous aider.';

  @override
  String get contactPhone => 'Téléphone';

  @override
  String get contactWhatsapp => 'WhatsApp';

  @override
  String get contactEmail => 'E-mail';

  @override
  String get contactAddress => 'Adresse';

  @override
  String get contactAddressLine1 => 'EL Alia N 141';

  @override
  String get contactAddressLine2 => 'Mohammedia, Maroc';

  @override
  String get contactOpenError =>
      'Impossible d\'ouvrir cette application sur le téléphone.';

  @override
  String get faqTitle => 'Questions fréquentes';

  @override
  String get faqIntro =>
      'Tout ce qu\'il faut savoir pour commander en gros sur Market Food.';

  @override
  String get faqQOrder => 'Comment passer une commande ?';

  @override
  String get faqAOrder =>
      'Parcourez le catalogue, ajoutez vos produits au panier puis validez la commande. Votre compte professionnel doit être validé pour voir les prix et commander.';

  @override
  String get faqQCod => 'Comment fonctionne le paiement à la livraison ?';

  @override
  String get faqACod =>
      'Vous réglez le montant de votre commande directement au livreur, à la réception. Aucun paiement en ligne n\'est requis.';

  @override
  String get faqQTiers => 'Qu\'est-ce que les tarifs dégressifs ?';

  @override
  String get faqATiers =>
      'Plus vous commandez en quantité, plus le prix unitaire baisse. Les paliers de prix sont affichés sur la fiche de chaque produit.';

  @override
  String get faqQDelivery => 'Quels sont les délais de livraison ?';

  @override
  String get faqADelivery =>
      'Nous livrons vos commandes en gros partout au Maroc. Le délai dépend de votre ville ; il vous est communiqué lors de la commande.';

  @override
  String get faqQMinimum => 'Y a-t-il un minimum de commande ?';

  @override
  String get faqAMinimum =>
      'Certains produits ont une quantité minimale de commande, indiquée sur leur fiche. Sinon, vous commandez la quantité de votre choix.';

  @override
  String get faqQPromo => 'Comment utiliser un code promo ?';

  @override
  String get faqAPromo =>
      'Saisissez votre code promo à l\'écran « Commander », avant de confirmer : la réduction s\'applique si le code est valide.';

  @override
  String get faqQTracking => 'Comment suivre mes commandes ?';

  @override
  String get faqATracking =>
      'L\'onglet « Commandes » affiche l\'historique et le statut de chacune de vos commandes. Vous pouvez aussi y télécharger la facture et commander à nouveau.';

  @override
  String get faqQContact => 'Comment vous contacter ?';

  @override
  String get faqAContact =>
      'Par téléphone, WhatsApp ou e-mail, depuis la page Contact de votre compte. Notre équipe vous répond rapidement.';

  @override
  String get termsTitle => 'Conditions générales de vente';

  @override
  String get privacyTitle => 'Politique de confidentialité';

  @override
  String greeting(Object name) {
    return 'Bonjour $name';
  }

  @override
  String get greetingAnonymous => 'Bonjour';

  @override
  String get heroTitle => 'Le marché de gros, dans votre poche';

  @override
  String get perkDelivery => 'Livraison partout au Maroc';

  @override
  String get perkTiers => 'Prix dégressifs';

  @override
  String get offersOfMoment => 'Offres du moment';

  @override
  String get seeAll => 'Voir tout';

  @override
  String get allProducts => 'Tous les produits';

  @override
  String get offersHeroTitle => 'Des paniers complets, à prix de gros.';

  @override
  String get offersHeroText =>
      'Ajoutez un panier entier en un tap : la remise s\'applique automatiquement à la commande.';

  @override
  String get continueShopping => 'Continuer mes achats';

  @override
  String cartLineCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count articles',
      one: '1 article',
      zero: 'Aucun article',
    );
    return '$_temp0';
  }

  @override
  String get discoverCatalogue => 'Découvrir le catalogue';

  @override
  String orderCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count commandes',
      one: '1 commande',
      zero: 'Aucune commande',
    );
    return '$_temp0';
  }

  @override
  String get settingsSection => 'Paramètres';

  @override
  String get securitySection => 'Compte et sécurité';

  @override
  String get editProfileTitle => 'Mes informations';

  @override
  String get editProfileSubtitle =>
      'Mettez à jour vos coordonnées. Elles figurent sur vos commandes et vos factures.';

  @override
  String get tradeLockedHelp =>
      'Votre activité fixe vos prix : seul Market Food peut la modifier. Contactez-nous si elle a changé.';

  @override
  String get newEmailLabel => 'Nouvelle adresse e-mail';

  @override
  String get newEmailHelp =>
      'Nous enverrons un code à 6 chiffres à cette adresse pour la confirmer. Elle deviendra votre identifiant de connexion.';

  @override
  String get profileUpdated => 'Informations mises à jour.';

  @override
  String get emailUpdated => 'Adresse e-mail mise à jour.';

  @override
  String get errSameEmail => 'C\'est déjà votre adresse e-mail.';

  @override
  String get tradeFieldLabel => 'Activité';
}
