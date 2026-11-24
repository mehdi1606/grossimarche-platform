-- Where to reach a customer's phone.
--
-- A push notification is addressed to a device, not to a person: one customer may have the app
-- on a phone and a tablet, and the same phone may be shared by two accounts in a shop. The row
-- therefore belongs to a (user, token) pair, and the token is what Firebase hands the app.
--
-- Tokens rotate on their own - after a reinstall, a restore, or months of silence - so the app
-- re-registers at every sign-in and the server moves the row to whoever signed in last rather
-- than keeping two owners for one device.
CREATE TABLE device_tokens (
    id           UUID PRIMARY KEY,
    user_id      UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token        TEXT        NOT NULL,
    platform     VARCHAR(16) NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL,
    updated_at   TIMESTAMPTZ NOT NULL,
    -- One row per device: re-registering the same token updates it instead of piling up
    -- duplicates that would each deliver the same notification.
    CONSTRAINT uq_device_tokens_token UNIQUE (token)
);

-- The send path reads every token of a set of users at once; this is the index it walks.
CREATE INDEX idx_device_tokens_user ON device_tokens (user_id);

COMMENT ON TABLE device_tokens IS
    'Firebase registration tokens, one row per device, used to push order and offer alerts.';
COMMENT ON COLUMN device_tokens.platform IS 'ANDROID, IOS or WEB - the app that registered it.';
