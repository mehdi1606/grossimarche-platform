-- Client types: the commercial segment a customer belongs to - patisserie, epicerie, laiterie.
--
-- The types are data, not code. Adding "restaurant" or "cafe" next season is a row the admin
-- creates, never a deployment: hard-coding them would put a business decision in a Java enum
-- and a migration behind every new segment.
--
-- This table is the anchor for what follows: a customer is attached to exactly one type at
-- registration, and every price in the catalogue is then resolved per type. Products and
-- bundles get their per-type price tables in a later migration; this one only establishes the
-- segments themselves.

CREATE TABLE client_types
(
    id          UUID         PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    -- Stable identifier for URLs and imports. Derived from the name, but independent of it:
    -- renaming "Epicerie" to "Epicier" must not invalidate anything that already points here.
    slug        VARCHAR(120) NOT NULL UNIQUE,
    description VARCHAR(500),
    -- Presentation order in the registration chooser. The admin decides what comes first.
    sort_order  INTEGER      NOT NULL DEFAULT 0,
    -- Retiring a segment must not delete it: existing customers and priced products still
    -- reference it. Inactive means "no longer offered at registration", not "gone".
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Case-insensitive uniqueness on the name: "Patisserie" and "patisserie" are the same segment,
-- and two of them would silently split a price list in two.
CREATE UNIQUE INDEX uq_client_types_name_lower ON client_types (lower(name));

-- The registration chooser reads exactly this: active types, in the admin's order.
CREATE INDEX idx_client_types_active ON client_types (active, sort_order);
