import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/i18n/language.dart';
import '../../auth/data/auth_repository.dart';
import '../../auth/ui/auth_widgets.dart';
import '../data/account_repository.dart';
import 'account_screen.dart';

/// Change the password while signed in - the same rules as on the website: the current
/// password first, then a new one of at least [minPasswordLength] characters.
class ChangePasswordScreen extends ConsumerStatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  ConsumerState<ChangePasswordScreen> createState() =>
      _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends ConsumerState<ChangePasswordScreen> {
  final _current = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _current.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    FocusScope.of(context).unfocus();
    if (_current.text.isEmpty) {
      setState(() => _error = context.l10n.errCurrentPasswordMissing);
      return;
    }
    if (_password.text.length < minPasswordLength) {
      setState(() => _error = context.l10n.errPasswordShort(minPasswordLength));
      return;
    }
    if (_password.text != _confirm.text) {
      setState(() => _error = context.l10n.errPasswordsDiffer);
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref
          .read(accountRepositoryProvider)
          .changePassword(_current.text, _password.text);
      if (!mounted) return;
      final messenger = ScaffoldMessenger.of(context);
      final done = context.l10n.passwordChanged;
      Navigator.of(context).pop();
      messenger.showSnackBar(SnackBar(content: Text(done)));
    } on AccountFailure catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.passwordScreenTitle)),
      body: AutofillGroup(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            if (_error != null) ErrorBanner(_error!),
            LabeledField(
              label: l10n.currentPasswordLabel,
              child: PasswordField(
                controller: _current,
                hint: l10n.passwordHint,
              ),
            ),
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
            const SizedBox(height: 8),
            BusyButton(label: l10n.save, busy: _busy, onPressed: _save),
          ],
        ),
      ),
    );
  }
}
