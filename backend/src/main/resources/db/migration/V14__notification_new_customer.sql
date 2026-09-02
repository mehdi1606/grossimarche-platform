-- =====================================================================================
-- V14 — back-office notifications for customer sign-ups.
--
-- The notifications table constrains `type` to a fixed list, so NEW_CUSTOMER has to be
-- admitted here before the application can insert one. Constraint-only change: no data is
-- read, written or moved, and every existing row already satisfies the wider list.
-- =====================================================================================

ALTER TABLE notifications
    DROP CONSTRAINT IF EXISTS ck_notification_type;

ALTER TABLE notifications
    ADD CONSTRAINT ck_notification_type
        CHECK (type IN ('NEW_ORDER', 'NEW_CUSTOMER', 'LOW_STOCK', 'SYSTEM'));
