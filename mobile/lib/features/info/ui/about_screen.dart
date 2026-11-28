import 'package:flutter/material.dart';

import '../../../core/i18n/language.dart';
import '../../../core/theme.dart';
import 'info_screens.dart';

/// What Market Food is, who it sells to, and how buying here works.
///
/// The website has the same page; the app's version says the two things a shopkeeper reading
/// it on a phone actually needs settled before their first order - that the price depends on
/// the quantity, and that nothing is paid online - and then gets out of the way.
///
/// The words are the app's own (lib/l10n), not the website's HTML in a web view: a page of
/// text is exactly what translating by hand is for, and it opens with no network at all.
class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.aboutTitle)),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
        children: [
          // The same forest-and-brass banner the catalogue greets a browsing customer with,
          // so the page reads as part of the shop rather than as a legal annex.
          Container(
            padding: const EdgeInsets.fromLTRB(18, 20, 18, 18),
            decoration: BoxDecoration(
              gradient: AppTheme.forestGradient,
              borderRadius: BorderRadius.circular(20),
              boxShadow: AppTheme.shadow,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.aboutHeroTitle,
                  style: AppTheme.display(
                    context,
                    size: 22,
                    colour: Colors.white,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  l10n.aboutHeroText,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13.5,
                    height: 1.6,
                  ),
                ),
                const SizedBox(height: 16),
                Container(height: 1, color: Colors.white24),
                const SizedBox(height: 12),
                Text(
                  l10n.aboutMissionTitle.toUpperCase(),
                  style: AppTheme.eyebrow.copyWith(color: AppTheme.brassLight),
                ),
                const SizedBox(height: 6),
                Text(
                  l10n.aboutMissionText,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 13,
                    height: 1.55,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 22),
          Text(l10n.aboutHowTitle.toUpperCase(), style: AppTheme.eyebrow),
          const SizedBox(height: 10),
          _Point(
            icon: Icons.storefront_outlined,
            title: l10n.aboutWhoTitle,
            text: l10n.aboutWhoText,
          ),
          // Brass, like every other place the ladder is mentioned.
          _Point(
            icon: Icons.trending_down,
            title: l10n.aboutTiersTitle,
            text: l10n.aboutTiersText,
            colour: AppTheme.brass,
          ),
          _Point(
            icon: Icons.payments_outlined,
            title: l10n.aboutCodTitle,
            text: l10n.aboutCodText,
          ),
          _Point(
            icon: Icons.local_shipping_outlined,
            title: l10n.aboutDeliveryTitle,
            text: l10n.aboutDeliveryText,
          ),
          _Point(
            icon: Icons.support_agent,
            title: l10n.aboutTeamTitle,
            text: l10n.aboutTeamText,
          ),

          const SizedBox(height: 8),
          // The page ends where its reader's next question goes: a person to ask.
          Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const ContactScreen()),
              ),
              child: Ink(
                padding: const EdgeInsetsDirectional.fromSTEB(16, 14, 12, 14),
                decoration: AppTheme.card(radius: 16),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            l10n.aboutContactTitle,
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 14.5,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            l10n.aboutContactText,
                            style: const TextStyle(
                              fontSize: 12.5,
                              color: AppTheme.muted,
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Icon(Icons.chevron_right, color: AppTheme.muted),
                  ],
                ),
              ),
            ),
          ),

          const SizedBox(height: 18),
          Center(
            child: Text(
              '${l10n.contactAddressLine1} · ${l10n.contactAddressLine2}',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12, color: AppTheme.muted),
            ),
          ),
        ],
      ),
    );
  }
}

/// One thing worth knowing before ordering: an icon, a claim, and the sentence that backs it.
class _Point extends StatelessWidget {
  const _Point({
    required this.icon,
    required this.title,
    required this.text,
    this.colour = AppTheme.emeraldDark,
  });

  final IconData icon;
  final String title;
  final String text;
  final Color colour;

  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 10),
    padding: const EdgeInsets.all(14),
    decoration: AppTheme.card(radius: 16),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 40,
          height: 40,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: colour == AppTheme.brass
                ? AppTheme.brass50
                : AppTheme.forest50,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, size: 20, color: colour),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 14.5,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                text,
                style: const TextStyle(
                  fontSize: 13,
                  color: AppTheme.ink700,
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}
