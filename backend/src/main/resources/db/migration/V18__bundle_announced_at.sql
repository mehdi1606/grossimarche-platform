-- When a bundle offer was announced to its customers, so it is announced once and not again.
--
-- The announcement used to be a manual button only: an offer could be created, priced and left
-- live without a single customer ever hearing about it. It now goes out by itself the moment
-- the offer becomes sellable, and this column is what stops every later price edit from
-- becoming another mailshot.
--
-- Left NULL on existing rows on purpose: no offer here has ever been announced, so the first
-- one that is saved gets its announcement. From then on, once each, for good.
alter table bundles add column announced_at timestamptz;

comment on column bundles.announced_at is
    'When the offer was announced to customers by e-mail. NULL = never announced.';
