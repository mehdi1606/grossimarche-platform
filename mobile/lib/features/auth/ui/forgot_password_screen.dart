import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/i18n/language.dart';
import '../../../core/providers.dart';
import '../../../core/theme.dart';
import '../data/auth_repository.dart';
import 'auth_widgets.dart';

enum _Step { email, code, password }

/// A forgotten password, in the website's three steps: the address, the code it receives,
/// then the new password.
///
/// The code is checked before the new password is asked for. Asking for both at once means a
/// mistyped code throws away a carefully chosen password, and the customer types it twice
/// more for nothing.
class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key, this.initialEmail = ''});

  final String initialEmail;

  @override
  ConsumerState<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  late final _email = TextEditingController(text: widget.initialEmail);
  final _code = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();

  _Step _step = _Step.email;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    for (final c in [_email, _code, _password, _confirm]) {
      c.dispose();
    }
    super.dispose();
  }

  AuthRepository get _auth => ref.read(authRepositoryProvider);

  Future<void> _run(Future<void> Function() action) async {
    FocusScope.of(context).unfocus();
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await action();
    } on AuthFailure catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _sendCode() {
    if (!looksLikeEmail(_email.text)) {
      setState(() => _error = context.l10n.errEmailMissing);
      return;
    }
    _run(() async {
      await _auth.requestReset(_email.text);
      if (mounted) setState(() => _step = _Step.code);
    });
  }

  void _resend() => _run(() async {
    await _auth.requestReset(_email.text);
    if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(context.l10n.codeResent)));
    }
  });

  void _verify() {
    if (_code.text.trim().length != 6) {
      setState(() => _error = context.l10n.errCodeMissing);
      return;
    }
    _run(() async {
      await _auth.verifyResetCode(_email.text, _code.text);
      if (mounted) setState(() => _step = _Step.password);
    });
  }

  void _save() {
    if (_password.text.length < minPasswordLength) {
      setState(() => _error = context.l10n.errPasswordShort(minPasswordLength));
      return;
    }
    if (_password.text != _confirm.text) {
      setState(() => _error = context.l10n.errPasswordsDiffer);
      return;
    }
    _run(() async {
      await _auth.resetPassword(_email.text, _code.text, _password.text);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.l10n.passwordUpdatedSignIn)),
      );
      Navigator.of(context).pop();
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return AuthFrame(
      showBack: true,
      children: [
        AuthTitle(l10n.forgotTitle),
        _Steps(current: _step),
        const SizedBox(height: 22),
        if (_error != null) ErrorBanner(_error!),
        ...switch (_step) {
          _Step.email => [
            LabeledField(
              label: l10n.forgotEmailLabel,
              hint: l10n.forgotEmailHelp,
              child: TextField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                autocorrect: false,
                autofocus: widget.initialEmail.isEmpty,
                onSubmitted: (_) => _busy ? null : _sendCode(),
                decoration: const InputDecoration(
                  hintText: 'vous@votre-commerce.ma',
                  prefixIcon: Icon(Icons.alternate_email),
                ),
              ),
            ),
            const SizedBox(height: 6),
            BusyButton(
              label: l10n.receiveCode,
              busy: _busy,
              onPressed: _sendCode,
            ),
          ],
          _Step.code => [
            Text(
              l10n.codeSentTo(_email.text.trim()),
              style: const TextStyle(color: AppTheme.muted, height: 1.4),
            ),
            const SizedBox(height: 16),
            LabeledField(
              label: l10n.codeLabel,
              child: CodeInput(
                controller: _code,
                autofocus: true,
                onChanged: (v) {
                  if (v.length == CodeInput.length && !_busy) _verify();
                },
              ),
            ),
            BusyButton(label: l10n.verifyCode, busy: _busy, onPressed: _verify),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                TextButton(
                  onPressed: _busy
                      ? null
                      : () => setState(() {
                          _step = _Step.email;
                          _code.clear();
                          _error = null;
                        }),
                  style: TextButton.styleFrom(foregroundColor: AppTheme.muted),
                  child: Text(l10n.changeEmail),
                ),
                TextButton(
                  onPressed: _busy ? null : _resend,
                  style: TextButton.styleFrom(
                    foregroundColor: AppTheme.emeraldDark,
                  ),
                  child: Text(l10n.resendCode),
                ),
              ],
            ),
          ],
          _Step.password => [
            Text(
              l10n.codeVerified,
              style: const TextStyle(
                color: AppTheme.emeraldDark,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 16),
            LabeledField(
              label: l10n.newPasswordLabel,
              hint: l10n.passwordMinHelp(minPasswordLength),
              child: PasswordField(
                controller: _password,
                hint: l10n.passwordMinHint(minPasswordLength),
                autofillNew: true,
              ),
            ),
            LabeledField(
              label: l10n.confirmPasswordLabel,
              child: PasswordField(
                controller: _confirm,
                hint: l10n.confirmPasswordHint,
                autofillNew: true,
                onSubmitted: (_) => _busy ? null : _save(),
              ),
            ),
            Text(
              l10n.sessionsWillClose,
              style: const TextStyle(fontSize: 12, color: AppTheme.muted),
            ),
            const SizedBox(height: 16),
            BusyButton(label: l10n.savePassword, busy: _busy, onPressed: _save),
          ],
        },
      ],
    );
  }
}

/// The three steps, with where the customer is.
class _Steps extends StatelessWidget {
  const _Steps({required this.current});

  final _Step current;

  @override
  Widget build(BuildContext context) {
    final labels = [
      context.l10n.stepEmail,
      context.l10n.stepCode,
      context.l10n.stepNewPassword,
    ];
    return Row(
      children: [
        for (var i = 0; i < 3; i++) ...[
          if (i > 0)
            Expanded(
              child: Container(
                height: 2,
                color: i <= current.index
                    ? AppTheme.emeraldDark
                    : AppTheme.line,
              ),
            ),
          Column(
            children: [
              CircleAvatar(
                radius: 13,
                backgroundColor: i <= current.index
                    ? AppTheme.emeraldDark
                    : AppTheme.line,
                child: Text(
                  '${i + 1}',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: i <= current.index ? Colors.white : AppTheme.muted,
                  ),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                labels[i],
                style: TextStyle(
                  fontSize: 10.5,
                  color: i == current.index ? AppTheme.ink : AppTheme.muted,
                  fontWeight: i == current.index
                      ? FontWeight.w700
                      : FontWeight.w400,
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}
