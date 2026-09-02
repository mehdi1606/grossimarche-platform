-- Delivery zones: the cities served, what each one costs, and the districts inside them.
--
-- These rates were configuration (grossimarche.pricing.city-fees in application.yml), which
-- meant every price change was a redeploy. A delivery rate is a commercial decision that moves
-- with fuel and with a new driver's round, so it belongs in a table the merchant edits.
--
-- Districts are not priced. A city is one round for one van, so the fee is the city's; the
-- districts exist so an address is picked from a list instead of typed - a delivery address
-- free-typed as "ain sebaa" / "Aïn Sebaâ" / "AinSebaa" is three addresses to a driver.

CREATE TABLE delivery_cities
(
    id           UUID           PRIMARY KEY,
    name         VARCHAR(100)   NOT NULL,
    -- Stable key, so a rename never orphans an address that points here.
    slug         VARCHAR(120)   NOT NULL UNIQUE,
    -- What delivery to this city costs. 0 is meaningful: it is free delivery, not "unset".
    delivery_fee NUMERIC(12, 2) NOT NULL CHECK (delivery_fee >= 0),
    sort_order   INTEGER        NOT NULL DEFAULT 0,
    -- Suspending a city (a driver leaves, a road closes) must not delete the addresses in it.
    active       BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- "Casablanca" and "casablanca" are one city, and two of them would be two different rates for
-- the same van.
CREATE UNIQUE INDEX uq_delivery_cities_name_lower ON delivery_cities (lower(name));
CREATE INDEX idx_delivery_cities_active ON delivery_cities (active, sort_order);

CREATE TABLE delivery_districts
(
    id         UUID         PRIMARY KEY,
    city_id    UUID         NOT NULL REFERENCES delivery_cities (id) ON DELETE CASCADE,
    name       VARCHAR(120) NOT NULL,
    sort_order INTEGER      NOT NULL DEFAULT 0,
    active     BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_delivery_districts UNIQUE (city_id, name)
);

CREATE INDEX idx_delivery_districts_city ON delivery_districts (city_id, sort_order);

-- ---------------------------------------------------------------------------------------
-- The rounds actually served today. Seeded rather than left empty: these are real rates the
-- merchant is already quoting, and an empty table would silently fall back to the flat fee on
-- the first order after deployment.
--
-- Mohammedia keeps the 0.00 it had in application.yml - free delivery on the home round.
INSERT INTO delivery_cities (id, name, slug, delivery_fee, sort_order, active)
VALUES (gen_random_uuid(), 'Casablanca',  'casablanca',  30.00, 1, TRUE),
       (gen_random_uuid(), 'Mohammedia',  'mohammedia',   0.00, 2, TRUE),
       (gen_random_uuid(), 'Benslimane',  'benslimane',  35.00, 3, TRUE),
       (gen_random_uuid(), 'Bouznika',    'bouznika',    35.00, 4, TRUE);

INSERT INTO delivery_districts (id, city_id, name, sort_order, active)
SELECT gen_random_uuid(), c.id, d.name, d.ord, TRUE
FROM delivery_cities c
         JOIN (VALUES ('casablanca', 'Aïn Harrouda', 1),
                      ('casablanca', 'Zenata', 2),
                      ('casablanca', 'Sidi Bernoussi', 3),
                      ('casablanca', 'Aïn Sebaâ', 4),
                      ('casablanca', 'Sidi Moumen', 5),
                      ('casablanca', 'Hay Mohammadi', 6),
                      ('casablanca', 'Roches Noires', 7),
                      ('casablanca', 'Belvédère', 8),
                      ('casablanca', 'Centre-ville', 9),
                      ('casablanca', 'Derb Omar', 10),
                      ('casablanca', 'Mers Sultan', 11),
                      ('casablanca', 'Maârif', 12),
                      ('casablanca', 'Gauthier', 13),
                      ('casablanca', 'Racine', 14),
                      ('casablanca', 'Bourgogne', 15),
                      ('casablanca', 'Anfa', 16),
                      ('casablanca', 'Aïn Diab', 17),
                      ('casablanca', 'Aïn Chock', 18),
                      ('casablanca', 'Sidi Maârouf', 19),
                      ('casablanca', 'Hay Hassani', 20),
                      ('casablanca', 'Oulfa', 21),
                      ('mohammedia', 'Beni Yakhlef', 1),
                      ('mohammedia', 'Sidi Moussa Ben Lmejdoub', 2),
                      ('mohammedia', 'Sidi Moussa Ben Ali', 3)
              ) AS d(city_slug, name, ord) ON c.slug = d.city_slug;
