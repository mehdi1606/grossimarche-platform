-- Every customer needs a loyalty row: points are awarded inside the checkout transaction, and a
-- missing row made the first order fail instead of the points quietly not being counted.
--
-- Only the one-time-code sign-up ever created one, so every account registered from the
-- storefront was missing it. The code now opens the account on first use; this gives the
-- existing ones theirs, so the back-office sees a complete list rather than a partial one.
INSERT INTO loyalty_accounts (user_id, points_balance, lifetime_points, tier, updated_at)
SELECT u.id, 0, 0, 'BRONZE', now()
FROM users u
WHERE u.role = 'CLIENT'
  AND NOT EXISTS (SELECT 1 FROM loyalty_accounts la WHERE la.user_id = u.id);
