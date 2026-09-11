
-- 1. Projects: full customization
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS initials text,
  ADD COLUMN IF NOT EXISTS accent_secondary text NOT NULL DEFAULT '#f5e6b8',
  ADD COLUMN IF NOT EXISTS surface text NOT NULL DEFAULT 'noir',
  ADD COLUMN IF NOT EXISTS font_display text NOT NULL DEFAULT 'serif-luxe',
  ADD COLUMN IF NOT EXISTS font_body text NOT NULL DEFAULT 'sans-moderne',
  ADD COLUMN IF NOT EXISTS radius integer NOT NULL DEFAULT 16,
  ADD COLUMN IF NOT EXISTS effects text NOT NULL DEFAULT 'moyen',
  ADD COLUMN IF NOT EXISTS home_layout jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS home_density text NOT NULL DEFAULT 'cartes',
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS projects_updated ON public.projects;
CREATE TRIGGER projects_updated BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Modules activated per project
CREATE TABLE IF NOT EXISTS public.project_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_slug text NOT NULL,
  module_key text NOT NULL,
  kind text NOT NULL DEFAULT 'universel',
  label text,
  icon text,
  enabled boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, project_slug, module_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_modules TO authenticated;
GRANT ALL ON public.project_modules TO service_role;
ALTER TABLE public.project_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own project modules" ON public.project_modules FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER project_modules_updated BEFORE UPDATE ON public.project_modules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Tasks module
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_slug text NOT NULL DEFAULT 'aurixen',
  title text NOT NULL,
  notes text,
  done boolean NOT NULL DEFAULT false,
  due_date date,
  priority text NOT NULL DEFAULT 'normale',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tasks" ON public.tasks FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER tasks_updated BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Journal / memory module
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_slug text NOT NULL DEFAULT 'aurixen',
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  mood text,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_entries TO authenticated;
GRANT ALL ON public.journal_entries TO service_role;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own journal" ON public.journal_entries FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER journal_updated BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Generic records for specialized / custom modules
CREATE TABLE IF NOT EXISTS public.module_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_slug text NOT NULL,
  module_key text NOT NULL,
  title text NOT NULL DEFAULT '',
  status text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.module_records TO authenticated;
GRANT ALL ON public.module_records TO service_role;
ALTER TABLE public.module_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own module records" ON public.module_records FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER module_records_updated BEFORE UPDATE ON public.module_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS module_records_lookup
  ON public.module_records (user_id, project_slug, module_key);
CREATE INDEX IF NOT EXISTS tasks_lookup ON public.tasks (user_id, project_slug);
CREATE INDEX IF NOT EXISTS journal_lookup ON public.journal_entries (user_id, project_slug);
