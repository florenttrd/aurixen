ALTER TABLE public.pins ADD COLUMN IF NOT EXISTS external_id text;
CREATE UNIQUE INDEX IF NOT EXISTS pins_user_external_id_key ON public.pins (user_id, external_id) WHERE external_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS sales_user_external_id_key ON public.sales (user_id, external_id) WHERE external_id IS NOT NULL;