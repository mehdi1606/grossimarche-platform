import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/i18n/language.dart';
import '../../../core/i18n/tr_text.dart';
import '../../../core/providers.dart';
import '../../../core/theme.dart';
import '../../auth/data/auth_repository.dart';
import '../../auth/ui/auth_widgets.dart';
import '../data/account_repository.dart';
import 'account_screen.dart';

enum _Step { details, email, emailCode }

/// Everything the customer can change about themselves, in one sheet.
///
/// Name, business name and phone are saved together. The e-mail is the sign-in identity, so
/// changing it is its own short path inside the sheet: the new address, then the code sent to
/// it. The trade is shown but locked - it sets every price, and only Market Food changes it.
class EditProfileSheet extends ConsumerStatefulWidget {
  const EditProfileSheet({super.key, required this.profile});

  final Profile profile;

  static Future<void> show(BuildContext context, Profile profile) =>
      showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        useSafeArea: true,
        builder: (_) => EditProfileSheet(profile: profile),
      );

  @override
  ConsumerState<EditProfileSheet> createState() => _EditProfileSheetState();
}

class _EditProfileSheetState extends ConsumerState<EditProfileSheet> {
  late final _name = TextEditingController(text: widget.profile.fullName);
  late final _business = TextEditingController(
    text: widget.profile.businessName ?? '',
  );
  late final _phone = TextEditingController(text: widget.profile.phone ?? '');
  final _email = TextEditingController();
  final _code = TextEditingController();

  _Step _step = _Step.details;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    for (final c in [_name, _business, _phone, _email, _code]) {
      c.dispose();
    }
    super.dispose();
  }

  AccountRepository get _repository => ref.read(accountRepositoryProvider);

  /// Run a server call with the busy state and the error banner handled.
  Future<void> _run(Future<void> Function() action) async {
    FocusScope.of(context).unfocus();
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await action();
    } on AccountFailure catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  /// The server's answer is the account as it now stands: the profile is reloaded and the
  /// session's copy updated, so the greeting on the catalogue follows a new name at once.
  void _applied(Map<String, dynamic> body, String message) {
    ref.invalidate(profileProvider);
    ref
        .read(sessionProvider.notifier)
        .set(Session.of(SignedInUser.fromJson(body)));
    final messenger = ScaffoldMessenger.of(context);
    Navigator.of(context).pop();
    messenger.showSnackBar(SnackBar(content: Text(message)));
  }

  void _save() {
    final l10n = context.l10n;
    if (_name.text.trim().isEmpty) {
      setState(() => _error = l10n.errYourName);
      return;
    }
    if (_phone.text.replaceAll(RegExp(r'\D'), '').length < 9) {
      setState(() => _error = l10n.errPhone);
      return;
    }
    final done = l10n.profileUpdated;
    _run(() async {
      final body = await _repository.updateProfile(
        fullName: _name.text,
        businessName: _business.text,
        phone: _phone.text,
      );
      if (mounted) _applied(body, done);
    });
  }

  void _sendCode() {
    final l10n = context.l10n;
    final email = _email.text.trim();
    if (!looksLikeEmail(email)) {
      setState(() => _error = l10n.errEmailInvalid);
      return;
    }
    if (email.toLowerCase() == (widget.profile.email ?? '').toLowerCase()) {
      setState(() => _error = l10n.errSameEmail);
      return;
    }
    _run(() async {
      await _repository.requestEmailChange(email);
      if (mounted) setState(() => _step = _Step.emailCode);
    });
  }

  void _verify() {
    if (_code.text.length != CodeInput.length) {
      setState(() => _error = context.l10n.errCodeMissing);
      return;
    }
    final done = context.l10n.emailUpdated;
    _run(() async {
      final body = await _repository.confirmEmailChange(
        _email.text,
        _code.text,
      );
      if (mounted) _applied(body, done);
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Padding(
      padding: EdgeInsets.fromLTRB(
        20,
        0,
        20,
        MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: SingleChildScrollView(
        child: AnimatedSize(
          duration: const Duration(milliseconds: 180),
          alignment: Alignment.topCenter,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  if (_step != _Step.details)
                    IconButton(
                      tooltip: MaterialLocalizations.of(
                        context,
                      ).backButtonTooltip,
                      onPressed: _busy
                          ? null
                          : () => setState(() {
                              _step = _Step.details;
                              _error = null;
                              _code.clear();
                            }),
                      icon: const BackButtonIcon(),
                    ),
                  Expanded(
                    child: Text(
                      _step == _Step.details
                          ? l10n.editProfileTitle
                          : l10n.newEmailLabel,
                      style: AppTheme.display(context, size: 22),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              if (_step == _Step.details)
                Text(
                  l10n.editProfileSubtitle,
                  style: const TextStyle(color: AppTheme.muted, height: 1.4),
                ),
              const SizedBox(height: 18),
              if (_error != null) ErrorBanner(_error!),
              ...switch (_step) {
                _Step.details => _details(l10n),
                _Step.email => _emailStep(l10n),
                _Step.emailCode => _codeStep(l10n),
              },
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _details(AppLocalizations l10n) => [
    LabeledField(
      label: l10n.yourNameLabel,
      child: TextField(
        controller: _name,
        textCapitalization: TextCapitalization.words,
        textInputAction: TextInputAction.next,
        maxLength: 150,
        decoration: InputDecoration(
          hintText: l10n.yourNameHint,
          prefixIcon: const Icon(Icons.person_outline),
          counterText: '',
        ),
      ),
    ),
    LabeledField(
      label: l10n.businessNameLabel,
      child: TextField(
        controller: _business,
        textCapitalization: TextCapitalization.words,
        textInputAction: TextInputAction.next,
        maxLength: 150,
        decoration: const InputDecoration(
          prefixIcon: Icon(Icons.storefront_outlined),
          counterText: '',
        ),
      ),
    ),
    LabeledField(
      label: l10n.phoneLabel,
      child: TextField(
        controller: _phone,
        keyboardType: TextInputType.phone,
        textInputAction: TextInputAction.done,
        maxLength: 20,
        decoration: const InputDecoration(
          hintText: '06 12 34 56 78',
          prefixIcon: Icon(Icons.call_outlined),
          counterText: '',
        ),
      ),
    ),
    LabeledField(
      label: l10n.emailLabel,
      child: _ReadOnlyRow(
        icon: Icons.alternate_email,
        value: widget.profile.email ?? '-',
        action: TextButton(
          onPressed: _busy
              ? null
              : () => setState(() {
                  _step = _Step.email;
                  _error = null;
                }),
          child: Text(l10n.change),
        ),
      ),
    ),
    if (widget.profile.clientType != null)
      LabeledField(
        label: l10n.tradeFieldLabel,
        hint: l10n.tradeLockedHelp,
        child: _ReadOnlyRow(
          icon: Icons.lock_outline,
          value: widget.profile.clientType!,
          translate: true,
        ),
      ),
    const SizedBox(height: 6),
    BusyButton(label: l10n.save, busy: _busy, onPressed: _save),
  ];

  List<Widget> _emailStep(AppLocalizations l10n) => [
    LabeledField(
      label: l10n.newEmailLabel,
      hint: l10n.newEmailHelp,
      child: TextField(
        controller: _email,
        autofocus: true,
        keyboardType: TextInputType.emailAddress,
        autocorrect: false,
        onSubmitted: (_) => _busy ? null : _sendCode(),
        decoration: const InputDecoration(
          hintText: 'vous@votre-commerce.ma',
          prefixIcon: Icon(Icons.alternate_email),
        ),
      ),
    ),
    const SizedBox(height: 6),
    BusyButton(label: l10n.receiveCode, busy: _busy, onPressed: _sendCode),
  ];

  List<Widget> _codeStep(AppLocalizations l10n) => [
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
    const SizedBox(height: 4),
    Align(
      alignment: AlignmentDirectional.centerEnd,
      child: TextButton(
        onPressed: _busy ? null : _sendCode,
        child: Text(l10n.resendCode),
      ),
    ),
  ];
}

/// A value the customer sees but does not type into here.
class _ReadOnlyRow extends StatelessWidget {
  const _ReadOnlyRow({
    required this.icon,
    required this.value,
    this.action,
    this.translate = false,
  });

  final IconData icon;
  final String value;
  final Widget? action;
  final bool translate;

  @override
  Widget build(BuildContext context) {
    const style = TextStyle(fontSize: 15, color: AppTheme.ink700);
    return Container(
      constraints: const BoxConstraints(minHeight: 54),
      padding: const EdgeInsetsDirectional.fromSTEB(14, 4, 4, 4),
      decoration: BoxDecoration(
        color: AppTheme.sand,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.line),
      ),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppTheme.muted),
          const SizedBox(width: 12),
          Expanded(
            child: translate
                ? TrText(value, style: style)
                : Text(value, style: style, overflow: TextOverflow.ellipsis),
          ),
          ?action,
        ],
      ),
    );
  }
}
