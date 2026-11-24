import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../core/env.dart';
import '../core/theme.dart';

/// A product or category picture, cached on the device.
///
/// Cached because a wholesale catalogue is scrolled over and over by the same buyer, often on
/// a connection paid by the megabyte: downloading the same crate of rice every morning is a
/// cost the customer carries.
///
/// A product without a photo gets a lettered tile rather than a grey rectangle or a broken
/// icon - the same tile the announcement e-mails use, so the catalogue and the inbox agree.
class ProductImage extends StatelessWidget {
  const ProductImage({
    super.key,
    required this.url,
    required this.name,
    this.size,
    this.radius = 12,
  });

  final String? url;
  final String name;

  /// Null means "fill the space given", for a grid cell; a number forces a square thumbnail.
  final double? size;
  final double radius;

  @override
  Widget build(BuildContext context) {
    final image = url == null ? null : Env.media(url!);
    final shape = BorderRadius.circular(radius);

    if (image == null) {
      return _Tile(name: name, size: size, radius: radius);
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        // Decode at the size it is shown, not the size it was uploaded. A catalogue photo is
        // ~1400 px and 800 KB; decoded whole for a 150 px grid cell it costs ten times the
        // memory and the decoding time, which is what makes a product grid stutter as it
        // scrolls. The cached file stays full size; only the bitmap in memory is shrunk.
        final logical =
            size ??
            (constraints.maxWidth.isFinite ? constraints.maxWidth : 400);
        final pixels = (logical * MediaQuery.devicePixelRatioOf(context))
            .round();

        return ClipRRect(
          borderRadius: shape,
          child: CachedNetworkImage(
            imageUrl: image,
            width: size,
            height: size,
            memCacheWidth: pixels,
            fit: BoxFit.cover,
            fadeInDuration: const Duration(milliseconds: 150),
            placeholder: (_, _) => Container(color: AppTheme.sand),
            // A photo that fails to load falls back to the same tile: a customer should never
            // see a broken-image glyph in a shop.
            errorWidget: (_, _, _) =>
                _Tile(name: name, size: size, radius: radius),
          ),
        );
      },
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile({required this.name, this.size, this.radius = 12});

  final String name;
  final double? size;
  final double radius;

  @override
  Widget build(BuildContext context) {
    final initial = name.trim().isEmpty ? '?' : name.trim()[0].toUpperCase();
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppTheme.forest50,
        borderRadius: BorderRadius.circular(radius),
      ),
      alignment: Alignment.center,
      child: Text(
        initial,
        style: TextStyle(
          fontSize: (size ?? 72) * 0.38,
          fontWeight: FontWeight.w800,
          color: AppTheme.emeraldDark,
        ),
      ),
    );
  }
}
