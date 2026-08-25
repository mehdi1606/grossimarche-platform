-- Bundle offers ("paniers"): a named set of products sold together for less than the sum of
-- its parts - a seasonal basket, a starter pack, a restocking set.
--
-- A bundle is NOT a product and does not become an order line. It is a *rule*: when a cart
-- contains every component in at least the required quantity, checkout applies the difference
-- between the components' list prices and the bundle price as a discount. That choice keeps
-- one source of truth for stock and pricing (the products themselves), needs no change to the
-- cart or order schema, composes with quantity tiers and coupons, and degrades gracefully when
-- the shopper adds extra units or removes one component.

CREATE TABLE bundles
(
    id          UUID PRIMARY KEY,
    name        VARCHAR(150)  NOT NULL,
    slug        VARCHAR(180)  NOT NULL UNIQUE,
    description VARCHAR(1000),
    image_url   VARCHAR(500),
    -- What the whole set costs. Validated against the component total in the service layer:
    -- a bundle that saves nothing is a pricing mistake, not an offer.
    price       NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    active      BOOLEAN       NOT NULL DEFAULT TRUE,
    -- Optional window. NULL on either side means "no bound on that side".
    starts_at   TIMESTAMPTZ,
    ends_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_bundles_window CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at)
);

CREATE TABLE bundle_items
(
    id         UUID PRIMARY KEY,
    bundle_id  UUID    NOT NULL REFERENCES bundles (id) ON DELETE CASCADE,
    product_id UUID    NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
    quantity   INTEGER NOT NULL CHECK (quantity > 0),
    -- One row per product per bundle: quantity carries the count, so a duplicate line would
    -- only be a way to disagree with itself.
    CONSTRAINT uq_bundle_items UNIQUE (bundle_id, product_id)
);

CREATE INDEX idx_bundle_items_bundle ON bundle_items (bundle_id);
-- Answers "which bundles contain this product?", which the product page asks on every view.
CREATE INDEX idx_bundle_items_product ON bundle_items (product_id);
CREATE INDEX idx_bundles_active ON bundles (active);
