-- Contact messages table (public form, no RLS needed for insert)
create table if not exists contact_messages (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  email text not null,
  entidad text,
  mensaje text not null,
  status text default 'new' check (status in ('new', 'read', 'replied')),
  created_at timestamptz default now()
);

-- Allow inserts from service role (no anon access)
alter table contact_messages enable row level security;

-- Only service role can insert (handled via service_role key in server action)
-- Entidad admins can read messages for their own reference
create policy "service_role_full_access" on contact_messages
  for all using (auth.role() = 'service_role');
