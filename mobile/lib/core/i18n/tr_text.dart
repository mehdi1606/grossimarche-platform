import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers.dart';
import 'content_translator.dart';

final contentTranslatorProvider = Provider<ContentTranslator>((ref) {
  final translator = ContentTranslator(ref.watch(apiClientProvider).dio);
  ref.onDispose(translator.dispose);
  return translator;
});

/// A text that comes from the server in French - a product name, a category, an error - shown
/// in the customer's language.
///
/// In French it is a plain [Text]. In Arabic it shows the French until the translation is
/// known, then redraws; see [ContentTranslator]. [format] wraps the translated value in one of
/// the app's own sentences: `TrText(name, format: (n) => l10n.addedToCart(n))`.
class TrText extends ConsumerWidget {
  const TrText(
    this.text, {
    super.key,
    this.format,
    this.style,
    this.maxLines,
    this.overflow,
    this.textAlign,
  });

  final String text;
  final String Function(String value)? format;
  final TextStyle? style;
  final int? maxLines;
  final TextOverflow? overflow;
  final TextAlign? textAlign;

  Widget _build(String value) => Text(
    format?.call(value) ?? value,
    style: style,
    maxLines: maxLines,
    overflow: overflow,
    textAlign: textAlign,
  );

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (Localizations.localeOf(context).languageCode == 'fr') {
      return _build(text);
    }
    final translator = ref.watch(contentTranslatorProvider);
    return ListenableBuilder(
      listenable: translator,
      builder: (context, _) => _build(translator.translate(text)),
    );
  }
}
