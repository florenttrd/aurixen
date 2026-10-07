CREATE TABLE public.connector_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connector_id text NOT NULL,
  label text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'not_connected',
  last_sync_at timestamptz,
  items_count integer NOT NULL DEFAULT 0,
  last_error text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connector_accounts TO authenticated;
GRANT ALL ON public.connector_accounts TO service_role;
ALTER TABLE public.connector_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own connector accounts" ON public.connector_accounts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX ON public.connector_accounts (user_id, connector_id);
CREATE TRIGGER connector_accounts_updated BEFORE UPDATE ON public.connector_accounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.project_connectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_slug text NOT NULL,
  connector_id text NOT NULL,
  account_id uuid REFERENCES public.connector_accounts(id) ON DELETE SET NULL,
  enabled boolean NOT NULL DEFAULT true,
  mode text,
  granted_permissions text[] NOT NULL DEFAULT '{}',
  allowed_folders jsonb NOT NULL DEFAULT '[]'::jsonb,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, project_slug, connector_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_connectors TO authenticated;
GRANT ALL ON public.project_connectors TO service_role;
ALTER TABLE public.project_connectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own project connectors" ON public.project_connectors FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER project_connectors_updated BEFORE UPDATE ON public.project_connectors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.connected_objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_slug text NOT NULL,
  account_id uuid REFERENCES public.connector_accounts(id) ON DELETE SET NULL,
  source text NOT NULL,
  kind text NOT NULL,
  external_id text NOT NULL,
  title text NOT NULL DEFAULT '',
  url text,
  image_url text,
  mime_type text,
  occurred_at timestamptz,
  product text,
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, project_slug, source, external_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connected_objects TO authenticated;
GRANT ALL ON public.connected_objects TO service_role;
ALTER TABLE public.connected_objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own connected objects" ON public.connected_objects FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX ON public.connected_objects (user_id, project_slug, source);
CREATE TRIGGER connected_objects_updated BEFORE UPDATE ON public.connected_objects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.connected_object_raw (
  object_id uuid PRIMARY KEY REFERENCES public.connected_objects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connected_object_raw TO authenticated;
GRANT ALL ON public.connected_object_raw TO service_role;
ALTER TABLE public.connected_object_raw ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own raw objects" ON public.connected_object_raw FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.object_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_slug text NOT NULL,
  object_type text NOT NULL,
  object_id uuid NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  role text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, object_type, object_id, target_type, target_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.object_links TO authenticated;
GRANT ALL ON public.object_links TO service_role;
ALTER TABLE public.object_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own object links" ON public.object_links FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.pins ADD COLUMN account_id uuid REFERENCES public.connector_accounts(id) ON DELETE SET NULL, ADD COLUMN last_synced_at timestamptz;
ALTER TABLE public.sales ADD COLUMN account_id uuid REFERENCES public.connector_accounts(id) ON DELETE SET NULL, ADD COLUMN last_synced_at timestamptz;