import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/i18n/language.dart';
import '../../../core/i18n/tr_text.dart';
import '../../../core/providers.dart';
import '../../../core/theme.dart';
import '../../../shared/language_switch.dart';
import '../../address/data/address_models.dart';
import '../../info/ui/info_screens.dart';
import '../../address/data/address_repository.dart';
import '../../address/ui/address_form_sheet.dart';
import '../../address/ui/address_providers.dart';
import '../data/account_repository.dart';
import 'change_password_screen.dart';
import 'edit_profile_sheet.dart';

final accountRepositoryProvider = Provider<AccountRepository>(
  (ref) => AccountRepository(ref.watch(apiClientProvider)),
);

final profileProvider = FutureProvider<Profile>((ref) {
  ref.watch(accountKeyProvider);
  return ref.watch(accountRepositoryProvider).profile();
});

/// The account: who, what trade, where to deliver, and the settings.
class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: Text(context.l10n.accountTitle)),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(profileProvider);
          ref.invalidate(addressesProvider);
          await ref.read(profileProvider.future);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: const [
            _ProfileCard(),
            SizedBox(height: 22),
            _Addresses(),
            SizedBox(height: 22),
            _SettingsHeader(),
            _Group(children: [LanguagePicker()]),
            SizedBox(height: 22),
            _Help(),
            SizedBox(height: 22),
            _Security(),
            SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _ProfileCard extends ConsumerWidget {
  const _ProfileCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(profileProvider);

    return profile.when(
      loading: () => const SizedBox(
        height: 96,
        child: Center(child: CircularProgressIndicator()),
      ),
      error: (e, _) => TrText('$e'),
      data: (p) => Container(
        padding: const EdgeInsetsDirectional.fromSTEB(18, 18, 6, 18),
        decoration: BoxDecoration(
          gradient: AppTheme.forestGradient,
          borderRadius: BorderRadius.circular(22),
          boxShadow: AppTheme.shadow,
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 56,
              height: 56,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                border: Border.all(color: AppTheme.brassLight, width: 2),
              ),
              child: Text(
                p.fullName.isEmpty ? '?' : p.fullName.trim()[0].toUpperCase(),
                style: AppTheme.display(
                  context,
                  size: 24,
                  colour: AppTheme.emeraldDark,
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    p.fullName.isEmpty ? context.l10n.noName : p.fullName,
                    style: AppTheme.display(
                      context,
                      size: 20,
                      colour: Colors.white,
                    ),
                  ),
                  if (p.businessName != null)
                    Text(
                      p.businessName!,
                      style: const TextStyle(
                        color: AppTheme.brassLight,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  const SizedBox(height: 6),
                  if (p.email != null)
                    Text(
                      p.email!,
                      style: const TextStyle(
                        fontSize: 12.5,
                        color: Colors.white70,
                      ),
                    ),
                  if (p.phone != null)
                    Text(
                      p.phone!,
                      textDirection: TextDirection.ltr,
                      style: const TextStyle(
                        fontSize: 12.5,
                        color: Colors.white70,
                      ),
                    ),
                  const SizedBox(height: 8),
                  // The trade is what sets every price in the app - worth stating plainly,
                  // and stating plainly when it is still missing.
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 9,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: p.clientType != null
                          ? Colors.white
                          : AppTheme.brass100,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: TrText(
                      p.clientType ?? '',
                      format: (trade) => p.clientType != null
                          ? context.l10n.tradeLabel(trade)
                          : context.l10n.awaitingApproval,
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                        color: p.clientType != null
                            ? AppTheme.emeraldDark
                            : AppTheme.brass,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            IconButton(
              tooltip: context.l10n.editName,
              icon: const Icon(
                Icons.edit_outlined,
                size: 20,
                color: Colors.white,
              ),
              onPressed: () => EditProfileSheet.show(context, p),
            ),
          ],
        ),
      ),
    );
  }
}

class _Addresses extends ConsumerWidget {
  const _Addresses();

  Future<void> _act(
    BuildContext context,
    WidgetRef ref,
    Future<void> Function(AddressRepository) action,
  ) async {
    try {
      await action(ref.read(addressRepositoryProvider));
      ref.invalidate(addressesProvider);
    } on AddressFailure catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: TrText(
              e.message,
              style: const TextStyle(color: Colors.white),
            ),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final addresses = ref.watch(addressesProvider);
    final l10n = context.l10n;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _SectionHeader(
          l10n.addressesTitle,
          action: TextButton.icon(
            onPressed: () => AddressFormSheet.show(context),
            icon: const Icon(Icons.add, size: 18),
            label: Text(l10n.add),
          ),
        ),
        Container(
          decoration: AppTheme.card(),
          child: addresses.when(
            loading: () => const Padding(
              padding: EdgeInsets.all(20),
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (e, _) =>
                Padding(padding: const EdgeInsets.all(16), child: TrText('$e')),
            data: (list) => list.isEmpty
                ? ListTile(
                    leading: const _IconDisc(
                      Icons.location_off_outlined,
                      muted: true,
                    ),
                    title: Text(
                      l10n.noAddresses,
                      style: const TextStyle(color: AppTheme.muted),
                    ),
                    onTap: () => AddressFormSheet.show(context),
                  )
                : Column(
                    children: [
                      for (final (i, Address a) in list.indexed) ...[
                        if (i > 0)
                          const Divider(height: 1, indent: 68, endIndent: 16),
                        Padding(
                          padding: const EdgeInsetsDirectional.fromSTEB(
                            14,
                            12,
                            4,
                            12,
                          ),
                          child: Row(
                            children: [
                              _IconDisc(
                                a.isDefault
                                    ? Icons.location_on
                                    : Icons.location_on_outlined,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        if (a.label != null)
                                          Flexible(
                                            child: Text(
                                              a.label!,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(
                                                fontWeight: FontWeight.w700,
                                              ),
                                            ),
                                          ),
                                        if (a.isDefault) ...[
                                          const SizedBox(width: 8),
                                          Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 8,
                                              vertical: 2,
                                            ),
                                            decoration: BoxDecoration(
                                              color: AppTheme.forest100,
                                              borderRadius:
                                                  BorderRadius.circular(999),
                                            ),
                                            child: Text(
                                              l10n.defaultAddress,
                                              style: const TextStyle(
                                                fontSize: 11,
                                                fontWeight: FontWeight.w700,
                                                color: AppTheme.forest700,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      a.summary,
                                      style: const TextStyle(
                                        fontSize: 13,
                                        color: AppTheme.muted,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              PopupMenuButton<String>(
                                icon: const Icon(
                                  Icons.more_vert,
                                  color: AppTheme.muted,
                                ),
                                onSelected: (choice) async {
                                  if (choice == 'default') {
                                    await _act(
                                      context,
                                      ref,
                                      (r) => r.makeDefault(a),
                                    );
                                  } else if (choice == 'delete') {
                                    await _act(
                                      context,
                                      ref,
                                      (r) => r.delete(a.id),
                                    );
                                  }
                                },
                                itemBuilder: (_) => [
                                  if (!a.isDefault)
                                    PopupMenuItem(
                                      value: 'default',
                                      child: Text(l10n.makeDefault),
                                    ),
                                  PopupMenuItem(
                                    value: 'delete',
                                    child: Text(l10n.delete),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
          ),
        ),
      ],
    );
  }
}

/// Password, sign-out, and - small and last - account erasure.
class _Security extends ConsumerWidget {
  const _Security();

  /// Account erasure - required by the Play Store, and the customer's right under loi 09-08.
  ///
  /// The confirmation says what goes and what stays, because "delete my account" otherwise
  /// reads as "erase every trace", and the orders legitimately remain.
  Future<void> _delete(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(context.l10n.deleteAccountQuestion),
        content: Text(context.l10n.deleteAccountDetail),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(context.l10n.cancel),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppTheme.danger),
            child: Text(context.l10n.deleteForever),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await ref.read(accountRepositoryProvider).deleteAccount();
      await ref.read(tokenStoreProvider).clear();
      ref.read(sessionProvider.notifier).set(const Session.none());
    } on AccountFailure catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: TrText(
              e.message,
              style: const TextStyle(color: Colors.white),
            ),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _SectionHeader(l10n.securitySection),
        Container(
          decoration: AppTheme.card(),
          child: Column(
            children: [
              _SettingTile(
                icon: Icons.lock_outline,
                label: l10n.changePassword,
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const ChangePasswordScreen(),
                  ),
                ),
              ),
              const Divider(height: 1, indent: 68, endIndent: 16),
              _SettingTile(
                icon: Icons.logout,
                label: l10n.signOut,
                danger: true,
                onTap: () async {
                  await ref.read(authRepositoryProvider).signOut();
                  ref.read(sessionProvider.notifier).set(const Session.none());
                },
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        // Deliberately small and last: it must be findable, not tempting.
        Center(
          child: TextButton(
            onPressed: () => _delete(context, ref),
            style: TextButton.styleFrom(
              foregroundColor: AppTheme.muted,
              textStyle: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
            child: Text(l10n.deleteAccount),
          ),
        ),
      ],
    );
  }
}

/// The small capitals over a group, with an optional action at the end.
class _SectionHeader extends StatelessWidget {
  const _SectionHeader(this.title, {this.action});

  final String title;
  final Widget? action;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsetsDirectional.fromSTEB(4, 0, 0, 8),
    child: SizedBox(
      height: 36,
      child: Row(
        children: [
          Expanded(child: Text(title.toUpperCase(), style: AppTheme.eyebrow)),
          ?action,
        ],
      ),
    ),
  );
}

/// One row of a settings card: an icon in a soft disc, the label, a chevron.
class _SettingTile extends StatelessWidget {
  const _SettingTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.danger = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool danger;

  @override
  Widget build(BuildContext context) => ListTile(
    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
    leading: _IconDisc(icon, danger: danger),
    title: Text(
      label,
      style: TextStyle(
        fontWeight: FontWeight.w600,
        color: danger ? AppTheme.danger : AppTheme.ink,
      ),
    ),
    trailing: danger ? null : Icon(Icons.chevron_right, color: AppTheme.muted),
    onTap: onTap,
  );
}

class _IconDisc extends StatelessWidget {
  const _IconDisc(this.icon, {this.danger = false, this.muted = false});

  final IconData icon;
  final bool danger;
  final bool muted;

  @override
  Widget build(BuildContext context) => Container(
    width: 40,
    height: 40,
    decoration: BoxDecoration(
      color: danger
          ? const Color(0xFFFEF3F2)
          : (muted ? AppTheme.sand : AppTheme.forest50),
      shape: BoxShape.circle,
    ),
    child: Icon(
      icon,
      size: 20,
      color: danger
          ? AppTheme.danger
          : (muted ? AppTheme.muted : AppTheme.emeraldDark),
    ),
  );
}

/// A few settings rows in one white card.
class _Group extends StatelessWidget {
  const _Group({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
    decoration: AppTheme.card(),
    child: Column(children: children),
  );
}

class _SettingsHeader extends StatelessWidget {
  const _SettingsHeader();

  @override
  Widget build(BuildContext context) =>
      _SectionHeader(context.l10n.settingsSection);
}

/// Contact, FAQ and the legal pages, in the same tiles as the other settings.
class _Help extends StatelessWidget {
  const _Help();

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    const divider = Divider(height: 1, indent: 68, endIndent: 16);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _SectionHeader(l10n.helpSection),
        Container(
          decoration: AppTheme.card(),
          child: Column(
            children: [
              _SettingTile(
                icon: Icons.support_agent,
                label: l10n.contactTitle,
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const ContactScreen()),
                ),
              ),
              divider,
              _SettingTile(
                icon: Icons.help_outline,
                label: l10n.faqTitle,
                onTap: () => Navigator.of(
                  context,
                ).push(MaterialPageRoute(builder: (_) => const FaqScreen())),
              ),
              divider,
              _SettingTile(
                icon: Icons.description_outlined,
                label: l10n.termsTitle,
                onTap: () => openSitePage(context, '/terms-and-conditions'),
              ),
              divider,
              _SettingTile(
                icon: Icons.privacy_tip_outlined,
                label: l10n.privacyTitle,
                onTap: () => openSitePage(context, '/privacy-policy'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
