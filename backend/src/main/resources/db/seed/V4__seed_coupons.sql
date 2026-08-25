-- =====================================================================================
-- Grossimarché - seed coupons (V4). Loaded ONLY under the local profile (extra Flyway
-- location classpath:db/seed), so demo codes never exist in production. Two examples:
-- a percentage welcome code (capped) and a fixed-amount code with a minimum basket.
-- =====================================================================================

INSERT INTO coupons (id, code, type, value, min_order_subtotal, max_discount,
                     starts_at, expires_at, usage_limit, per_user_limit, active)
VALUES
    (gen_random_uuid(), 'BIENVENUE10', 'PERCENTAGE', 10.00, 0.00, 100.00,
     now() - INTERVAL '1 day', now() + INTERVAL '365 days', NULL, 1, TRUE),
    (gen_random_uuid(), 'GROSSI50', 'FIXED', 50.00, 500.00, NULL,
     now() - INTERVAL '1 day', now() + INTERVAL '365 days', 1000, 3, TRUE);
