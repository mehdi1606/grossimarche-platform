-- =====================================================================================
-- Grossimarché - seed data (V2). Loaded ONLY under the local profile (and the schema
-- verification test), via the extra Flyway location classpath:db/seed.
-- 8 categories, 24 realistic Moroccan wholesale products, price tiers on 8 of them,
-- and 4 stores. FKs are resolved by slug so no UUIDs are hardcoded.
-- =====================================================================================

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
INSERT INTO categories (id, name, slug, icon, display_order, active) VALUES
    (gen_random_uuid(), 'Riz & Céréales',       'riz-cereales',        'grain',     1, TRUE),
    (gen_random_uuid(), 'Huiles',               'huiles',              'oil',       2, TRUE),
    (gen_random_uuid(), 'Farines & Semoules',   'farines-semoules',    'wheat',     3, TRUE),
    (gen_random_uuid(), 'Sucre',                'sucre',               'cube',      4, TRUE),
    (gen_random_uuid(), 'Thé & Café',           'the-cafe',            'cup',       5, TRUE),
    (gen_random_uuid(), 'Conserves',            'conserves',           'can',       6, TRUE),
    (gen_random_uuid(), 'Boissons',             'boissons',            'bottle',    7, TRUE),
    (gen_random_uuid(), 'Détergents & Hygiène', 'detergents-hygiene',  'soap',      8, TRUE);

-- ---------------------------------------------------------------------------
-- Products (3 per category). Prices in MAD, wholesale units.
-- ---------------------------------------------------------------------------
INSERT INTO products (id, category_id, name, slug, description, price, unit, stock_quantity, min_order_quantity, active, version)
VALUES
-- Riz & Céréales
(gen_random_uuid(), (SELECT id FROM categories WHERE slug='riz-cereales'), 'Riz long grain (sac 25 kg)', 'riz-long-grain-25kg', 'Riz long grain de qualité supérieure, sac de 25 kg.', 289.00, 'sac 25 kg', 150, 1, TRUE, 0),
(gen_random_uuid(), (SELECT id FROM categories WHERE slug='riz-cereales'), 'Riz rond (sac 25 kg)', 'riz-rond-25kg', 'Riz rond pour préparations traditionnelles, sac de 25 kg.', 269.00, 'sac 25 kg', 90, 1, TRUE, 0),
(gen_random_uuid(), (SELECT id FROM categories WHERE slug='riz-cereales'), 'Lentilles (sac 10 kg)', 'lentilles-10kg', 'Lentilles brunes triées, sac de 10 kg.', 145.00, 'sac 10 kg', 80, 1, TRUE, 0),
-- Huiles
(gen_random_uuid(), (SELECT id FROM categories WHERE slug='huiles'), 'Huile de table (carton 12x1 L)', 'huile-table-12x1l', 'Huile végétale raffinée, carton de 12 bouteilles de 1 L.', 216.00, 'carton 12x1 L', 200, 1, TRUE, 0),
(gen_random_uuid(), (SELECT id FROM categories WHERE slug='huiles'), 'Huile de tournesol (bidon 5 L)', 'huile-tournesol-5l', 'Huile de tournesol, bidon de 5 L.', 98.00, 'bidon 5 L', 130, 1, TRUE, 0),
(gen_random_uuid(), (SELECT id FROM categories WHERE slug='huiles'), 'Huile d''olive (bidon 5 L)', 'huile-olive-5l', 'Huile d''olive vierge, bidon de 5 L.', 385.00, 'bidon 5 L', 60, 1, TRUE, 0),
-- Farines & Semoules
(gen_random_uuid(), (SELECT id FROM categories WHERE slug='farines-semoules'), 'Farine de blé (sac 50 kg)', 'farine-ble-50kg', 'Farine de blé tout usage, sac de 50 kg.', 315.00, 'sac 50 kg', 110, 1, TRUE, 0),
(gen_random_uuid(), (SELECT id FROM categories WHERE slug='farines-semoules'), 'Semoule fine (sac 25 kg)', 'semoule-fine-25kg', 'Semoule de blé dur fine, sac de 25 kg.', 178.00, 'sac 25 kg', 95, 1, TRUE, 0),
(gen_random_uuid(), (SELECT id FROM categories WHERE slug='farines-semoules'), 'Semoule grosse (sac 25 kg)', 'semoule-grosse-25kg', 'Semoule de blé dur grosse, sac de 25 kg.', 176.00, 'sac 25 kg', 70, 1, TRUE, 0),
-- Sucre
(gen_random_uuid(), (SELECT id FROM categories WHERE slug='sucre'), 'Sucre en poudre (sac 50 kg)', 'sucre-poudre-50kg', 'Sucre blanc cristallisé, sac de 50 kg.', 420.00, 'sac 50 kg', 140, 1, TRUE, 0),
(gen_random_uuid(), (SELECT id FROM categories WHERE slug='sucre'), 'Sucre en morceaux (carton 24x1 kg)', 'sucre-morceaux-24kg', 'Sucre en morceaux, carton de 24 boîtes de 1 kg.', 264.00, 'carton 24x1 kg', 85, 1, TRUE, 0),
(gen_random_uuid(), (SELECT id FROM categories WHERE slug='sucre'), 'Pain de sucre (lot de 6)', 'pain-sucre-lot6', 'Pains de sucre traditionnels, lot de 6.', 132.00, 'lot de 6', 100, 1, TRUE, 0),
-- Thé & Café
(gen_random_uuid(), (SELECT id FROM categories WHERE slug='the-cafe'), 'Thé vert (carton 20x200 g)', 'the-vert-20x200g', 'Thé vert de Chine, carton de 20 paquets de 200 g.', 340.00, 'carton 20x200 g', 120, 1, TRUE, 0),
(gen_random_uuid(), (SELECT id FROM categories WHERE slug='the-cafe'), 'Café moulu (carton 12x250 g)', 'cafe-moulu-12x250g', 'Café moulu torréfié, carton de 12 paquets de 250 g.', 288.00, 'carton 12x250 g', 75, 1, TRUE, 0),
(gen_random_uuid(), (SELECT id FROM categories WHERE slug='the-cafe'), 'Thé à la menthe (carton 20x200 g)', 'the-menthe-20x200g', 'Mélange thé vert et menthe séchée, carton de 20x200 g.', 360.00, 'carton 20x200 g', 65, 1, TRUE, 0),
-- Conserves
(gen_random_uuid(), (SELECT id FROM categories WHERE slug='conserves'), 'Thon à l''huile (carton 48 boîtes)', 'thon-huile-48', 'Thon à l''huile végétale, carton de 48 boîtes de 160 g.', 456.00, 'carton 48 boîtes', 90, 1, TRUE, 0),
(gen_random_uuid(), (SELECT id FROM categories WHERE slug='conserves'), 'Concentré de tomate (carton 24 boîtes)', 'tomate-concentre-24', 'Double concentré de tomate, carton de 24 boîtes de 800 g.', 312.00, 'carton 24 boîtes', 110, 1, TRUE, 0),
(gen_random_uuid(), (SELECT id FROM categories WHERE slug='conserves'), 'Sardines (carton 50 boîtes)', 'sardines-50', 'Sardines à l''huile, carton de 50 boîtes de 125 g.', 375.00, 'carton 50 boîtes', 80, 1, TRUE, 0),
-- Boissons
(gen_random_uuid(), (SELECT id FROM categories WHERE slug='boissons'), 'Eau minérale (pack 12x1,5 L)', 'eau-minerale-12x1500', 'Eau minérale naturelle, pack de 12 bouteilles de 1,5 L.', 66.00, 'pack 12x1,5 L', 300, 1, TRUE, 0),
(gen_random_uuid(), (SELECT id FROM categories WHERE slug='boissons'), 'Soda cola (pack 24x33 cl)', 'soda-cola-24x33cl', 'Boisson gazeuse cola, pack de 24 canettes de 33 cl.', 138.00, 'pack 24x33 cl', 160, 1, TRUE, 0),
(gen_random_uuid(), (SELECT id FROM categories WHERE slug='boissons'), 'Jus d''orange (carton 12x1 L)', 'jus-orange-12x1l', 'Jus d''orange, carton de 12 briques de 1 L.', 144.00, 'carton 12x1 L', 90, 1, TRUE, 0),
-- Détergents & Hygiène
(gen_random_uuid(), (SELECT id FROM categories WHERE slug='detergents-hygiene'), 'Lessive en poudre (sac 15 kg)', 'lessive-poudre-15kg', 'Lessive en poudre multi-usage, sac de 15 kg.', 198.00, 'sac 15 kg', 120, 1, TRUE, 0),
(gen_random_uuid(), (SELECT id FROM categories WHERE slug='detergents-hygiene'), 'Savon de Marseille (carton 40 pains)', 'savon-marseille-40', 'Savon de Marseille, carton de 40 pains de 200 g.', 176.00, 'carton 40 pains', 100, 1, TRUE, 0),
(gen_random_uuid(), (SELECT id FROM categories WHERE slug='detergents-hygiene'), 'Eau de javel (carton 12x2 L)', 'javel-12x2l', 'Eau de javel, carton de 12 bouteilles de 2 L.', 108.00, 'carton 12x2 L', 140, 1, TRUE, 0);

-- ---------------------------------------------------------------------------
-- Quantity-discount tiers on 8 products
-- ---------------------------------------------------------------------------
INSERT INTO product_price_tiers (id, product_id, min_quantity, unit_price)
VALUES
(gen_random_uuid(), (SELECT id FROM products WHERE slug='riz-long-grain-25kg'), 10, 279.00),
(gen_random_uuid(), (SELECT id FROM products WHERE slug='riz-long-grain-25kg'), 25, 269.00),
(gen_random_uuid(), (SELECT id FROM products WHERE slug='huile-table-12x1l'),   10, 209.00),
(gen_random_uuid(), (SELECT id FROM products WHERE slug='huile-table-12x1l'),   20, 202.00),
(gen_random_uuid(), (SELECT id FROM products WHERE slug='farine-ble-50kg'),     10, 305.00),
(gen_random_uuid(), (SELECT id FROM products WHERE slug='sucre-poudre-50kg'),   10, 408.00),
(gen_random_uuid(), (SELECT id FROM products WHERE slug='sucre-poudre-50kg'),   20, 399.00),
(gen_random_uuid(), (SELECT id FROM products WHERE slug='the-vert-20x200g'),    10, 328.00),
(gen_random_uuid(), (SELECT id FROM products WHERE slug='thon-huile-48'),       10, 442.00),
(gen_random_uuid(), (SELECT id FROM products WHERE slug='eau-minerale-12x1500'),20, 62.00),
(gen_random_uuid(), (SELECT id FROM products WHERE slug='eau-minerale-12x1500'),50, 59.00),
(gen_random_uuid(), (SELECT id FROM products WHERE slug='lessive-poudre-15kg'), 10, 190.00),
(gen_random_uuid(), (SELECT id FROM products WHERE slug='cafe-moulu-12x250g'),  10, 279.00);

-- ---------------------------------------------------------------------------
-- Stores (4 cities) with structured opening hours
-- ---------------------------------------------------------------------------
INSERT INTO stores (id, name, city, address, phone, opening_hours, lat, lng, active)
VALUES
(gen_random_uuid(), 'Grossimarché Casablanca', 'Casablanca', 'Zone Industrielle Sidi Bernoussi, Casablanca', '+212522000001',
 '{"mon":"08:00-20:00","tue":"08:00-20:00","wed":"08:00-20:00","thu":"08:00-20:00","fri":"08:00-20:00","sat":"08:00-21:00","sun":"09:00-14:00"}', 33.5731, -7.5898, TRUE),
(gen_random_uuid(), 'Grossimarché Rabat', 'Rabat', 'Quartier Industriel Youssoufia, Rabat', '+212537000002',
 '{"mon":"08:00-20:00","tue":"08:00-20:00","wed":"08:00-20:00","thu":"08:00-20:00","fri":"08:00-20:00","sat":"08:00-21:00","sun":"closed"}', 34.0209, -6.8416, TRUE),
(gen_random_uuid(), 'Grossimarché Tanger', 'Tanger', 'Zone Franche Gzenaya, Tanger', '+212539000003',
 '{"mon":"08:30-20:00","tue":"08:30-20:00","wed":"08:30-20:00","thu":"08:30-20:00","fri":"08:30-20:00","sat":"08:30-21:00","sun":"09:00-13:00"}', 35.7595, -5.8340, TRUE),
(gen_random_uuid(), 'Grossimarché Marrakech', 'Marrakech', 'Quartier Industriel Sidi Ghanem, Marrakech', '+212524000004',
 '{"mon":"08:00-20:00","tue":"08:00-20:00","wed":"08:00-20:00","thu":"08:00-20:00","fri":"08:00-20:00","sat":"08:00-21:00","sun":"09:00-14:00"}', 31.6295, -7.9811, TRUE);
