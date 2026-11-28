import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/i18n/language.dart';
import '../core/theme.dart';

/// The name of a language, written in that language.
///
/// Readable by the person who needs it: someone who reads only Arabic will not look for
/// "Arabe". Any language the app does not ship cannot reach these widgets, so the two cases
/// cover everything [ShopLanguages] can offer.
String _languageName(Locale locale, AppLocalizations l10n) =>
    locale.languageCode == 'ar' ? l10n.languageArabic : l10n.languageFrench;

/// The other language, one tap away.
///
/// Nothing at all when the shop offers only one: a button that switches to the language you
/// are already reading is a button that lies.
class LanguageToggle extends ConsumerWidget {
  const LanguageToggle({super.key, this.onDark = false});

  /// Drawn over the green header: white instead of green.
  final bool onDark;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final current = ref.watch(languageProvider);
    final offered =
        ref.watch(shopLanguagesProvider).value?.locales ??
        ShopLanguages.shipped.locales;
    final other = offered
        .where((l) => l.languageCode != current.languageCode)
        .firstOrNull;
    if (other == null) return const SizedBox.shrink();

    return TextButton.icon(
      onPressed: () => ref.read(languageProvider.notifier).set(other),
      icon: const Icon(Icons.translate, size: 18),
      label: Text(_languageName(other, context.l10n)),
      style: TextButton.styleFrom(
        foregroundColor: onDark ? Colors.white : AppTheme.emeraldDark,
      ),
    );
  }
}

/// Every language the shop offers, side by side, for the account page.
///
/// The row stays even when there is only one to show: "Langue : Français" is an answer, and
/// a settings card with a hole in it looks broken.
class LanguagePicker extends ConsumerWidget {
  const LanguagePicker({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final current = ref.watch(languageProvider);
    final l10n = context.l10n;
    // While the shop's list is on its way, or if it could not be had, the app's own two:
    // the customer must never be stuck with a language they cannot leave.
    final offered =
        ref.watch(shopLanguagesProvider).value?.locales ??
        ShopLanguages.shipped.locales;

    return Row(
      children: [
        const Icon(Icons.translate, size: 20, color: Colors.black54),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            l10n.language,
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
        ),
        if (offered.length < 2)
          Text(
            _languageName(current, l10n),
            style: const TextStyle(fontWeight: FontWeight.w700),
          )
        else
          SegmentedButton<String>(
            showSelectedIcon: false,
            segments: [
              for (final locale in offered)
                ButtonSegment(
                  value: locale.languageCode,
                  label: Text(_languageName(locale, l10n)),
                ),
            ],
            selected: {current.languageCode},
            onSelectionChanged: (choice) =>
                ref.read(languageProvider.notifier).set(Locale(choice.first)),
          ),
      ],
    );
  }
}
