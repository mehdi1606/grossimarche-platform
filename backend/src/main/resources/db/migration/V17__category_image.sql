-- Categories carry a picture, not just a pictogram.
--
-- `icon` stays: it is the fallback for every category created before this, and it costs nothing
-- to keep rendering one when no image has been uploaded yet. A category with both shows the
-- image - a photograph of the aisle says more to a shopkeeper than a line drawing of a bottle.
ALTER TABLE categories
    ADD COLUMN image_url VARCHAR(500);
