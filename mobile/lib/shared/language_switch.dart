import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/i18n/language.dart';
import '../core/theme.dart';

/// The other language, one tap away: "العربية" on a French screen, "Français" on an Arabic
/// one. Each label is written in its own language, so it is readable by the person who needs
/// it - someone who reads only Arabic will not look for "Arabe".
class LanguageToggle extends ConsumerWidget {
  const LanguageToggle({super.key, this.onDark = false});

  /// Drawn over the green header: white instead of green.
  final bool onDark;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final current = ref.watch(languageProvider);
    final other = current.languageCode == 'ar'
        ? const Locale('fr')
        : const Locale('ar');
    return TextButton.icon(
      onPressed: () => ref.read(languageProvider.notifier).set(other),
      icon: const Icon(Icons.translate, size: 18),
      label: Text(
        other.languageCode == 'ar'
            ? context.l10n.languageArabic
            : context.l10n.languageFrench,
      ),
      style: TextButton.styleFrom(
        foregroundColor: onDark ? Colors.white : AppTheme.emeraldDark,
      ),
    );
  }
}

/// Both languages side by side, for the account page.
class LanguagePicker extends ConsumerWidget {
  const LanguagePicker({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final current = ref.watch(languageProvider);
    return Row(
      children: [
        const Icon(Icons.translate, size: 20, color: Colors.black54),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            context.l10n.language,
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
        ),
        SegmentedButton<String>(
          showSelectedIcon: false,
          segments: [
            ButtonSegment(
              value: 'fr',
              label: Text(context.l10n.languageFrench),
            ),
            ButtonSegment(
              value: 'ar',
              label: Text(context.l10n.languageArabic),
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
