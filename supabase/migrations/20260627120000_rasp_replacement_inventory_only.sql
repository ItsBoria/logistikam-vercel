-- Make the RASP dashboard replacement tracking use the replacement inventory catalog only.
-- This is safe to run after the earlier RASP dashboard migration.

DO $$
BEGIN
  IF to_regclass('public.item_catalog_requests') IS NOT NULL THEN
    ALTER TABLE public.item_catalog_requests
      ADD COLUMN IF NOT EXISTS suggested_category text;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.team_replacement_items') IS NOT NULL THEN
    ALTER TABLE public.team_replacement_items
      DROP CONSTRAINT IF EXISTS team_replacement_items_product_id_fkey;

    ALTER TABLE public.team_replacement_items
      ADD CONSTRAINT team_replacement_items_product_id_fkey
      FOREIGN KEY (product_id)
      REFERENCES public.replacement_products(id)
      ON DELETE RESTRICT;
  END IF;
END $$;
