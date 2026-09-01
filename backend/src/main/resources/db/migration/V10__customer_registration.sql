-- Customer sign-up and admin validation.
--
-- Wholesale is not retail: an account is a trade relationship, so a shop registers, states what
-- kind of business it is, and waits for the merchant to recognise it before it can buy. Until
-- then it can sign in to nothing and sees no prices - which is the whole point, since prices
-- here are per segment and confidential.
--
-- users.status carries the state. It is a plain VARCHAR with no CHECK constraint, so PENDING
-- and REJECTED join ACTIVE/BLOCKED/DELETED in the application enum with no schema change.

ALTER TABLE users
    -- The trading name, which is what the admin actually recognises at validation time - a
    -- person's name means nothing when deciding whether a business is a real customer.
    ADD COLUMN business_name    VARCHAR(150),
    ADD COLUMN city             VARCHAR(100),
    -- Who validated, and when. A trade account being opened is a commercial decision, and
    -- "who let this one in" is a question that gets asked later.
    ADD COLUMN approved_at      TIMESTAMPTZ,
    ADD COLUMN approved_by      UUID REFERENCES users (id) ON DELETE SET NULL,
    -- Kept so a refusal can be explained to the applicant rather than leaving them guessing,
    -- and so a second look at the file shows why it was turned down the first time.
    ADD COLUMN rejection_reason VARCHAR(500);

-- The back-office queue: pending customers, oldest first. Partial, because that queue is a
-- handful of rows next to a table of every customer who ever registered.
CREATE INDEX idx_users_pending ON users (created_at) WHERE status = 'PENDING';

-- Sign-in resolves an account by e-mail; the lower() index already exists from V6 for staff,
-- and now carries customer logins too.
