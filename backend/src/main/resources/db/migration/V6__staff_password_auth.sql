-- Password authentication for back-office accounts.
--
-- Customers keep the passwordless OTP flow: the storefront is unchanged and `password_hash`
-- stays NULL for every CLIENT. Only ADMIN / STORE_MANAGER accounts get a password, because
-- the back-office is opened many times a day and waiting on an SMS each time is friction that
-- buys no extra safety for an account that is already restricted by role.
--
-- The column is deliberately nullable: an account without a hash simply cannot sign in with a
-- password, which is what we want for clients and for staff who have not been given one yet.

ALTER TABLE users
    ADD COLUMN password_hash        VARCHAR(100),
    ADD COLUMN password_updated_at  TIMESTAMPTZ,
    -- Set when a password was generated for the account rather than chosen by its owner.
    ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

-- Sign-in matches the e-mail case-insensitively ("Admin@x.ma" and "admin@x.ma" are the same
-- mailbox); without this index that lookup would sequentially scan the table.
CREATE INDEX idx_users_email_lower ON users (lower(email));
