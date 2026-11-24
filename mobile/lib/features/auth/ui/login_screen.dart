import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/env.dart';
import '../../../core/i18n/language.dart';
import '../../../core/providers.dart';
import '../../../core/theme.dart';
import '../data/auth_repository.dart';
import '../../../shared/language_switch.dart';
import 'auth_widgets.dart';
import 'forgot_password_screen.dart';
import 'signup_screen.dart';

/// Sign in with e-mail and password, as on the website.
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _signIn() async {
    if (!looksLikeEmail(_email.text)) {
      setState(() => _error = context.l10n.errEmailInvalid);
      return;
    }
    if (_password.text.isEmpty) {
      setState(() => _error = context.l10n.errPasswordMissing);
      return;
    }
    FocusScope.of(context).unfocus();
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final user = await ref
          .read(authRepositoryProvider)
          .login(email: _email.text, password: _password.text);
      ref.read(sessionProvider.notifier).set(Session.of(user));
    } on AuthFailure catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return AutofillGroup(
      child: AuthFrame(
        header: const _BrandHeader(),
        children: [
          AuthTitle(l10n.loginTitle, subtitle: l10n.loginSubtitle),
          if (_error != null) ErrorBanner(_error!),
          LabeledField(
            label: l10n.emailLabel,
            child: TextField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              autocorrect: false,
              textInputAction: TextInputAction.next,
              autofillHints: const [AutofillHints.email],
              decoration: const InputDecoration(
                hintText: 'vous@votre-commerce.ma',
                prefixIcon: Icon(Icons.alternate_email),
              ),
            ),
          ),
          LabeledField(
            label: l10n.passwordLabel,
            child: PasswordField(
              controller: _password,
              hint: l10n.passwordHint,
              onSubmitted: (_) => _busy ? null : _signIn(),
            ),
          ),
          Align(
            alignment: AlignmentDirectional.centerEnd,
            child: TextButton(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) =>
                      ForgotPasswordScreen(initialEmail: _email.text),
                ),
              ),
              style: TextButton.styleFrom(
                foregroundColor: AppTheme.emeraldDark,
              ),
              child: Text(l10n.forgotPasswordLink),
            ),
          ),
          const SizedBox(height: 8),
          BusyButton(label: l10n.signIn, busy: _busy, onPressed: _signIn),
          const SizedBox(height: 24),
          const Divider(),
          const SizedBox(height: 16),
          Text(
            l10n.noAccountYet,
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppTheme.muted),
          ),
          const SizedBox(height: 8),
          OutlinedButton(
            onPressed: () => Navigator.of(
              context,
            ).push(MaterialPageRoute(builder: (_) => const SignupScreen())),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size.fromHeight(50),
              foregroundColor: AppTheme.emeraldDark,
              side: const BorderSide(color: AppTheme.emeraldDark),
            ),
            child: Text(
              l10n.requestAccount,
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
          ),
          // Only on a build pointed at a developer machine. "It does not connect" is nearly
          // always the wrong address, and the address is invisible otherwise.
          if (Env.isLocal) ...[
            const SizedBox(height: 24),
            Text(
              Env.apiBaseUrl,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 11, color: Colors.black26),
            ),
          ],
        ],
      ),
    );
  }
}

/// The brand, in the website header's forest green, above the form.
class _BrandHeader extends StatelessWidget {
  const _BrandHeader();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 20),
      decoration: const BoxDecoration(
        gradient: AppTheme.forestGradient,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(32)),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 4, 8, 32),
          child: Column(
            children: [
              // Before anything else: someone who reads only Arabic must not have to get
              // through a French form to find the switch.
              const Align(
                alignment: AlignmentDirectional.centerEnd,
                child: LanguageToggle(onDark: true),
              ),
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  // cacheWidth: the source is 1024 px for the store; shown at 76, decoded at 228.
                  child: Image.asset(
                    'assets/icon/app_icon.png',
                    width: 76,
                    height: 76,
                    cacheWidth: 228,
                    filterQuality: FilterQuality.medium,
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Text(
                'Market Food',
                style: AppTheme.display(
                  context,
                  size: 30,
                  colour: Colors.white,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                context.l10n.heroTitle,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: AppTheme.brassLight,
                  fontSize: 13.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
