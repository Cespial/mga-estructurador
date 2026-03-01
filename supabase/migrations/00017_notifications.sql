-- Wave 4: Smart notifications
-- System-generated alerts for municipalities about project improvement opportunities.

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid, -- nullable, not all notifications are project-specific
  type text not null default 'info', -- 'deadline', 'improvement', 'inactive', 'comment', 'info'
  title text not null,
  body text not null,
  action_url text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on notifications(user_id, read, created_at desc);
create index if not exists idx_notifications_project on notifications(project_id);

-- RLS
alter table notifications enable row level security;

create policy "Users can read own notifications"
  on notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can update own notifications"
  on notifications for update
  to authenticated
  using (user_id = auth.uid());

create policy "System can insert notifications"
  on notifications for insert
  to authenticated
  with check (true);
