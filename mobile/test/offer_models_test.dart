import 'package:flutter_test/flutter_test.dart';
import 'package:market_food/features/offers/data/offer_models.dart';

void main() {
  Map<String, dynamic> offer({double? price}) => {
    'slug': 'panier-epicerie',
    'name': 'Panier épicerie',
    'price': price,
    'componentsTotal': price == null ? null : 410.5,
    'savings': price == null ? 0 : 81.5,
    'savingsPercent': price == null ? 0 : 20,
    'available': true,
    'items': [
      {
        'productId': 'p1',
        'name': 'Riz',
        'unit': 'kg',
        'quantity': 10,
        'available': true,
      },
    ],
  };

  test('an offer with no price is not for this customer', () {
    // Same rule as the announcement e-mails: a basket carries a price per trade, and one
    // with none for this customer is on sale to somebody else.
    expect(Offer.fromJson(offer(price: null)).isForThisCustomer, isFalse);
    expect(Offer.fromJson(offer(price: 329)).isForThisCustomer, isTrue);
  });

  test('reads the basket contents and the saving', () {
    final o = Offer.fromJson(offer(price: 329));
    expect(o.items.single.quantity, 10);
    expect(o.savings, 81.5);
    expect(o.savingsPercent, 20);
  });

  test('takes the Arabic the shop wrote when it wrote one', () {
    final translated = Offer.fromJson({
      ...offer(price: 329),
      'nameAr': 'سلة البقالة',
      'description': 'Dix produits de base.',
      'descriptionAr': 'عشرة منتجات أساسية.',
    });
    expect(translated.nameAr, 'سلة البقالة');
    expect(translated.descriptionAr, 'عشرة منتجات أساسية.');

    // Untranslated baskets must stay null rather than empty: that is what sends the name to
    // the translation service instead of drawing a blank label.
    final plain = Offer.fromJson({...offer(price: 329), 'nameAr': ''});
    expect(plain.nameAr, isNull);
    expect(plain.descriptionAr, isNull);
  });
}
