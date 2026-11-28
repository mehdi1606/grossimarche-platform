import 'dart:io';
import 'dart:ui';

import 'package:dio/dio.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';

import '../../l10n/app_localizations.dart';
import '../providers.dart';

export '../../l10n/app_localizations.dart';

/// The app's own words in the current language: `context.l10n.signIn`.
extension L10nContext on BuildContext {
  AppLocalizations get l10n => AppLocalizations.of(this);
}

/// The languages this app actually speaks - the ones lib/l10n has words for.
///
/// The shop's list (see [shopLanguagesProvider]) is narrowed to these: offering a language
/// the app has no translation for would hand the customer a half-French screen.
const supportedLanguages = [Locale('fr'), Locale('ar')];

/// The language the customer chose, kept in a small file of the app's own.
///
/// Not the secure store: it is not a secret, and reading the Keystore at every launch to learn
/// "ar" would be slow for nothing. Not the session either - the choice belongs to the phone
/// and survives signing out, so the sign-in screen is already in the right language.
class LanguageStore {
  Future<File> _file() async =>
      File('${(await getApplicationSupportDirectory()).path}/language.txt');

  /// The stored choice; otherwise Arabic on a phone set to Arabic, and French everywhere else.
  Future<Locale> initial() async {
    try {
      final file = await _file();
      if (await file.exists()) {
        final code = (await file.readAsString()).trim();
        if (code == 'ar' || code == 'fr') return Locale(code);
      }
    } on FileSystemException {
      // Unreadable: fall back to the phone's language.
    }
    return PlatformDispatcher.instance.locale.languageCode == 'ar'
        ? const Locale('ar')
        : const Locale('fr');
  }

  Future<void> save(Locale locale) async {
    try {
      await (await _file()).writeAsString(locale.languageCode, flush: true);
    } on FileSystemException {
      // The choice still applies for this session.
    }
  }
}

final languageStoreProvider = Provider<LanguageStore>((ref) => LanguageStore());

class LanguageNotifier extends Notifier<Locale> {
  LanguageNotifier([this._initial = const Locale('fr')]);

  final Locale _initial;

  @override
  Locale build() => _initial;

  Future<void> set(Locale locale) async {
    if (locale == state) return;
    state = locale;
    await ref.read(languageStoreProvider).save(locale);
  }
}

/// Overridden in main() with the language read from disk before the first frame, so the app
/// never paints a French frame and then flips to Arabic.
final languageProvider = NotifierProvider<LanguageNotifier, Locale>(
  LanguageNotifier.new,
);

/// Which languages the shop offers, and which one it considers its own.
///
/// `GET /languages` returns the enabled languages the back office configured; the app can
/// only honour those it has translations for, so the two lists are intersected. [fallback] is
/// where a customer lands when the language they had chosen stops being offered.
class ShopLanguages {
  const ShopLanguages({required this.locales, required this.fallback});

  /// Everything this app can show and this shop still offers. Never empty.
  final List<Locale> locales;

  /// The shop's default language, when it ships with the app; otherwise the first offered.
  final Locale fallback;

  /// What the app falls back to with no answer from the server: both of its own languages,
  /// French first, exactly as before this list existed.
  static const ShopLanguages shipped = ShopLanguages(
    locales: supportedLanguages,
    fallback: Locale('fr'),
  );
}

/// The shop's language list, read once per session.
///
/// Public endpoint, so it is asked before anyone signs in - the sign-in screen is the first
/// place the choice is offered. Any failure keeps the app's own two languages: a shop that
/// cannot be reached is not a shop that has switched Arabic off.
final shopLanguagesProvider = FutureProvider<ShopLanguages>((ref) async {
  final api = ref.watch(apiClientProvider);
  final data = await _languageRows(api.dio);
  if (data == null) return ShopLanguages.shipped;

  final offered = <Locale>[];
  Locale? serverDefault;
  for (final entry in data.whereType<Map<String, dynamic>>()) {
    // The endpoint already filters on `enabled`; checking it again costs nothing and keeps
    // the rule in the one place a reader looks for it.
    if (entry['enabled'] == false) continue;
    final code = (entry['isoCode'] as String?)?.trim().toLowerCase();
    final locale = supportedLanguages
        .where((l) => l.languageCode == code)
        .firstOrNull;
    if (locale == null || offered.contains(locale)) continue;
    offered.add(locale);
    if (entry['isDefault'] == true) serverDefault = locale;
  }

  if (offered.isEmpty) return ShopLanguages.shipped;
  return ShopLanguages(
    locales: offered,
    fallback: serverDefault ?? offered.first,
  );
});

/// The rows `GET /languages` answers with, or null when there is no usable answer.
///
/// Null rather than an exception: a shop that cannot be reached simply keeps the app's own
/// two languages, and nothing on screen has to react to a failure.
Future<List<dynamic>?> _languageRows(Dio dio) async {
  try {
    final response = await dio.get<List<dynamic>>('/languages');
    return response.statusCode == 200 ? response.data : null;
  } catch (_) {
    return null;
  }
}
