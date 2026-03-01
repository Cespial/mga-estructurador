-- Wave 3: Project embeddings for similarity matching
-- Stores vector embeddings of submission data per etapa for cross-project comparison.

create table if not exists project_embeddings (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  etapa_id text not null,
  embedding vector(1024), -- Voyage AI voyage-3-lite dimension
  created_at timestamptz not null default now()
);

-- Index for fast similarity search
create index if not exists idx_project_embeddings_submission
  on project_embeddings(submission_id);

-- HNSW index for vector similarity (cosine)
create index if not exists idx_project_embeddings_hnsw
  on project_embeddings
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- RPC function: match similar submissions by embedding
create or replace function match_similar_submissions(
  query_embedding vector(1024),
  p_convocatoria_id uuid,
  match_threshold float default 0.6,
  top_k int default 5
)
returns table (
  submission_id uuid,
  etapa_id text,
  similarity float
)
language sql stable
as $$
  select
    pe.submission_id,
    pe.etapa_id,
    1 - (pe.embedding <=> query_embedding) as similarity
  from project_embeddings pe
  join submissions s on s.id = pe.submission_id
  where s.convocatoria_id = p_convocatoria_id
    and 1 - (pe.embedding <=> query_embedding) > match_threshold
  order by pe.embedding <=> query_embedding
  limit top_k;
$$;

-- RLS policies
alter table project_embeddings enable row level security;

create policy "Embeddings readable by authenticated users"
  on project_embeddings for select
  to authenticated
  using (true);

create policy "Embeddings insertable by system"
  on project_embeddings for insert
  to authenticated
  with check (true);
