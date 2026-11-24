import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';

/// Arabic for what the server sends in French: product, category and offer names, product
/// descriptions, and the server's own error sentences.
///
/// The app's fixed words are translated by hand in lib/l10n. What comes from the catalogue
/// cannot be: it changes every day in the back office, in French only. This asks the shop's
/// own translation service (`POST /translate`, the one the website uses) and keeps every answer
/// on the phone, so each name is translated once - not at every scroll, and not again after a
/// restart.
///
/// Best-effort by design: while an answer is on its way, or if the service is down, the French
/// is shown. A customer reading a French product name is inconvenienced; a customer staring at
/// an empty card is lost.
class ContentTranslator extends ChangeNotifier {
  ContentTranslator(this._dio, {this.target = 'ar'}) {
    _load();
  }

  final Dio _dio;
  final String target;

  /// French -> Arabic. Starts with the app's own fallback messages, translated by hand: they
  /// are known in advance, so there is no reason to leave them to a machine.
  final Map<String, String> _done = Map.of(_handTranslated);

  final Set<String> _queued = {};
  final Set<String> _inFlight = {};

  /// Strings the service gave back unchanged or failed on too often: shown in French for the
  /// rest of the session rather than asked for again and again.
  final Map<String, int> _attempts = {};
  static const _maxAttempts = 3;

  Timer? _flushTimer;
  Timer? _saveTimer;
  DateTime? _pausedUntil;

  /// Strings per request. The server caps at 100 and rate-limits per minute; 40 keeps a
  /// screenful of products to one request.
  static const _batch = 40;
  static const _maxStored = 6000;

  /// The translation of [text], or [text] itself until one is known. Asking is what schedules
  /// the request; listeners are told when the answer arrives.
  String translate(String text) {
    final key = text.trim();
    if (!_translatable(key)) return text;
    final known = _done[key];
    if (known != null) return known;
    if ((_attempts[key] ?? 0) < _maxAttempts &&
        !_queued.contains(key) &&
        !_inFlight.contains(key)) {
      _queued.add(key);
      _schedule(const Duration(milliseconds: 120));
    }
    return text;
  }

  /// An Arabic search, in the catalogue's French. Anything else is returned as typed - and so
  /// is the Arabic if the service cannot answer, rather than blocking the search.
  Future<String> toFrench(String text) async {
    final query = text.trim();
    if (!_arabic.hasMatch(query)) return text;
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/translate',
        data: {
          'q': [query],
          'source': target,
          'target': 'fr',
        },
        options: Options(extra: {'skipAuth': true, 'retried': true}),
      );
      final out = (response.data?['translatedText'] as List?)?.cast<Object?>();
      final french = (out != null && out.isNotEmpty)
          ? (out.first as String?)?.trim()
          : null;
      return (french == null || french.isEmpty) ? text : french;
    } catch (_) {
      return text;
    }
  }

  void _schedule(Duration delay) {
    if (_flushTimer?.isActive ?? false) return;
    _flushTimer = Timer(delay, _flush);
  }

  Future<void> _flush() async {
    if (_queued.isEmpty) return;
    final paused = _pausedUntil;
    if (paused != null && DateTime.now().isBefore(paused)) {
      _schedule(paused.difference(DateTime.now()));
      return;
    }

    final batch = _queued.take(_batch).toList();
    _queued.removeAll(batch);
    _inFlight.addAll(batch);
    if (_queued.isNotEmpty) _schedule(const Duration(milliseconds: 50));

    var changed = false;
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/translate',
        data: {'q': batch, 'source': 'fr', 'target': target},
        // Public endpoint: no token to attach, and nothing to refresh if it is refused.
        options: Options(extra: {'skipAuth': true, 'retried': true}),
      );
      final out = (response.data?['translatedText'] as List?)?.cast<Object?>();
      if (response.statusCode != 200 ||
          out == null ||
          out.length != batch.length) {
        throw StateError('translate ${response.statusCode}');
      }
      for (var i = 0; i < batch.length; i++) {
        final source = batch[i];
        final result = (out[i] as String?)?.trim() ?? '';
        // The service returns the French unchanged when it is not ready yet; that is not a
        // translation, and must not be remembered as one.
        if (result.isEmpty || result == source) {
          _attempts[source] = (_attempts[source] ?? 0) + 1;
        } else {
          _done[source] = result;
          changed = true;
        }
      }
    } catch (_) {
      // Down or rate-limited: wait, then try what is still wanted.
      for (final s in batch) {
        _attempts[s] = (_attempts[s] ?? 0) + 1;
        if (_attempts[s]! < _maxAttempts) _queued.add(s);
      }
      _pausedUntil = DateTime.now().add(const Duration(seconds: 20));
      _schedule(const Duration(seconds: 20));
    } finally {
      _inFlight.removeAll(batch);
    }

    if (changed) {
      notifyListeners();
      _saveSoon();
    }
  }

  // ---- The cache on the phone --------------------------------------------------------------

  Future<File> _file() async => File(
    '${(await getApplicationSupportDirectory()).path}/translations_$target.json',
  );

  Future<void> _load() async {
    try {
      final file = await _file();
      if (!await file.exists()) return;
      final stored = (jsonDecode(await file.readAsString()) as Map)
          .cast<String, Object?>();
      var added = false;
      for (final entry in stored.entries) {
        final value = entry.value;
        if (value is String && !_done.containsKey(entry.key)) {
          _done[entry.key] = value;
          added = true;
        }
      }
      if (added) notifyListeners();
    } catch (_) {
      // A corrupt cache is only a slower start: everything is asked for again.
    }
  }

  void _saveSoon() {
    _saveTimer?.cancel();
    _saveTimer = Timer(const Duration(seconds: 2), () async {
      try {
        final learnt = Map.fromEntries(
          _done.entries.where((e) => !_handTranslated.containsKey(e.key)),
        );
        // Bounded: the newest entries are the ones still in the catalogue.
        final kept = learnt.length <= _maxStored
            ? learnt
            : Map.fromEntries(learnt.entries.skip(learnt.length - _maxStored));
        await (await _file()).writeAsString(jsonEncode(kept), flush: true);
      } catch (_) {
        // Not saved: translated again next launch.
      }
    });
  }

  @override
  void dispose() {
    _flushTimer?.cancel();
    _saveTimer?.cancel();
    super.dispose();
  }

  // ---- What is worth sending ---------------------------------------------------------------

  static final _letter = RegExp(r'\p{L}', unicode: true);
  static final _arabic = RegExp(r'[؀-ۿ]');

  /// Short all-caps tokens are codes, not words: DH, TTC, an order reference.
  static final _code = RegExp(r'^[\p{Lu}0-9€$.\-]{1,6}$', unicode: true);

  @visibleForTesting
  static bool translatable(String text) => _translatable(text);

  static bool _translatable(String text) =>
      text.length > 1 &&
      text.length <= 2000 &&
      _letter.hasMatch(text) &&
      !_arabic.hasMatch(text) &&
      !_code.hasMatch(text);
}

/// The French the app itself puts in errors (repositories, network failures), already in
/// Arabic. The server's own sentences are left to the translation service.
const _handTranslated = <String, String>{
  'Impossible de joindre le serveur.': 'تعذّر الاتصال بالخادم.',
  'Impossible de joindre le serveur. Vérifiez votre connexion.':
      'تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.',
  'Le serveur met trop de temps à répondre.':
      'الخادم يستغرق وقتاً طويلاً للرد.',
  'Le serveur met trop de temps à répondre. Vérifiez votre connexion.':
      'الخادم يستغرق وقتاً طويلاً للرد. تحقق من اتصالك بالإنترنت.',
  'Le serveur met trop de temps à répondre. Vérifiez vos commandes avant de réessayer.':
      'الخادم يستغرق وقتاً طويلاً للرد. تحقق من طلباتك قبل إعادة المحاولة.',
  'Une erreur est survenue.': 'حدث خطأ.',
  'Une erreur est survenue. Réessayez.': 'حدث خطأ. أعد المحاولة.',
  'Une erreur réseau est survenue. Réessayez.':
      'حدث خطأ في الشبكة. أعد المحاولة.',
  'Cette commande est introuvable.': 'هذا الطلب غير موجود.',
  'Cette offre n\'est plus disponible.': 'هذا العرض لم يعد متاحاً.',
  'Ce produit n\'existe plus.': 'هذا المنتج لم يعد موجوداً.',
  'Code promo invalide.': 'رمز الخصم غير صالح.',
  'Impossible de charger les activités.': 'تعذّر تحميل الأنشطة.',
  'Le panier n\'a pas pu être mis à jour.': 'تعذّر تحديث السلة.',
  'La commande n\'a pas pu être envoyée.': 'تعذّر إرسال الطلب.',
  'La facture n\'a pas pu être téléchargée.': 'تعذّر تحميل الفاتورة.',
  'Vos commandes n\'ont pas pu être chargées.': 'تعذّر تحميل طلباتك.',
  'Le mot de passe n\'a pas pu être changé.': 'تعذّر تغيير كلمة المرور.',
  'Le compte n\'a pas pu être supprimé.': 'تعذّر حذف الحساب.',
  'Le catalogue n\'a pas pu être chargé.': 'تعذّر تحميل الكتالوج.',
  'L\'adresse n\'a pas pu être enregistrée.': 'تعذّر حفظ العنوان.',
  'Les offres n\'ont pas pu être chargées.': 'تعذّر تحميل العروض.',
  'Ce compte appartient à l\'équipe Market Food. L\'application est réservée aux clients : '
          'connectez-vous au back-office depuis un navigateur.':
      'هذا الحساب تابع لفريق ماركت فود. التطبيق مخصّص للزبناء: سجّل الدخول إلى لوحة الإدارة من المتصفح.',
  // Frequent server sentences, so the most common refusals read well even before the
  // translation service has warmed up.
  'E-mail ou mot de passe incorrect.':
      'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  'Mot de passe actuel incorrect.': 'كلمة المرور الحالية غير صحيحة.',
  'Le code saisi est incorrect.': 'الرمز المُدخل غير صحيح.',
  'Ce code promo a expiré.': 'انتهت صلاحية رمز الخصم هذا.',
  'Vous avez déjà utilisé ce code promo.': 'لقد استعملت رمز الخصم هذا من قبل.',
  'Trop de demandes. Réessayez plus tard.': 'طلبات كثيرة. أعد المحاولة لاحقاً.',
  'Trop de demandes. Veuillez réessayer plus tard.':
      'طلبات كثيرة. يرجى إعادة المحاولة لاحقاً.',
};
