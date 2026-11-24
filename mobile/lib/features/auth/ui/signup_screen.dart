import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/i18n/language.dart';
import '../../../core/i18n/tr_text.dart';
import '../../../core/providers.dart';
import '../../../core/theme.dart';
import '../../address/data/address_models.dart';
import '../../address/ui/address_providers.dart';
import '../data/auth_repository.dart';
import 'auth_widgets.dart';
import 'pending_screen.dart';

final _tradesProvider = FutureProvider<List<Trade>>(
  (ref) => ref.watch(authRepositoryProvider).trades(),
);

/// Apply for a trade account, in the website's two steps: the trade, then the business.
///
/// The trade comes first because it decides everything after it - the prices the shop will
/// see once approved. Asking for it inside a long form buries the one choice that matters.
class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  Trade? _trade;

  final _business = TextEditingController();
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _street = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  DeliveryCity? _city;
  String? _district;

  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    for (final c in [_business, _name, _phone, _street, _email, _password]) {
      c.dispose();
    }
    super.dispose();
  }

  /// Checked here only to answer immediately; the server validates everything again.
  String? _validate() {
    final l10n = context.l10n;
    if (_business.text.trim().isEmpty) return l10n.errBusinessName;
    if (_name.text.trim().isEmpty) return l10n.errYourName;
    if (_phone.text.trim().length < 9) return l10n.errPhone;
    if (_city == null) return l10n.errDeliveryCity;
    if (_city!.districts.isNotEmpty && _district == null) {
      return l10n.errDistrict;
    }
    if (_street.text.trim().isEmpty) return l10n.errStreet;
    if (!looksLikeEmail(_email.text)) return l10n.errEmailInvalid;
    if (_password.text.length < minPasswordLength) {
      return l10n.errPasswordShort(minPasswordLength);
    }
    return null;
  }

  Future<void> _submit() async {
    final problem = _validate();
    if (problem != null) {
      setState(() => _error = problem);
      return;
    }
    FocusScope.of(context).unfocus();
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref
          .read(authRepositoryProvider)
          .register(
            tradeId: _trade!.id,
            businessName: _business.text,
            fullName: _name.text,
            phone: _phone.text,
            city: _city!.name,
            district: _district,
            street: _street.text,
            email: _email.text,
            password: _password.text,
          );
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const PendingScreen()),
      );
    } on AuthFailure catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) =>
      _trade == null ? _stepTrade() : _stepBusiness();

  Widget _stepTrade() {
    final trades = ref.watch(_tradesProvider);
    return AuthFrame(
      header: const _SignupHeader(step: 1),
      children: [
        AuthTitle(
          context.l10n.signupTradeTitle,
          subtitle: context.l10n.signupTradeSubtitle,
        ),
        trades.when(
          loading: () => const Padding(
            padding: EdgeInsets.all(32),
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (e, _) => ErrorBanner('$e'),
          data: (list) => list.isEmpty
              ? Text(
                  context.l10n.signupNoTrades,
                  style: const TextStyle(color: AppTheme.muted),
                )
              : Column(
                  children: [
                    for (final t in list)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Material(
                          color: AppTheme.sand,
                          borderRadius: BorderRadius.circular(16),
                          child: InkWell(
                            borderRadius: BorderRadius.circular(16),
                            onTap: () => setState(() => _trade = t),
                            child: Container(
                              padding: const EdgeInsets.all(14),
                              child: Row(
                                children: [
                                  Container(
                                    width: 40,
                                    height: 40,
                                    decoration: const BoxDecoration(
                                      color: Colors.white,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(
                                      Icons.storefront_outlined,
                                      color: AppTheme.emeraldDark,
                                      size: 20,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: TrText(
                                      t.name,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 15,
                                      ),
                                    ),
                                  ),
                                  const Icon(
                                    Icons.chevron_right,
                                    color: AppTheme.muted,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
        ),
      ],
    );
  }

  Widget _stepBusiness() {
    final cities = ref.watch(deliveryCitiesProvider);
    final l10n = context.l10n;

    return AutofillGroup(
      child: AuthFrame(
        header: const _SignupHeader(step: 2),
        children: [
          AuthTitle(
            l10n.signupBusinessTitle,
            subtitle: l10n.signupBusinessSubtitle,
          ),

          // The chosen trade, with the way back - changing it must not cost the rest.
          Container(
            margin: const EdgeInsets.only(bottom: 18),
            padding: const EdgeInsets.fromLTRB(14, 10, 4, 10),
            decoration: BoxDecoration(
              color: AppTheme.forest50,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.check_circle,
                  color: AppTheme.emeraldDark,
                  size: 20,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TrText(
                    _trade!.name,
                    format: l10n.signupYourTrade,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
                TextButton(
                  onPressed: () => setState(() => _trade = null),
                  style: TextButton.styleFrom(
                    foregroundColor: AppTheme.emeraldDark,
                  ),
                  child: Text(l10n.change),
                ),
              ],
            ),
          ),

          if (_error != null) ErrorBanner(_error!),

          LabeledField(
            label: l10n.businessNameLabel,
            child: TextField(
              controller: _business,
              textCapitalization: TextCapitalization.words,
              textInputAction: TextInputAction.next,
              autofillHints: const [AutofillHints.organizationName],
              decoration: const InputDecoration(
                hintText: 'Pâtisserie Al Manar',
              ),
            ),
          ),
          LabeledField(
            label: l10n.yourNameLabel,
            child: TextField(
              controller: _name,
              textCapitalization: TextCapitalization.words,
              textInputAction: TextInputAction.next,
              autofillHints: const [AutofillHints.name],
              decoration: InputDecoration(hintText: l10n.yourNameHint),
            ),
          ),
          LabeledField(
            label: l10n.phoneLabel,
            child: TextField(
              controller: _phone,
              keyboardType: TextInputType.phone,
              textInputAction: TextInputAction.next,
              autofillHints: const [AutofillHints.telephoneNumber],
              decoration: const InputDecoration(hintText: '06 12 34 56 78'),
            ),
          ),

          Padding(
            padding: const EdgeInsets.only(top: 6, bottom: 10),
            child: Text(
              l10n.deliveryAddressSection.toUpperCase(),
              style: AppTheme.eyebrow,
            ),
          ),
          cities.when(
            loading: () => const Padding(
              padding: EdgeInsets.all(12),
              child: LinearProgressIndicator(),
            ),
            error: (e, _) => ErrorBanner(l10n.citiesLoadError),
            data: (list) => Column(
              children: [
                LabeledField(
                  label: l10n.cityLabel,
                  child: DropdownButtonFormField<DeliveryCity>(
                    initialValue: _city,
                    isExpanded: true,
                    hint: Text(l10n.cityHint),
                    items: [
                      for (final c in list)
                        DropdownMenuItem(value: c, child: Text(c.name)),
                    ],
                    onChanged: (c) => setState(() {
                      _city = c;
                      _district = null;
                    }),
                  ),
                ),
                LabeledField(
                  label: l10n.districtLabel,
                  child: DropdownButtonFormField<String>(
                    initialValue: _district,
                    isExpanded: true,
                    hint: Text(
                      _city == null
                          ? l10n.districtHintPickCity
                          : (_city!.districts.isEmpty
                                ? l10n.districtNone
                                : l10n.districtHint),
                    ),
                    items: [
                      for (final d in _city?.districts ?? const <District>[])
                        DropdownMenuItem(value: d.name, child: Text(d.name)),
                    ],
                    onChanged: (_city == null || _city!.districts.isEmpty)
                        ? null
                        : (d) => setState(() => _district = d),
                  ),
                ),
              ],
            ),
          ),
          LabeledField(
            label: l10n.streetLabel,
            hint: l10n.streetHelp,
            child: TextField(
              controller: _street,
              textInputAction: TextInputAction.next,
              autofillHints: const [AutofillHints.streetAddressLine1],
              decoration: const InputDecoration(
                hintText: '12, rue Ibn Batouta',
              ),
            ),
          ),

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
              ),
            ),
          ),
          LabeledField(
            label: l10n.passwordLabel,
            hint: l10n.passwordCreateHelp(minPasswordLength),
            child: PasswordField(
              controller: _password,
              hint: l10n.passwordMinHint(minPasswordLength),
              autofillNew: true,
              onSubmitted: (_) => _busy ? null : _submit(),
            ),
          ),
          const SizedBox(height: 8),
          BusyButton(label: l10n.sendRequest, busy: _busy, onPressed: _submit),
          const SizedBox(height: 14),
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            style: TextButton.styleFrom(foregroundColor: AppTheme.emeraldDark),
            child: Text(l10n.haveAccount),
          ),
        ],
      ),
    );
  }
}

/// The green band over both steps: the way back, what this is, and how far along.
class _SignupHeader extends StatelessWidget {
  const _SignupHeader({required this.step});

  final int step;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 20),
      decoration: const BoxDecoration(
        gradient: AppTheme.forestGradient,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(28)),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsetsDirectional.fromSTEB(8, 4, 20, 22),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const BackButton(color: Colors.white),
              Padding(
                padding: const EdgeInsetsDirectional.only(start: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.stepOf(step, 2).toUpperCase(),
                      style: AppTheme.eyebrow.copyWith(
                        color: AppTheme.brassLight,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      l10n.requestAccount,
                      style: AppTheme.display(
                        context,
                        size: 24,
                        colour: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        for (var i = 1; i <= 2; i++) ...[
                          if (i > 1) const SizedBox(width: 6),
                          Expanded(
                            child: Container(
                              height: 5,
                              decoration: BoxDecoration(
                                color: i <= step
                                    ? AppTheme.brassLight
                                    : Colors.white.withValues(alpha: 0.25),
                                borderRadius: BorderRadius.circular(999),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
