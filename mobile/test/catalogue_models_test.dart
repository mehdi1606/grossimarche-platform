import 'package:flutter_test/flutter_test.dart';
import 'package:market_food/features/catalogue/data/catalogue_models.dart';
import 'package:market_food/features/catalogue/ui/catalogue_providers.dart';

void main() {
  group('Arabic from the catalogue', () {
    test('is read when the shop has written one, and null when not', () {
      final translated = Category.fromJson({
        'id': 'c1',
        'name': 'Épicerie',
        'nameAr': 'بقالة',
        'slug': 'epicerie',
        'productCount': 12,
      });
      expect(translated.nameAr, 'بقالة');

      // Untranslated rows come back with the field absent or blank; both mean "fall back to
      // the translation service", which only a null can say.
      expect(
        Category.fromJson({'id': 'c2', 'name': 'Boissons'}).nameAr,
        isNull,
      );
      expect(
        Category.fromJson({'id': 'c3', 'name': 'Boissons', 'nameAr': '  '})
            .nameAr,
        isNull,
      );
    });

    test('products carry it for the name and the description', () {
      final detail = ProductDetail.fromJson({
        'id': 'p1',
        'name': 'Riz basmati 25 kg',
        'nameAr': 'أرز بسمتي 25 كغ',
        'description': 'Sac de 25 kg.',
        'descriptionAr': 'كيس 25 كغ.',
        'unit': 'sac',
        'stockQuantity': 40,
        'minOrderQuantity': 2,
      });
      expect(detail.nameAr, 'أرز بسمتي 25 كغ');
      expect(detail.descriptionAr, 'كيس 25 كغ.');
    });
  });

  group('ProductSummary price tiers', () {
    Map<String, dynamic> summary({double? price, List<Object>? tiers}) => {
      'id': 'p1',
      'name': 'Huile 5 L',
      'slug': 'huile-5l',
      'unit': 'bidon',
      'inStock': true,
      'minOrderQuantity': 6,
      'price': price,
      'hasQuantityDiscount': tiers != null,
      'priceTiers': tiers ?? const [],
    };

    test('reads the ladder the grid now prints', () {
      final product = ProductSummary.fromJson(
        summary(
          price: 12.5,
          tiers: [
            {'minQuantity': 12, 'unitPrice': 12.0},
            {'minQuantity': 24, 'unitPrice': 11.5},
          ],
        ),
      );
      expect(product.priceTiers.length, 2);
      expect(product.bestTier?.minQuantity, 24);
      expect(product.bestTier?.unitPrice, 11.5);
    });

    test('picks the cheapest rung whatever order the API sent them in', () {
      final product = ProductSummary.fromJson(
        summary(
          price: 12.5,
          tiers: [
            {'minQuantity': 24, 'unitPrice': 11.5},
            {'minQuantity': 12, 'unitPrice': 12.0},
          ],
        ),
      );
      expect(product.bestTier?.minQuantity, 24);
    });

    test('has no rung to show without a ladder', () {
      expect(ProductSummary.fromJson(summary(price: 12.5)).bestTier, isNull);
    });

    test('shows no rung to an account that may not see prices', () {
      // Same rule as PriceLabel: a pending account reads "Prix sur validation du compte", and
      // a tier price under it would contradict the only honest line on the card.
      final product = ProductSummary.fromJson(
        summary(
          tiers: [
            {'minQuantity': 24, 'unitPrice': 11.5},
          ],
        ),
      );
      expect(product.price, isNull);
      expect(product.bestTier, isNull);
    });
  });

  group('ProductDetail attributes', () {
    test('follow the order the back office gave them', () {
      final detail = ProductDetail.fromJson({
        'id': 'p1',
        'name': 'Riz',
        'unit': 'kg',
        'attributes': [
          {'id': 'a1', 'name': 'Poids net', 'value': '25 kg', 'displayOrder': 2},
          {'id': 'a2', 'name': 'Origine', 'value': 'Maroc', 'displayOrder': 1},
        ],
      });
      expect(detail.attributes.map((a) => a.name), ['Origine', 'Poids net']);
    });

    test('drop the half-filled rows that would draw as a hole', () {
      final detail = ProductDetail.fromJson({
        'id': 'p1',
        'name': 'Riz',
        'unit': 'kg',
        'attributes': [
          {'name': 'Origine', 'value': 'Maroc'},
          {'name': 'Calibre', 'value': '  '},
          {'name': '', 'value': 'orphelin'},
        ],
      });
      expect(detail.attributes.single.value, 'Maroc');
    });

    test('are empty, not null, for the products that have none', () {
      final detail = ProductDetail.fromJson({
        'id': 'p1',
        'name': 'Riz',
        'unit': 'kg',
      });
      expect(detail.attributes, isEmpty);
    });
  });

  group('ProductSort', () {
    test('sends the values the server switches on', () {
      expect(ProductSort.newest.api, 'relevance');
      expect(ProductSort.priceAsc.api, 'price_asc');
      expect(ProductSort.priceDesc.api, 'price_desc');
      expect(ProductSort.alphabetical.api, 'name');
    });
  });

  group('CatalogueFilter', () {
    const empty = (
      categoryId: null,
      query: '',
      sort: ProductSort.newest,
      minPrice: null,
      maxPrice: null,
      inStockOnly: false,
    );

    test('counts only what the sheet holds, for the badge', () {
      expect(empty.refinementCount, 0);
      // The category and the search box have their own controls on screen, so neither is
      // part of the number on the filter button.
      expect(
        (
          categoryId: 'c1',
          query: 'riz',
          sort: ProductSort.newest,
          minPrice: null,
          maxPrice: null,
          inStockOnly: false,
        ).refinementCount,
        0,
      );
      expect(
        (
          categoryId: null,
          query: '',
          sort: ProductSort.priceAsc,
          minPrice: 10.0,
          maxPrice: 50.0,
          inStockOnly: true,
        ).refinementCount,
        4,
      );
    });

    test('knows when the customer is browsing rather than searching', () {
      expect(empty.isBrowsing, isTrue);
      // The showcase gives way, and the empty state offers to clear, as soon as anything at
      // all narrows the catalogue - a price bound included.
      expect(
        (
          categoryId: null,
          query: '',
          sort: ProductSort.newest,
          minPrice: 10.0,
          maxPrice: null,
          inStockOnly: false,
        ).isBrowsing,
        isFalse,
      );
    });
  });
}
