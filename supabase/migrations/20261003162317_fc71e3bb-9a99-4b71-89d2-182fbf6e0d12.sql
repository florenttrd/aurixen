CREATE TABLE public.canvases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_slug text NOT NULL,
  name text NOT NULL DEFAULT 'Sans titre',
  elements jsonb NOT NULL DEFAULT '[]'::jsonb,
  app_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  file_ids text[] NOT NULL DEFAULT '{}',
  bookmarks jsonb NOT NULL DEFAULT '[]'::jsonb,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.canvases TO authenticated;
GRANT ALL ON public.canvases TO service_role;
ALTER TABLE public.canvases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own canvases" ON public.canvases FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX canvases_user_project_idx ON public.canvases (user_id, project_slug);
CREATE TRIGGER canvases_updated BEFORE UPDATE ON public.canvases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();