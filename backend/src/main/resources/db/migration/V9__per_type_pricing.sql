-- Per-client-type pricing: what each commercial segment pays.
--
-- One table carries a segment's whole price ladder for a product. The row at min_quantity = 1
-- IS that segment's base price; the rows above it are its quantity breaks. Splitting "base
-- price" and "tiers" into two tables would let them disagree - a tier cheaper than the base at
-- quantity 1, a base with no tier ladder - and every read would have to reconcile them.
--
-- Nothing falls back. A product with no row for a segment is not "sold at the old price" to
-- that segment: it is invisible to it. That is a deliberate choice - a silent fallback would
-- quietly sell at the wrong price, which costs more than an absent product.
--
-- products.price stays, but stops being a customer-facing figure: it becomes the internal
-- reference (list price) the back-office prices against. No shopper reads it once the
-- storefront resolves per segment.

CREATE TABLE product_type_prices
(
    id             UUID           PRIMARY KEY,
    product_id     UUID           NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    -- RESTRICT, not CASCADE: a segment is retired by deactivating it, never deleted. If one
    -- ever were, taking a live price grid down with it is the last thing that should happen.
    client_type_id UUID           NOT NULL REFERENCES client_types (id) ON DELETE RESTRICT,
    -- 1 = the segment's base price. Higher values are its quantity breaks.
    min_quantity   INTEGER        NOT NULL CHECK (min_quantity >= 1),
    unit_price     NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    -- One price per (product, segment, threshold): a second row for the same threshold would
    -- only be a way for the grid to disagree with itself.
    CONSTRAINT uq_product_type_prices UNIQUE (product_id, client_type_id, min_quantity)
);

-- The shape every price lookup takes: this product, this segment, ladder in order.
CREATE INDEX idx_ptp_lookup ON product_type_prices (product_id, client_type_id, min_quantity);
-- Answers "which products are priced for this segment?", which is what the catalogue filters
-- on for every listing once products are invisible where they have no price.
CREATE INDEX idx_ptp_type ON product_type_prices (client_type_id);

-- Bundles are priced per segment for the same reason products are: a basket that saves a
-- pastry shop 12% does not save a grocer the same, because its components do not cost them
-- the same either.
CREATE TABLE bundle_type_prices
(
    id             UUID           PRIMARY KEY,
    bundle_id      UUID           NOT NULL REFERENCES bundles (id) ON DELETE CASCADE,
    client_type_id UUID           NOT NULL REFERENCES client_types (id) ON DELETE RESTRICT,
    price          NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    CONSTRAINT uq_bundle_type_prices UNIQUE (bundle_id, client_type_id)
);

CREATE INDEX idx_btp_bundle ON bundle_type_prices (bundle_id);

-- Which segment a customer belongs to. Nullable: staff accounts have no commercial segment,
-- and neither has a customer until they pick one at sign-up.
ALTER TABLE users
    ADD COLUMN client_type_id UUID REFERENCES client_types (id) ON DELETE RESTRICT;

CREATE INDEX idx_users_client_type ON users (client_type_id);
