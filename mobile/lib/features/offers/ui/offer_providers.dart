import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../data/offer_models.dart';
import '../data/offer_repository.dart';

final offerRepositoryProvider = Provider<OfferRepository>(
  (ref) => OfferRepository(ref.watch(apiClientProvider)),
);

/// Priced per trade, so tied to the account (see accountKeyProvider).
final offersProvider = FutureProvider<List<Offer>>((ref) {
  ref.watch(accountKeyProvider);
  return ref.watch(offerRepositoryProvider).forMe();
});

/// The baskets that include a product, for that product's page.
final offersContainingProvider = FutureProvider.family<List<Offer>, String>((
  ref,
  productId,
) {
  ref.watch(accountKeyProvider);
  return ref.watch(offerRepositoryProvider).containing(productId);
});

final offerProvider = FutureProvider.family<Offer, String>((ref, slug) {
  ref.watch(accountKeyProvider);
  return ref.watch(offerRepositoryProvider).bySlug(slug);
});
