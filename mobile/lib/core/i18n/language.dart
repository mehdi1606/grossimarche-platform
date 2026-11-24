import 'dart:io';
import 'dart:ui';

import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';

import '../../l10n/app_localizations.dart';

export '../../l10n/app_localizations.dart';

/// The app's own words in the current language: `context.l10n.signIn`.
extension L10nContext on BuildContext {
  AppLocalizations get l10n => AppLocalizations.of(this);
}

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
