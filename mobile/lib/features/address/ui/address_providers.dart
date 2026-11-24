import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers.dart';
import '../data/address_models.dart';
import '../data/address_repository.dart';

final addressRepositoryProvider = Provider<AddressRepository>(
  (ref) => AddressRepository(ref.watch(apiClientProvider)),
);

/// This account's addresses - rebuilt when the account changes (see accountKeyProvider).
final addressesProvider = FutureProvider<List<Address>>((ref) {
  ref.watch(accountKeyProvider);
  return ref.watch(addressRepositoryProvider).list();
});

/// The cities served. The same for everyone, so not tied to the account.
final deliveryCitiesProvider = FutureProvider<List<DeliveryCity>>(
  (ref) => ref.watch(addressRepositoryProvider).cities(),
);
