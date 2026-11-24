import 'package:flutter/widgets.dart';
import 'package:intl/intl.dart';

/// Dates in the screen's language: "12 oct. 2026 à 14:30" / "12 أكتوبر 2026، 14:30".
///
/// Kept here rather than as patterns in each screen: the French "à" is a word, not a format,
/// and an Arabic screen showing it would look half-translated.
class Dates {
  const Dates._();

  static String _lang(BuildContext context) =>
      Localizations.localeOf(context).languageCode;

  /// 12 oct. 2026
  static String day(BuildContext context, DateTime at) =>
      DateFormat('d MMM y', _lang(context)).format(at);

  /// Octobre 2026 - a heading over the orders of one month.
  static String monthYear(BuildContext context, DateTime at) {
    final text = DateFormat('MMMM y', _lang(context)).format(at);
    return text.isEmpty ? text : text[0].toUpperCase() + text.substring(1);
  }

  /// 14:30
  static String time(BuildContext context, DateTime at) =>
      DateFormat('HH:mm', _lang(context)).format(at);

  /// 12 octobre
  static String dayMonth(BuildContext context, DateTime at) =>
      DateFormat('d MMMM', _lang(context)).format(at);

  /// 12 oct. 2026 à 14:30
  static String dayTime(BuildContext context, DateTime at) =>
      _lang(context) == 'ar'
      ? DateFormat("d MMM y، HH:mm", 'ar').format(at)
      : DateFormat("d MMM y 'à' HH:mm", 'fr').format(at);

  /// 12 oct. à 14:30
  static String shortDayTime(BuildContext context, DateTime at) =>
      _lang(context) == 'ar'
      ? DateFormat("d MMM، HH:mm", 'ar').format(at)
      : DateFormat("d MMM 'à' HH:mm", 'fr').format(at);
}
