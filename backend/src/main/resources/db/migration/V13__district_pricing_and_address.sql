-- A district may override its city's delivery rate, and an address remembers which district
-- it is in.
--
-- One rate per city was right until it wasn't: a round that crosses Casablanca to reach Aïn
-- Harrouda is not the round that drops in Maârif, and charging both 30 DH either loses money on
-- one or overcharges the other. So a district may carry its own rate - and usually does not.
--
-- NULL is the whole point of the column: it means "same as the city", not "free". A district
-- left alone follows its city automatically, including when the city's rate changes later,
-- which is what makes twenty-one districts maintainable.

ALTER TABLE delivery_districts
    ADD COLUMN delivery_fee NUMERIC(12, 2) CHECK (delivery_fee IS NULL OR delivery_fee >= 0);

-- The district an address sits in, so the fee is resolved from the address itself rather than
-- guessed from a free-typed line. Nullable: addresses predating this, and cities with no
-- districts, have none.
ALTER TABLE addresses
    ADD COLUMN district VARCHAR(120);
