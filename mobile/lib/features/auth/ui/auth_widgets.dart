import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/i18n/language.dart';
import '../../../core/i18n/tr_text.dart';
import '../../../core/theme.dart';

/// The frame every sign-in screen shares: the form in a white card on the cream page,
/// readable width, scrolls above the keyboard. [header] sits above the card - the brand on the
/// sign-in screen.
class AuthFrame extends StatelessWidget {
  const AuthFrame({
    super.key,
    required this.children,
    this.showBack = false,
    this.header,
  });

  final List<Widget> children;
  final bool showBack;
  final Widget? header;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: showBack ? AppBar() : null,
      body: SingleChildScrollView(
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        child: Column(
          children: [
            ?header,
            SafeArea(
              top: header == null && !showBack,
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 460),
                  child: Container(
                    margin: EdgeInsets.fromLTRB(
                      16,
                      header == null ? 12 : 0,
                      16,
                      32,
                    ),
                    padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
                    decoration: AppTheme.card(radius: 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: children,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class AuthTitle extends StatelessWidget {
  const AuthTitle(this.title, {super.key, this.subtitle, this.eyebrow});

  final String title;
  final String? subtitle;
  final String? eyebrow;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      if (eyebrow != null) ...[
        Text(
          eyebrow!.toUpperCase(),
          style: AppTheme.eyebrow.copyWith(color: AppTheme.brass),
        ),
        const SizedBox(height: 8),
      ],
      Text(title, style: AppTheme.display(context, size: 28)),
      if (subtitle != null) ...[
        const SizedBox(height: 6),
        Text(
          subtitle!,
          style: const TextStyle(color: AppTheme.muted, height: 1.45),
        ),
      ],
      const SizedBox(height: 24),
    ],
  );
}

/// A labelled field. The label sits above, as on the website, rather than floating inside -
/// a floating label disappears into the field the moment the customer starts typing.
class LabeledField extends StatelessWidget {
  const LabeledField({
    super.key,
    required this.label,
    required this.child,
    this.hint,
  });

  final String label;
  final Widget child;
  final String? hint;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 14),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 6),
        child,
        if (hint != null) ...[
          const SizedBox(height: 5),
          Text(
            hint!,
            style: const TextStyle(fontSize: 11.5, color: AppTheme.muted),
          ),
        ],
      ],
    ),
  );
}

/// A password field with the eye that shows it. Typing a 10-character password blind on a
/// phone keyboard is how sign-ups fail on a typo nobody can see.
class PasswordField extends StatefulWidget {
  const PasswordField({
    super.key,
    required this.controller,
    this.hint,
    this.onSubmitted,
    this.autofillNew = false,
  });

  final TextEditingController controller;
  final String? hint;
  final ValueChanged<String>? onSubmitted;

  /// A password being created rather than recalled - lets the system offer to generate and
  /// save it instead of filling an old one.
  final bool autofillNew;

  @override
  State<PasswordField> createState() => _PasswordFieldState();
}

class _PasswordFieldState extends State<PasswordField> {
  bool _visible = false;

  @override
  Widget build(BuildContext context) => TextField(
    controller: widget.controller,
    obscureText: !_visible,
    autocorrect: false,
    enableSuggestions: false,
    autofillHints: [
      widget.autofillNew ? AutofillHints.newPassword : AutofillHints.password,
    ],
    textInputAction: widget.onSubmitted == null
        ? TextInputAction.next
        : TextInputAction.done,
    onSubmitted: widget.onSubmitted,
    decoration: InputDecoration(
      hintText: widget.hint,
      prefixIcon: const Icon(Icons.lock_outline),
      suffixIcon: IconButton(
        tooltip: _visible
            ? context.l10n.hidePassword
            : context.l10n.showPassword,
        icon: Icon(
          _visible ? Icons.visibility_off_outlined : Icons.visibility_outlined,
        ),
        onPressed: () => setState(() => _visible = !_visible),
      ),
    ),
  );
}

/// A refusal, usually the server's own French sentence - shown in the customer's language.
class ErrorBanner extends StatelessWidget {
  const ErrorBanner(this.message, {super.key});

  final String message;

  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 14),
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: const Color(0xFFFEF2F2),
      border: Border.all(color: const Color(0xFFFECACA)),
      borderRadius: BorderRadius.circular(10),
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(Icons.error_outline, size: 18, color: Colors.red.shade700),
        const SizedBox(width: 8),
        Expanded(
          child: TrText(
            message,
            style: TextStyle(fontSize: 13, color: Colors.red.shade700),
          ),
        ),
      ],
    ),
  );
}

class BusyButton extends StatelessWidget {
  const BusyButton({
    super.key,
    required this.label,
    required this.busy,
    this.onPressed,
  });

  final String label;
  final bool busy;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) => FilledButton(
    onPressed: busy ? null : onPressed,
    child: busy
        ? const SizedBox(
            height: 22,
            width: 22,
            child: CircularProgressIndicator(
              strokeWidth: 2.4,
              color: Colors.white,
            ),
          )
        : Text(label),
  );
}

/// A loose but sufficient e-mail check, to catch "vous@" before a round trip. The server's
/// own validation remains the authority.
bool looksLikeEmail(String value) =>
    RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(value.trim());

/// A six-digit code, drawn as `_ _ _ – _ _ _`: three and three, like the code in the e-mail.
///
/// One real text field sits invisibly over the slots, so the keyboard, paste and the system's
/// one-time-code autofill all work as on any field; the slots only show what it holds.
class CodeInput extends StatefulWidget {
  const CodeInput({
    super.key,
    required this.controller,
    this.onChanged,
    this.autofocus = false,
  });

  final TextEditingController controller;
  final ValueChanged<String>? onChanged;
  final bool autofocus;

  static const length = 6;

  @override
  State<CodeInput> createState() => _CodeInputState();
}

class _CodeInputState extends State<CodeInput> {
  final _focus = FocusNode();

  @override
  void initState() {
    super.initState();
    _focus.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _focus.dispose();
    super.dispose();
  }

  Widget _slot(String text, int index) {
    final filled = index < text.length;
    final active = _focus.hasFocus && index == text.length;
    return Expanded(
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        height: 58,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: filled ? AppTheme.forest50 : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: active
                ? AppTheme.emeraldDark
                : (filled ? AppTheme.forest200 : AppTheme.line),
            width: active ? 1.8 : 1,
          ),
        ),
        child: filled
            ? Text(
                text[index],
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.ink,
                ),
              )
            // The underscore that says "a digit goes here".
            : Container(
                width: 14,
                height: 2.5,
                margin: const EdgeInsets.only(top: 14),
                decoration: BoxDecoration(
                  color: active ? AppTheme.emeraldDark : AppTheme.line,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      // Digits are typed left to right in Arabic too.
      textDirection: TextDirection.ltr,
      child: Stack(
        children: [
          ListenableBuilder(
            listenable: widget.controller,
            builder: (context, _) {
              final text = widget.controller.text;
              return Row(
                children: [
                  for (var i = 0; i < 3; i++) ...[
                    if (i > 0) const SizedBox(width: 8),
                    _slot(text, i),
                  ],
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 10),
                    child: Text(
                      '–',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.muted,
                      ),
                    ),
                  ),
                  for (var i = 3; i < CodeInput.length; i++) ...[
                    if (i > 3) const SizedBox(width: 8),
                    _slot(text, i),
                  ],
                ],
              );
            },
          ),
          Positioned.fill(
            child: Opacity(
              opacity: 0,
              child: TextField(
                controller: widget.controller,
                focusNode: _focus,
                autofocus: widget.autofocus,
                keyboardType: TextInputType.number,
                autofillHints: const [AutofillHints.oneTimeCode],
                showCursor: false,
                enableInteractiveSelection: false,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(CodeInput.length),
                ],
                onChanged: widget.onChanged,
                decoration: const InputDecoration(
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  filled: false,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
