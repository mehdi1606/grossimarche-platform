import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Market Food's look, taken from the storefront's design tokens (tailwind.config.js) so the
/// app and the website read as one premium wholesale house rather than a grocery template.
///
/// The names `emerald`, `emeraldDark`, `ink`, `line` and `cream` are kept from the first
/// version but now carry the website's colours - deep forest green, warm cream, warm lines -
/// so every screen that already used them moved to the new palette at once, the same trick the
/// storefront used when it remapped its own `emerald` scale.
///
/// Material everywhere, iOS included: one interface to keep right, for buyers who care that
/// the order goes through, not that the switches look native.
class AppTheme {
  const AppTheme._();

  // ---- Brand green (storefront `emerald` scale) ------------------------------------------
  static const Color forest50 = Color(0xFFF2F7F3);
  static const Color forest100 = Color(0xFFE1EDE4);
  static const Color forest200 = Color(0xFFC2D9C8);
  static const Color emerald = Color(0xFF3F7355); // 500
  static const Color emeraldDark = Color(
    0xFF2F5B43,
  ); // 600 - buttons, prices, links
  static const Color forest700 = Color(0xFF264936);
  static const Color forest900 = Color(0xFF172C21);

  // ---- Brass: used sparingly - discounts, price tiers, "premium" markers --------------
  static const Color brass = Color(0xFFAC853B);
  static const Color brassLight = Color(0xFFD9B876);
  static const Color brass50 = Color(0xFFFBF7EF);
  static const Color brass100 = Color(0xFFF4EAD4);

  // ---- Warm neutrals ------------------------------------------------------------------------
  static const Color cream = Color(0xFFFBF9F5); // the page
  static const Color sand = Color(0xFFF4F1EA); // recessed surfaces, image wells
  static const Color line = Color(0xFFE8E3D8);
  static const Color ink = Color(0xFF15150F);
  static const Color ink700 = Color(0xFF3B3B36);
  static const Color muted = Color(0xFF6B6B63);

  static const Color danger = Color(0xFFB42318);

  /// The storefront's "luxe" shadow: soft, wide, low - never a hard drop shadow.
  static const List<BoxShadow> shadow = [
    BoxShadow(color: Color(0x0A15150F), blurRadius: 2, offset: Offset(0, 1)),
    BoxShadow(
      color: Color(0x1415150F),
      blurRadius: 24,
      spreadRadius: -12,
      offset: Offset(0, 8),
    ),
  ];

  static const List<BoxShadow> shadowLarge = [
    BoxShadow(color: Color(0x0A15150F), blurRadius: 4, offset: Offset(0, 2)),
    BoxShadow(
      color: Color(0x2E15150F),
      blurRadius: 48,
      spreadRadius: -20,
      offset: Offset(0, 24),
    ),
  ];

  /// A white card on the cream page.
  static BoxDecoration card({
    double radius = 18,
    Color colour = Colors.white,
  }) => BoxDecoration(
    color: colour,
    borderRadius: BorderRadius.circular(radius),
    border: Border.all(color: line.withValues(alpha: 0.7)),
    boxShadow: shadow,
  );

  /// The deep green of the website's header, as a gradient.
  static const LinearGradient forestGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [forest700, emeraldDark, emerald],
  );

  static bool _arabic(Locale locale) => locale.languageCode == 'ar';

  /// Headings. Fraunces, the storefront's display serif, in French; Arabic has no Fraunces
  /// glyphs, so its headings use the Arabic face, heavier.
  static TextStyle display(
    BuildContext context, {
    double size = 24,
    Color colour = ink,
    FontWeight weight = FontWeight.w600,
  }) {
    final style = TextStyle(
      fontSize: size,
      color: colour,
      fontWeight: weight,
      height: 1.15,
    );
    return _arabic(Localizations.localeOf(context))
        ? GoogleFonts.ibmPlexSansArabic(
            textStyle: style.copyWith(fontWeight: FontWeight.w700),
          )
        : GoogleFonts.fraunces(textStyle: style);
  }

  /// The small capitals over a section: "ADRESSES DE LIVRAISON".
  static const TextStyle eyebrow = TextStyle(
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: FontWeight.w700,
    color: muted,
  );

  static ThemeData light(Locale locale) {
    final scheme =
        ColorScheme.fromSeed(
          seedColor: emerald,
          brightness: Brightness.light,
        ).copyWith(
          primary: emeraldDark,
          onPrimary: Colors.white,
          secondary: brass,
          surface: cream,
          onSurface: ink,
          outline: line,
          outlineVariant: line,
          error: danger,
        );

    final base = ThemeData(useMaterial3: true, colorScheme: scheme);
    final text = _arabic(locale)
        ? GoogleFonts.ibmPlexSansArabicTextTheme(base.textTheme)
        : GoogleFonts.interTextTheme(base.textTheme);
    final body = text.apply(bodyColor: ink, displayColor: ink);
    final titleFont = _arabic(locale)
        ? GoogleFonts.ibmPlexSansArabic(fontWeight: FontWeight.w700)
        : GoogleFonts.fraunces(fontWeight: FontWeight.w600);

    OutlineInputBorder border(Color colour, [double width = 1]) =>
        OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: colour, width: width),
        );

    return base.copyWith(
      scaffoldBackgroundColor: cream,
      textTheme: body,
      dividerColor: line,
      dividerTheme: const DividerThemeData(color: line, thickness: 1),
      splashFactory: InkSparkle.splashFactory,
      appBarTheme: AppBarTheme(
        backgroundColor: cream,
        surfaceTintColor: Colors.transparent,
        foregroundColor: ink,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: titleFont.copyWith(fontSize: 22, color: ink),
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: BorderSide(color: line.withValues(alpha: 0.7)),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        height: 68,
        indicatorColor: forest100,
        indicatorShape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
        ),
        iconTheme: WidgetStateProperty.resolveWith(
          (states) => IconThemeData(
            color: states.contains(WidgetState.selected) ? emeraldDark : muted,
            size: 24,
          ),
        ),
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => body.labelMedium!.copyWith(
            fontSize: 11.5,
            fontWeight: states.contains(WidgetState.selected)
                ? FontWeight.w700
                : FontWeight.w500,
            color: states.contains(WidgetState.selected) ? emeraldDark : muted,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        hintStyle: const TextStyle(color: Color(0xFF8C8C84)),
        prefixIconColor: muted,
        suffixIconColor: muted,
        border: border(line),
        enabledBorder: border(line),
        focusedBorder: border(emeraldDark, 1.6),
        errorBorder: border(danger),
        focusedErrorBorder: border(danger, 1.6),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: emeraldDark,
          foregroundColor: Colors.white,
          disabledBackgroundColor: line,
          disabledForegroundColor: muted,
          // A thumb is not a mouse pointer: 52 is comfortable for someone ordering with one
          // hand while holding a crate with the other.
          minimumSize: const Size.fromHeight(52),
          textStyle: body.labelLarge!.copyWith(
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          elevation: 0,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: emeraldDark,
          backgroundColor: Colors.white,
          side: const BorderSide(color: line),
          minimumSize: const Size(48, 48),
          textStyle: body.labelLarge!.copyWith(
            fontSize: 15,
            fontWeight: FontWeight.w700,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: emeraldDark,
          textStyle: body.labelLarge!.copyWith(fontWeight: FontWeight.w700),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: Colors.white,
        selectedColor: emeraldDark,
        side: const BorderSide(color: line),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
        labelStyle: body.labelLarge!.copyWith(
          fontWeight: FontWeight.w600,
          color: ink,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
      segmentedButtonTheme: SegmentedButtonThemeData(
        style: SegmentedButton.styleFrom(
          backgroundColor: Colors.white,
          selectedBackgroundColor: emeraldDark,
          selectedForegroundColor: Colors.white,
          foregroundColor: ink700,
          side: const BorderSide(color: line),
          textStyle: body.labelLarge!.copyWith(fontWeight: FontWeight.w700),
        ),
      ),
      listTileTheme: const ListTileThemeData(iconColor: emeraldDark),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: emeraldDark,
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: cream,
        surfaceTintColor: Colors.transparent,
        showDragHandle: true,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        titleTextStyle: titleFont.copyWith(fontSize: 20, color: ink),
      ),
      popupMenuTheme: PopupMenuThemeData(
        color: Colors.white,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: forest900,
        contentTextStyle: body.bodyMedium!.copyWith(color: Colors.white),
        actionTextColor: brassLight,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    );
  }
}
