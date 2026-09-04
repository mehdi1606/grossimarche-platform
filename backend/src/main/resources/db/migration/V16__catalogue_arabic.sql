-- Arabic copy for the catalogue, stored rather than produced on every read.
--
-- Until now the storefront asked LibreTranslate for a product's name at the moment it drew the
-- page. Measured on this machine: 5-9 ms once a string is cached, but 2.1 s the first time one
-- is seen, and a batch of twelve fresh strings took 3.0 s - which every visitor pays for every
-- product nobody has looked at yet in Arabic.
--
-- Worse than the wait, the result could not be corrected. "Bidon de vinaigre blanc" came back
-- as "زهرة الفينجار الأبيض" - "the flower of the finjar" - and, being cached, that was then
-- served to every Arabic-speaking customer indefinitely. One string in twelve came back in
-- French, untranslated, and was cached too.
--
-- These columns move the translation to write time: the back-office fills them once when the
-- product is saved, a human can fix the machine's mistakes in the same form, and reading is a
-- column read. NULL keeps the old behaviour for rows nobody has translated yet, so nothing
-- breaks while the catalogue is filled in.

ALTER TABLE products
    ADD COLUMN name_ar        VARCHAR(200),
    ADD COLUMN description_ar TEXT;

ALTER TABLE categories
    ADD COLUMN name_ar VARCHAR(100);

ALTER TABLE bundles
    ADD COLUMN name_ar        VARCHAR(150),
    ADD COLUMN description_ar VARCHAR(1000);

COMMENT ON COLUMN products.name_ar IS
    'Arabic name. Machine-filled on save, correctable by hand; NULL falls back to runtime translation.';
COMMENT ON COLUMN categories.name_ar IS
    'Arabic name. Machine-filled on save, correctable by hand; NULL falls back to runtime translation.';
COMMENT ON COLUMN bundles.name_ar IS
    'Arabic name. Machine-filled on save, correctable by hand; NULL falls back to runtime translation.';
