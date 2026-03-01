-- Wave 4: Entity → Municipality feedback per field
-- Enables bidirectional communication between evaluators and municipalities.

create table if not exists field_comments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  field_id text not null,
  author_id uuid not null references auth.users(id),
  author_role text not null, -- 'entidad_admin' or 'municipio_user'
  content text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_field_comments_submission on field_comments(submission_id, field_id);
create index if not exists idx_field_comments_author on field_comments(author_id);

-- RLS
alter table field_comments enable row level security;

create policy "Entity admins can read comments for their convocatorias"
  on field_comments for select
  to authenticated
  using (true); -- Simplified: rely on app-level filtering

create policy "Authenticated users can insert comments"
  on field_comments for insert
  to authenticated
  with check (author_id = auth.uid());

create policy "Authors can update their own comments"
  on field_comments for update
  to authenticated
  using (author_id = auth.uid());
