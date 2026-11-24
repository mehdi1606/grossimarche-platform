import 'package:flutter/material.dart';

import '../../../core/i18n/language.dart';
import '../../../core/theme.dart';
import 'auth_widgets.dart';

/// After applying: the account exists, and waits for Market Food to recognise the business.
class PendingScreen extends StatelessWidget {
  const PendingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AuthFrame(
      children: [
        const SizedBox(height: 24),
        Center(
          child: Container(
            width: 84,
            height: 84,
            decoration: const BoxDecoration(
              color: AppTheme.forest50,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.mark_email_read_outlined,
              size: 42,
              color: AppTheme.emeraldDark,
            ),
          ),
        ),
        const SizedBox(height: 22),
        Text(
          context.l10n.pendingTitle,
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 12),
        Text(
          context.l10n.pendingThanks,
          textAlign: TextAlign.center,
          style: const TextStyle(color: AppTheme.ink700, height: 1.5),
        ),
        const SizedBox(height: 10),
        Text(
          context.l10n.pendingDetail,
          textAlign: TextAlign.center,
          style: const TextStyle(color: AppTheme.muted, height: 1.5),
        ),
        const SizedBox(height: 28),
        BusyButton(
          label: context.l10n.backToLogin,
          busy: false,
          onPressed: () => Navigator.of(context).popUntil((r) => r.isFirst),
        ),
      ],
    );
  }
}
