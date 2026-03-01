-- Wave 5: Cache for AI-generated convocatoria reports
-- Stores generated executive reports so they don't need to be re-created each time.

create table if not exists convocatoria_reports (
  id uuid primary key default gen_random_uuid(),
  convocatoria_id uuid not null references convocatorias(id) on delete cascade,
  report_type text not null default 'ai_executive', -- 'ai_executive', 'comparison', etc.
  content_json jsonb not null default '{}'::jsonb,
  generated_by uuid references auth.users(id),
  llm_model text,
  duration_ms integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_convocatoria_reports_conv on convocatoria_reports(convocatoria_id);
create index if not exists idx_convocatoria_reports_type on convocatoria_reports(convocatoria_id, report_type);

-- RLS
alter table convocatoria_reports enable row level security;

create policy "Entity admins can read reports for their convocatorias"
  on convocatoria_reports for select
  to authenticated
  using (true); -- App-level filtering by tenant

create policy "Authenticated users can insert reports"
  on convocatoria_reports for insert
  to authenticated
  with check (generated_by = auth.uid());
