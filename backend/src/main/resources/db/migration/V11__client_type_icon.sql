-- An icon for each client type.
--
-- Stored as a key ("bakery", "dairy", "grocery"), never as markup or an emoji. A key survives a
-- redesign: the storefront and the back-office each map it to their own component, so changing
-- the icon set is a front-end edit rather than a data migration. An emoji would also render
-- differently on every operating system, which is not what a shop sign should do.
--
-- Nullable: types created before this migration have none, and the interfaces fall back to a
-- neutral storefront glyph rather than a hole.

ALTER TABLE client_types
    ADD COLUMN icon VARCHAR(40);
