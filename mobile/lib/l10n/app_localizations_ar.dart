// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Arabic (`ar`).
class AppLocalizationsAr extends AppLocalizations {
  AppLocalizationsAr([String locale = 'ar']) : super(locale);

  @override
  String get retry => 'إعادة المحاولة';

  @override
  String get cancel => 'إلغاء';

  @override
  String get save => 'حفظ';

  @override
  String get see => 'عرض';

  @override
  String get add => 'إضافة';

  @override
  String get delete => 'حذف';

  @override
  String get change => 'تغيير';

  @override
  String get keep => 'الاحتفاظ بها';

  @override
  String get total => 'المجموع';

  @override
  String get subtotal => 'المجموع الفرعي';

  @override
  String get bundleDiscount => 'خصم السلال';

  @override
  String get delivery => 'التوصيل';

  @override
  String get cashOnDelivery => 'الدفع عند الاستلام';

  @override
  String get couponDiscount => 'رمز الخصم';

  @override
  String get showPassword => 'إظهار';

  @override
  String get hidePassword => 'إخفاء';

  @override
  String get language => 'اللغة';

  @override
  String get languageFrench => 'Français';

  @override
  String get languageArabic => 'العربية';

  @override
  String get loginTitle => 'تسجيل الدخول';

  @override
  String get loginSubtitle => 'اطّلع على أسعارك المهنية.';

  @override
  String get emailLabel => 'البريد الإلكتروني';

  @override
  String get passwordLabel => 'كلمة المرور';

  @override
  String get passwordHint => 'كلمة المرور الخاصة بك';

  @override
  String get forgotPasswordLink => 'نسيت كلمة المرور؟';

  @override
  String get signIn => 'تسجيل الدخول';

  @override
  String get noAccountYet => 'ليس لديك حساب مهني بعد؟';

  @override
  String get requestAccount => 'طلب فتح حساب';

  @override
  String get errEmailInvalid => 'أدخل بريداً إلكترونياً صحيحاً.';

  @override
  String get errPasswordMissing => 'أدخل كلمة المرور.';

  @override
  String get signupTradeTitle => 'ما هو نشاطك التجاري؟';

  @override
  String stepOf(Object step, Object total) {
    return 'الخطوة $step من $total';
  }

  @override
  String get signupTradeSubtitle =>
      'أسعار الجملة لدينا تختلف حسب مهنتك. اختر مهنتك للمتابعة.';

  @override
  String get signupNoTrades =>
      'لا توجد أنشطة متاحة حالياً. تواصل معنا وسنفتح حسابك يدوياً.';

  @override
  String get signupBusinessTitle => 'متجرك';

  @override
  String get signupBusinessSubtitle =>
      'يراجع فريقنا طلبك، ثم تتلقى بريداً إلكترونياً لتسجيل الدخول.';

  @override
  String signupYourTrade(Object trade) {
    return 'نشاطك: $trade';
  }

  @override
  String get businessNameLabel => 'اسم المتجر';

  @override
  String get yourNameLabel => 'اسمك';

  @override
  String get yourNameHint => 'الاسم الشخصي والعائلي';

  @override
  String get phoneLabel => 'الهاتف';

  @override
  String get deliveryAddressSection => 'عنوان التوصيل';

  @override
  String get citiesLoadError => 'تعذّر تحميل مدن التوصيل.';

  @override
  String get cityLabel => 'المدينة';

  @override
  String get cityHint => 'اختر مدينتك';

  @override
  String get districtLabel => 'الحي';

  @override
  String get districtHintPickCity => 'اختر المدينة أولاً';

  @override
  String get districtNone => 'لا حاجة لتحديد الحي';

  @override
  String get districtHint => 'اختر حيّك';

  @override
  String get streetLabel => 'الشارع والرقم';

  @override
  String get streetHelp => 'تُدخله مرة واحدة: سيُستعمل في كل طلب.';

  @override
  String passwordCreateHelp(Object min) {
    return '$min أحرف على الأقل. أنت من يختارها.';
  }

  @override
  String passwordMinHint(Object min) {
    return '$min أحرف على الأقل';
  }

  @override
  String get sendRequest => 'إرسال الطلب';

  @override
  String get haveAccount => 'لديك حساب؟ سجّل الدخول';

  @override
  String get errBusinessName => 'أدخل اسم متجرك.';

  @override
  String get errYourName => 'أدخل اسمك.';

  @override
  String get errPhone => 'أدخل رقم هاتف صحيحاً.';

  @override
  String get errDeliveryCity => 'اختر مدينة التوصيل.';

  @override
  String get errDistrict => 'اختر حيّك.';

  @override
  String get errStreet => 'أدخل الشارع والرقم.';

  @override
  String errPasswordShort(Object min) {
    return 'يجب أن تتكون كلمة المرور من $min أحرف على الأقل.';
  }

  @override
  String get pendingTitle => 'تم إرسال الطلب';

  @override
  String get pendingThanks =>
      'شكراً. تم إنشاء حسابك وهو في انتظار موافقة فريقنا.';

  @override
  String get pendingDetail =>
      'نتحقق من متجرك عادةً خلال 24 إلى 48 ساعة عمل. ستتلقى بريداً إلكترونياً بمجرد تفعيل حسابك، وستظهر أسعارك تلقائياً.';

  @override
  String get backToLogin => 'العودة إلى تسجيل الدخول';

  @override
  String get forgotTitle => 'نسيت كلمة المرور';

  @override
  String get forgotEmailLabel => 'البريد الإلكتروني للحساب';

  @override
  String get forgotEmailHelp =>
      'سنرسل إليك رمزاً من 6 أرقام صالحاً لمدة 15 دقيقة.';

  @override
  String get receiveCode => 'استلام الرمز';

  @override
  String codeSentTo(Object email) {
    return 'تم إرسال الرمز إلى $email. لا تنسَ التحقق من الرسائل غير المرغوب فيها.';
  }

  @override
  String get codeLabel => 'رمز من 6 أرقام';

  @override
  String get verifyCode => 'التحقق من الرمز';

  @override
  String get changeEmail => 'تغيير البريد';

  @override
  String get resendCode => 'إعادة إرسال الرمز';

  @override
  String get codeResent => 'تم إرسال رمز جديد.';

  @override
  String get codeVerified => 'تم التحقق من الرمز. اختر كلمة مرورك الجديدة.';

  @override
  String get newPasswordLabel => 'كلمة المرور الجديدة';

  @override
  String passwordMinHelp(Object min) {
    return '$min أحرف على الأقل.';
  }

  @override
  String get confirmPasswordLabel => 'تأكيد كلمة المرور';

  @override
  String get confirmPasswordHint => 'أعد إدخالها';

  @override
  String get sessionsWillClose =>
      'سيتم إغلاق جميع جلساتك المفتوحة: عليك تسجيل الدخول من جديد هنا وعلى أجهزتك الأخرى.';

  @override
  String get savePassword => 'حفظ كلمة المرور';

  @override
  String get passwordUpdatedSignIn => 'تم تحديث كلمة المرور. سجّل الدخول.';

  @override
  String get errEmailMissing => 'أدخل بريدك الإلكتروني.';

  @override
  String get errCodeMissing => 'أدخل الرمز الذي وصلك عبر البريد الإلكتروني.';

  @override
  String get errPasswordsDiffer => 'كلمتا المرور غير متطابقتين.';

  @override
  String get stepEmail => 'بريدك';

  @override
  String get stepCode => 'الرمز المستلم';

  @override
  String get stepNewPassword => 'كلمة مرور جديدة';

  @override
  String get tabCatalogue => 'الكتالوج';

  @override
  String get tabOffers => 'العروض';

  @override
  String get tabOrders => 'الطلبات';

  @override
  String get tabAccount => 'الحساب';

  @override
  String get searchHint => 'ابحث عن منتج';

  @override
  String get cartTooltip => 'سلتي';

  @override
  String get catalogueUnavailable => 'الكتالوج غير متاح';

  @override
  String get noProducts => 'لا توجد منتجات';

  @override
  String get noProductsFiltered => 'جرّب بحثاً آخر أو فئة أخرى.';

  @override
  String get catalogueEmpty => 'الكتالوج فارغ حالياً.';

  @override
  String get showAll => 'عرض الكل';

  @override
  String get allCategories => 'الكل';

  @override
  String get pendingApprovalBanner =>
      'حسابك في انتظار موافقة ماركت فود. يمكنك تصفح الكتالوج، وستظهر أسعار نشاطك بمجرد الموافقة على الحساب.';

  @override
  String get badgeOutOfStock => 'غير متوفر';

  @override
  String get badgeTiered => 'سعر تنازلي';

  @override
  String fromQuantity(Object quantity, Object unit) {
    return 'ابتداءً من $quantity $unit';
  }

  @override
  String get priceOnApproval => 'السعر بعد الموافقة على الحساب';

  @override
  String get productTitle => 'المنتج';

  @override
  String get description => 'الوصف';

  @override
  String get addToCart => 'أضف إلى السلة';

  @override
  String addQuantityToCart(Object quantity, Object unit) {
    return 'أضف $quantity $unit إلى السلة';
  }

  @override
  String get orderAfterApproval => 'الطلب متاح بعد الموافقة';

  @override
  String get outOfStock => 'نفد من المخزون';

  @override
  String inStock(Object quantity, Object unit) {
    return 'متوفر · $quantity $unit';
  }

  @override
  String minimumQuantity(Object quantity, Object unit) {
    return 'الحد الأدنى $quantity $unit';
  }

  @override
  String get tiersTitle => 'كلما اشتريت أكثر، دفعت أقل';

  @override
  String addedToCart(Object name) {
    return 'تمت إضافة $name إلى السلة';
  }

  @override
  String quantityInCart(Object name, Object quantity) {
    return '$name: $quantity في السلة';
  }

  @override
  String get reviewsTitle => 'تقييمات الزبناء';

  @override
  String reviewsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count تقييم',
      many: '$count تقييماً',
      few: '$count تقييمات',
      two: 'تقييمان',
      one: 'تقييم واحد',
      zero: 'لا توجد تقييمات',
    );
    return '$_temp0';
  }

  @override
  String get noRatingYet => 'لا يوجد تقييم بعد';

  @override
  String get reviewWrite => 'اكتب تقييمك';

  @override
  String get reviewFirst => 'كن أول من يترك تقييماً';

  @override
  String get reviewInvite => 'هل اشتريت هذا المنتج؟ رأيك يساعد التجار الآخرين.';

  @override
  String get reviewPlaceholder =>
      'الجودة، التغليف، التوصيل... ما قد يفيد تاجراً آخر.';

  @override
  String get reviewPublish => 'انشر تقييمي';

  @override
  String get reviewThanks => 'شكراً! سيُنشر تقييمك بعد المراجعة.';

  @override
  String get reviewYourRating => 'تقييمك';

  @override
  String get reviewAnonymous => 'زبون';

  @override
  String get reviewsSeeAll => 'عرض جميع التقييمات';

  @override
  String get rating1 => 'مخيّب';

  @override
  String get rating2 => 'متوسط';

  @override
  String get rating3 => 'مقبول';

  @override
  String get rating4 => 'جيد جداً';

  @override
  String get rating5 => 'ممتاز';

  @override
  String ratingStars(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count نجمة',
      few: '$count نجوم',
      two: 'نجمتان',
      one: 'نجمة واحدة',
    );
    return '$_temp0';
  }

  @override
  String get cartTitle => 'سلتي';

  @override
  String get cartUnavailable => 'السلة غير متاحة';

  @override
  String get cartEmptyTitle => 'سلتك فارغة';

  @override
  String get cartEmptyDetail => 'تصفّح الكتالوج وأضف منتجاتك.';

  @override
  String stockShort(Object quantity, Object unit) {
    return 'المخزون غير كافٍ: $quantity $unit متوفرة.';
  }

  @override
  String get priceChanged => 'تغيّر سعر هذا المنتج منذ إضافته.';

  @override
  String get deliveryAtCheckout => 'تُحسب عند الطلب';

  @override
  String get fixStockIssues => 'عدّل الكميات غير المتوفرة';

  @override
  String get checkout => 'اطلب الآن';

  @override
  String get checkoutTitle => 'إتمام الطلب';

  @override
  String get deliveryAddressTitle => 'عنوان التوصيل';

  @override
  String get addAddress => 'أضف عنواناً';

  @override
  String get paymentTitle => 'الدفع';

  @override
  String get driverNoteTitle => 'ملاحظة لعامل التوصيل';

  @override
  String get driverNoteHint => 'وقت المرور، علامة مميزة، الطابق…';

  @override
  String get couponTitle => 'رمز الخصم';

  @override
  String get couponHint => 'رمزك';

  @override
  String get couponApply => 'تطبيق';

  @override
  String get couponRemove => 'إزالة';

  @override
  String get couponEmpty => 'أدخل رمز الخصم.';

  @override
  String get couponInvalid => 'رمز الخصم غير صالح.';

  @override
  String couponLine(Object code) {
    return 'الرمز $code';
  }

  @override
  String get deliveryByCity => 'حسب المدينة المختارة';

  @override
  String get confirmOrder => 'تأكيد الطلب';

  @override
  String get errChooseAddress => 'اختر عنوان التوصيل.';

  @override
  String get noAddressTitle => 'لا يوجد عنوان مسجّل';

  @override
  String get noAddressDetail => 'نحتاج إلى معرفة مكان توصيل طلبك.';

  @override
  String get orderPlacedTitle => 'تم تسجيل الطلب';

  @override
  String get orderPlacedDetail => 'فريقنا يجهّزه الآن. سنُعلمك بكل مرحلة.';

  @override
  String get orderNumber => 'رقم الطلب';

  @override
  String get totalOnDelivery => 'المبلغ المستحق عند الاستلام';

  @override
  String get trackOrder => 'تتبّع طلبي';

  @override
  String get backToCatalogue => 'العودة إلى الكتالوج';

  @override
  String get ordersTitle => 'طلباتي';

  @override
  String get noOrders => 'لا توجد طلبات بعد';

  @override
  String get orderTitle => 'طلبي';

  @override
  String get cancelOrderQuestion => 'إلغاء الطلب؟';

  @override
  String get cancelOrderDetail => 'لن يتم تجهيزه ولا توصيله.';

  @override
  String get cancelOrder => 'إلغاء الطلب';

  @override
  String placedOn(Object date) {
    return 'بتاريخ $date';
  }

  @override
  String get items => 'المنتجات';

  @override
  String get free => 'مجاني';

  @override
  String noteLabel(Object note) {
    return 'ملاحظة: $note';
  }

  @override
  String get cancelPossible => 'ممكن ما دامت ماركت فود لم تؤكده بعد.';

  @override
  String get orderCancelled => 'تم إلغاء هذا الطلب.';

  @override
  String orderCancelledOn(Object date) {
    return 'أُلغي بتاريخ $date.';
  }

  @override
  String get invoicePdf => 'الفاتورة PDF';

  @override
  String get invoiceShare => 'مشاركة الفاتورة';

  @override
  String invoiceSubject(Object number) {
    return 'الفاتورة $number';
  }

  @override
  String get invoiceSaveError => 'تعذّر حفظ الفاتورة على الهاتف.';

  @override
  String get statusPending => 'في انتظار التأكيد';

  @override
  String get statusConfirmed => 'مؤكد';

  @override
  String get statusPreparing => 'قيد التجهيز';

  @override
  String get statusOutForDelivery => 'في الطريق إليك';

  @override
  String get statusDelivered => 'تم التسليم';

  @override
  String get statusCancelled => 'ملغى';

  @override
  String get offersTitle => 'عروض السلال';

  @override
  String get noOffersApproved => 'لا توجد عروض لنشاطك حالياً';

  @override
  String get noOffersPending => 'ستظهر العروض بمجرد الموافقة على حسابك';

  @override
  String get noOffersApprovedDetail => 'سنُعلمك فور صدور سلة جديدة.';

  @override
  String get noOffersPendingDetail => 'كل عرض مسعّر حسب نوع النشاط.';

  @override
  String productCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count منتج',
      many: '$count منتجاً',
      few: '$count منتجات',
      two: 'منتجان',
      one: 'منتج واحد',
    );
    return '$_temp0';
  }

  @override
  String get unavailable => 'غير متوفر';

  @override
  String get offerTitle => 'عرض السلة';

  @override
  String get offerAdded => 'تمت إضافة السلة: يُطبَّق الخصم تلقائياً.';

  @override
  String offerUntil(Object date) {
    return 'إلى غاية $date';
  }

  @override
  String get offerContents => 'محتوى السلة';

  @override
  String get itemOutOfStock => 'غير متوفر';

  @override
  String get boughtSeparately => 'عند الشراء منفردة';

  @override
  String get offerPrice => 'سعر السلة';

  @override
  String youSave(Object amount) {
    return 'توفّر $amount';
  }

  @override
  String get offerOtherTrade => 'عرض مخصّص لنشاط آخر';

  @override
  String get offerAdd => 'أضف السلة';

  @override
  String get offerUnavailable => 'السلة غير متوفرة';

  @override
  String get offerAutoDiscount =>
      'يُطبَّق الخصم تلقائياً عندما تحتوي سلتك على جميع هذه المنتجات.';

  @override
  String get accountTitle => 'حسابي';

  @override
  String get noName => 'بدون اسم';

  @override
  String tradeLabel(Object trade) {
    return 'النشاط: $trade';
  }

  @override
  String get awaitingApproval => 'في انتظار الموافقة';

  @override
  String get editName => 'تعديل الاسم';

  @override
  String get addressesTitle => 'عناوين التوصيل';

  @override
  String get noAddresses => 'لا يوجد عنوان مسجّل.';

  @override
  String get defaultAddress => 'افتراضي';

  @override
  String get makeDefault => 'اجعله افتراضياً';

  @override
  String get changePassword => 'تغيير كلمة المرور';

  @override
  String get signOut => 'تسجيل الخروج';

  @override
  String get deleteAccount => 'حذف حسابي';

  @override
  String get deleteAccountQuestion => 'حذف حسابي؟';

  @override
  String get deleteAccountDetail =>
      'سيتم مسح اسمك ومعلومات الاتصال وعناوينك وسلتك، ولن تتمكن من تسجيل الدخول بعد ذلك.\n\nتُحفظ طلباتك السابقة بشكل مجهول: فهي وثائق محاسبية يجب على ماركت فود الاحتفاظ بها.';

  @override
  String get deleteForever => 'حذف نهائي';

  @override
  String get passwordScreenTitle => 'كلمة المرور';

  @override
  String get currentPasswordLabel => 'كلمة المرور الحالية';

  @override
  String get errCurrentPasswordMissing => 'أدخل كلمة المرور الحالية.';

  @override
  String get passwordChanged => 'تم تغيير كلمة المرور.';

  @override
  String get newAddress => 'عنوان جديد';

  @override
  String get fullAddressLabel => 'العنوان الكامل';

  @override
  String get fullAddressHint => 'الشارع، الرقم، علامة مميزة';

  @override
  String get addressNameLabel => 'اسم العنوان (اختياري)';

  @override
  String get addressNameHint => 'المتجر، المستودع…';

  @override
  String get errChooseCity => 'اختر مدينتك.';

  @override
  String get errFullAddress => 'أدخل العنوان الكامل.';

  @override
  String get reorder => 'اطلب مرة أخرى';

  @override
  String reorderAdded(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'تمت إضافة $count منتج إلى السلة',
      many: 'تمت إضافة $count منتجاً إلى السلة',
      few: 'تمت إضافة $count منتجات إلى السلة',
      two: 'تمت إضافة منتجين إلى السلة',
      one: 'تمت إضافة منتج واحد إلى السلة',
    );
    return '$_temp0';
  }

  @override
  String reorderSkipped(Object names) {
    return 'غير متوفرة: $names';
  }

  @override
  String get reorderNothing => 'لا يتوفر أي منتج من هذا الطلب حالياً.';

  @override
  String get similarProducts => 'منتجات مشابهة';

  @override
  String get inBundles => 'متوفر ضمن هذه السلال';

  @override
  String get inBundlesText => 'نفس المنتج، بسعر أقل ضمن مجموعة كاملة.';

  @override
  String get statsTotal => 'الطلبات';

  @override
  String get statsPending => 'قيد الانتظار';

  @override
  String get statsInProgress => 'قيد التنفيذ';

  @override
  String get statsDelivered => 'تم تسليمها';

  @override
  String get helpSection => 'المساعدة والمعلومات';

  @override
  String get contactTitle => 'اتصل بنا';

  @override
  String get contactIntro =>
      'هل لديك سؤال عن طلب أو منتج أو شراكة؟ فريقنا هنا لمساعدتك.';

  @override
  String get contactPhone => 'الهاتف';

  @override
  String get contactWhatsapp => 'واتساب';

  @override
  String get contactEmail => 'البريد الإلكتروني';

  @override
  String get contactAddress => 'العنوان';

  @override
  String get contactAddressLine1 => 'العالية رقم 141';

  @override
  String get contactAddressLine2 => 'المحمدية، المغرب';

  @override
  String get contactOpenError => 'تعذّر فتح هذا التطبيق على الهاتف.';

  @override
  String get faqTitle => 'الأسئلة الشائعة';

  @override
  String get faqIntro => 'كل ما تحتاج معرفته للطلب بالجملة على ماركت فود.';

  @override
  String get faqQOrder => 'كيف أقوم بطلب؟';

  @override
  String get faqAOrder =>
      'تصفّح الكتالوج، أضف منتجاتك إلى السلة ثم أكّد الطلب. يجب أن تتم الموافقة على حسابك المهني لرؤية الأسعار والطلب.';

  @override
  String get faqQCod => 'كيف يعمل الدفع عند الاستلام؟';

  @override
  String get faqACod =>
      'تدفع مبلغ طلبك مباشرة لعامل التوصيل عند الاستلام. لا حاجة إلى أي دفع عبر الإنترنت.';

  @override
  String get faqQTiers => 'ما هي الأسعار التنازلية؟';

  @override
  String get faqATiers =>
      'كلما زادت الكمية التي تطلبها، انخفض سعر الوحدة. تظهر مستويات الأسعار في بطاقة كل منتج.';

  @override
  String get faqQDelivery => 'ما هي مدة التوصيل؟';

  @override
  String get faqADelivery =>
      'نوصّل طلباتك بالجملة إلى جميع أنحاء المغرب. تعتمد المدة على مدينتك، وتُبلَّغ بها عند الطلب.';

  @override
  String get faqQMinimum => 'هل هناك حد أدنى للطلب؟';

  @override
  String get faqAMinimum =>
      'بعض المنتجات لها كمية دنيا للطلب، مذكورة في بطاقتها. وفيما عدا ذلك، تطلب الكمية التي تريدها.';

  @override
  String get faqQPromo => 'كيف أستخدم رمز الخصم؟';

  @override
  String get faqAPromo =>
      'أدخل رمز الخصم في شاشة «إتمام الطلب» قبل التأكيد: يُطبَّق التخفيض إذا كان الرمز صالحاً.';

  @override
  String get faqQTracking => 'كيف أتتبّع طلباتي؟';

  @override
  String get faqATracking =>
      'يعرض تبويب «الطلبات» سجلّ طلباتك وحالة كلٍّ منها. ويمكنك منه أيضاً تحميل الفاتورة وإعادة الطلب.';

  @override
  String get faqQContact => 'كيف أتواصل معكم؟';

  @override
  String get faqAContact =>
      'عبر الهاتف أو واتساب أو البريد الإلكتروني، من صفحة «اتصل بنا» في حسابك. يرد فريقنا بسرعة.';

  @override
  String get termsTitle => 'الشروط العامة للبيع';

  @override
  String get privacyTitle => 'سياسة الخصوصية';

  @override
  String greeting(Object name) {
    return 'مرحباً $name';
  }

  @override
  String get greetingAnonymous => 'مرحباً';

  @override
  String get heroTitle => 'سوق الجملة في جيبك';

  @override
  String get perkDelivery => 'توصيل إلى جميع أنحاء المغرب';

  @override
  String get perkTiers => 'أسعار تنازلية';

  @override
  String get offersOfMoment => 'عروض هذه الفترة';

  @override
  String get seeAll => 'عرض الكل';

  @override
  String get allProducts => 'جميع المنتجات';

  @override
  String get offersHeroTitle => 'سلال كاملة، بأسعار الجملة.';

  @override
  String get offersHeroText =>
      'أضف سلة كاملة بلمسة واحدة: يُطبَّق الخصم تلقائياً على الطلب.';

  @override
  String get continueShopping => 'متابعة التسوق';

  @override
  String cartLineCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count منتج',
      many: '$count منتجاً',
      few: '$count منتجات',
      two: 'منتجان',
      one: 'منتج واحد',
      zero: 'لا توجد منتجات',
    );
    return '$_temp0';
  }

  @override
  String get discoverCatalogue => 'اكتشف الكتالوج';

  @override
  String orderCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count طلب',
      many: '$count طلباً',
      few: '$count طلبات',
      two: 'طلبان',
      one: 'طلب واحد',
      zero: 'لا توجد طلبات',
    );
    return '$_temp0';
  }

  @override
  String get settingsSection => 'الإعدادات';

  @override
  String get securitySection => 'الحساب والأمان';

  @override
  String get editProfileTitle => 'معلوماتي';

  @override
  String get editProfileSubtitle =>
      'حدّث معلومات الاتصال الخاصة بك. تظهر في طلباتك وفواتيرك.';

  @override
  String get tradeLockedHelp =>
      'نشاطك يحدد أسعارك: ماركت فود وحدها يمكنها تغييره. تواصل معنا إذا تغيّر.';

  @override
  String get newEmailLabel => 'البريد الإلكتروني الجديد';

  @override
  String get newEmailHelp =>
      'سنرسل رمزاً من 6 أرقام إلى هذا العنوان لتأكيده. سيصبح معرّف تسجيل الدخول الخاص بك.';

  @override
  String get profileUpdated => 'تم تحديث المعلومات.';

  @override
  String get emailUpdated => 'تم تحديث البريد الإلكتروني.';

  @override
  String get errSameEmail => 'هذا هو بريدك الإلكتروني الحالي.';

  @override
  String get tradeFieldLabel => 'النشاط';
}
