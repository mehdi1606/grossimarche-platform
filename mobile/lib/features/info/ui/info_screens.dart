import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/env.dart';
import '../../../core/i18n/language.dart';
import '../../../core/theme.dart';

/// Market Food's own details - the same ones the website's contact page and footer show.
class ShopContact {
  const ShopContact._();

  static const phone = '+212 605 477 544';
  static const phoneDigits = '212605477544';
  static const email = 'marketfood98@gmail.com';
}

/// Open a link in the phone's own app (dialler, WhatsApp, mail, maps, browser), saying so if
/// nothing on the phone can.
Future<void> openLink(
  BuildContext context,
  Uri uri, {
  LaunchMode mode = LaunchMode.externalApplication,
}) async {
  final messenger = ScaffoldMessenger.of(context);
  final failure = context.l10n.contactOpenError;
  var opened = false;
  try {
    opened = await launchUrl(uri, mode: mode);
  } catch (_) {
    opened = false;
  }
  if (!opened) messenger.showSnackBar(SnackBar(content: Text(failure)));
}

/// The terms and the privacy notice are the website's pages, shown in an in-app browser:
/// one text, kept in one place, and the very address the Play Store listing points to.
Future<void> openSitePage(BuildContext context, String path) =>
    openLink(context, Env.site(path), mode: LaunchMode.inAppBrowserView);

/// How to reach Market Food: every line opens the right app, one tap.
///
/// No message form. The website's contact form shows "message sent" without sending anything;
/// a form that does nothing is worse than none, and a shopkeeper with a problem would rather
/// call or write on WhatsApp anyway.
class ContactScreen extends StatelessWidget {
  const ContactScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    Widget line(
      IconData icon,
      String label,
      String value,
      Uri uri, {
      Color? colour,
    }) => Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(
        side: const BorderSide(color: AppTheme.line),
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: (colour ?? AppTheme.emeraldDark).withValues(
            alpha: 0.1,
          ),
          child: Icon(icon, color: colour ?? AppTheme.emeraldDark),
        ),
        title: Text(
          label,
          style: const TextStyle(fontSize: 12.5, color: AppTheme.muted),
        ),
        // Numbers and addresses read left to right in any language.
        subtitle: Text(
          value,
          textDirection: TextDirection.ltr,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: AppTheme.ink,
          ),
        ),
        trailing: const Icon(
          Icons.open_in_new,
          size: 18,
          color: Colors.black26,
        ),
        onTap: () => openLink(context, uri),
      ),
    );

    return Scaffold(
      appBar: AppBar(title: Text(l10n.contactTitle)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            l10n.contactIntro,
            style: const TextStyle(color: AppTheme.muted, height: 1.5),
          ),
          const SizedBox(height: 18),
          line(
            Icons.call_outlined,
            l10n.contactPhone,
            ShopContact.phone,
            Uri(scheme: 'tel', path: '+${ShopContact.phoneDigits}'),
          ),
          line(
            Icons.chat_outlined,
            l10n.contactWhatsapp,
            ShopContact.phone,
            Uri.parse('https://wa.me/${ShopContact.phoneDigits}'),
            colour: const Color(0xFF16A34A),
          ),
          line(
            Icons.mail_outline,
            l10n.contactEmail,
            ShopContact.email,
            Uri(scheme: 'mailto', path: ShopContact.email),
          ),
          Card(
            elevation: 0,
            margin: const EdgeInsets.only(bottom: 10),
            shape: RoundedRectangleBorder(
              side: const BorderSide(color: AppTheme.line),
              borderRadius: BorderRadius.circular(12),
            ),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: AppTheme.emeraldDark.withValues(alpha: 0.1),
                child: const Icon(
                  Icons.place_outlined,
                  color: AppTheme.emeraldDark,
                ),
              ),
              title: Text(
                l10n.contactAddress,
                style: const TextStyle(fontSize: 12.5, color: AppTheme.muted),
              ),
              subtitle: Text(
                '${l10n.contactAddressLine1}\n${l10n.contactAddressLine2}',
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.ink,
                ),
              ),
              trailing: const Icon(
                Icons.open_in_new,
                size: 18,
                color: Colors.black26,
              ),
              onTap: () => openLink(
                context,
                Uri.https('www.google.com', '/maps/search/', {
                  'api': '1',
                  'query': 'EL Alia N 141, Mohammedia, Maroc',
                }),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// The website's questions and answers, in the app's two languages.
class FaqScreen extends StatelessWidget {
  const FaqScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final entries = [
      (l10n.faqQOrder, l10n.faqAOrder),
      (l10n.faqQCod, l10n.faqACod),
      (l10n.faqQTiers, l10n.faqATiers),
      (l10n.faqQDelivery, l10n.faqADelivery),
      (l10n.faqQMinimum, l10n.faqAMinimum),
      (l10n.faqQPromo, l10n.faqAPromo),
      (l10n.faqQTracking, l10n.faqATracking),
      (l10n.faqQContact, l10n.faqAContact),
    ];
    return Scaffold(
      appBar: AppBar(title: Text(l10n.faqTitle)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            l10n.faqIntro,
            style: const TextStyle(color: AppTheme.muted, height: 1.5),
          ),
          const SizedBox(height: 12),
          for (final (question, answer) in entries)
            Card(
              elevation: 0,
              margin: const EdgeInsets.only(bottom: 8),
              clipBehavior: Clip.antiAlias,
              shape: RoundedRectangleBorder(
                side: const BorderSide(color: AppTheme.line),
                borderRadius: BorderRadius.circular(12),
              ),
              child: ExpansionTile(
                shape: const Border(),
                title: Text(
                  question,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
                expandedCrossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    answer,
                    style: const TextStyle(height: 1.5, color: AppTheme.ink700),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
