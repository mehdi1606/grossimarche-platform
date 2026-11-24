import 'package:flutter/material.dart';

import '../core/i18n/language.dart';
import '../core/i18n/tr_text.dart';

/// The foot of a paged list: asks for the next page as soon as it comes into view.
///
/// Lists are built lazily, so this widget only exists once the customer has scrolled near the
/// end - which is exactly when the next page is wanted. No "load more" button to find.
class LoadMoreFooter extends StatefulWidget {
  const LoadMoreFooter({
    super.key,
    required this.hasMore,
    required this.loading,
    required this.onLoadMore,
    this.error,
  });

  final bool hasMore;
  final bool loading;
  final String? error;
  final VoidCallback onLoadMore;

  @override
  State<LoadMoreFooter> createState() => _LoadMoreFooterState();
}

class _LoadMoreFooterState extends State<LoadMoreFooter> {
  @override
  void initState() {
    super.initState();
    _requestIfNeeded();
  }

  @override
  void didUpdateWidget(LoadMoreFooter old) {
    super.didUpdateWidget(old);
    _requestIfNeeded();
  }

  void _requestIfNeeded() {
    if (widget.hasMore && !widget.loading && widget.error == null) {
      // After the frame: asking during build would modify the provider being built from.
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) widget.onLoadMore();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.hasMore) return const SizedBox(height: 24);
    if (widget.error != null) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TrText(
              widget.error!,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.black54),
            ),
            TextButton(
              onPressed: widget.onLoadMore,
              child: Text(context.l10n.retry),
            ),
          ],
        ),
      );
    }
    return const Padding(
      padding: EdgeInsets.all(20),
      child: Center(
        child: SizedBox(
          width: 24,
          height: 24,
          child: CircularProgressIndicator(strokeWidth: 2.4),
        ),
      ),
    );
  }
}
