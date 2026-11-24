import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:open_filex/open_filex.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/i18n/language.dart';
import '../../../core/i18n/tr_text.dart';
import '../../../core/theme.dart';
import '../data/order_models.dart';
import '../data/order_repository.dart';
import 'order_providers.dart';

/// "Facture PDF" and "Partager" under an order.
///
/// The PDF is the one the server generates for the website, fetched each time rather than
/// kept: an invoice reflects the order as it stands, and the app's cache folder is the right
/// place for a file that can always be fetched again. Sharing matters for a shop - the invoice
/// usually goes straight to an accountant on WhatsApp.
class InvoiceActions extends ConsumerStatefulWidget {
  const InvoiceActions({super.key, required this.order});

  final OrderDetail order;

  @override
  ConsumerState<InvoiceActions> createState() => _InvoiceActionsState();
}

enum _Action { open, share }

class _InvoiceActionsState extends ConsumerState<InvoiceActions> {
  _Action? _busy;

  Future<File> _download() async {
    final bytes = await ref
        .read(orderRepositoryProvider)
        .invoice(widget.order.id);
    final folder = await getTemporaryDirectory();
    final name = widget.order.number.isEmpty
        ? widget.order.id
        : widget.order.number;
    final file = File('${folder.path}/Facture-$name.pdf');
    await file.writeAsBytes(bytes, flush: true);
    return file;
  }

  Future<void> _run(_Action action) async {
    final messenger = ScaffoldMessenger.of(context);
    final l10n = context.l10n;
    setState(() => _busy = action);
    try {
      final file = await _download();
      if (action == _Action.share) {
        await _share(file, l10n);
        return;
      }
      final result = await OpenFilex.open(file.path, type: 'application/pdf');
      // No PDF reader on the phone: the share sheet still lets them send it or save it to
      // Drive, which beats a dead end.
      if (result.type == ResultType.noAppToOpen) await _share(file, l10n);
    } on OrderFailure catch (e) {
      messenger.showSnackBar(SnackBar(content: TrText(e.message)));
    } on FileSystemException {
      messenger.showSnackBar(SnackBar(content: Text(l10n.invoiceSaveError)));
    } finally {
      if (mounted) setState(() => _busy = null);
    }
  }

  Future<void> _share(File file, AppLocalizations l10n) =>
      SharePlus.instance.share(
        ShareParams(
          files: [XFile(file.path, mimeType: 'application/pdf')],
          subject: l10n.invoiceSubject(widget.order.number),
        ),
      );

  @override
  Widget build(BuildContext context) {
    Widget spinner() => const SizedBox(
      height: 18,
      width: 18,
      child: CircularProgressIndicator(strokeWidth: 2),
    );

    return Row(
      children: [
        Expanded(
          child: OutlinedButton.icon(
            onPressed: _busy != null ? null : () => _run(_Action.open),
            icon: _busy == _Action.open
                ? spinner()
                : const Icon(Icons.picture_as_pdf_outlined),
            label: Text(context.l10n.invoicePdf),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppTheme.emeraldDark,
              minimumSize: const Size.fromHeight(46),
            ),
          ),
        ),
        const SizedBox(width: 10),
        OutlinedButton(
          onPressed: _busy != null ? null : () => _run(_Action.share),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppTheme.emeraldDark,
            minimumSize: const Size(52, 46),
            padding: EdgeInsets.zero,
          ),
          child: _busy == _Action.share
              ? spinner()
              : Icon(
                  Icons.share_outlined,
                  semanticLabel: context.l10n.invoiceShare,
                ),
        ),
      ],
    );
  }
}
