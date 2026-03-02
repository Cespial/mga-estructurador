-- ============================================================
-- Migration 00024: Announcements, Direct Messages, Internal Notes
-- Wave D: Communication & content
-- ============================================================

-- ── 1. Announcements (entity → all municipalities) ──
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convocatoria_id uuid NOT NULL REFERENCES convocatorias(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL,
  body text NOT NULL,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_conv
  ON announcements (convocatoria_id, created_at DESC);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read announcements"
  ON announcements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Entity admins can create announcements"
  ON announcements FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update announcements"
  ON announcements FOR UPDATE TO authenticated
  USING (author_id = auth.uid());

-- ── 2. Direct Messages (municipality ↔ entity) ──
CREATE TABLE IF NOT EXISTS direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convocatoria_id uuid NOT NULL REFERENCES convocatorias(id) ON DELETE CASCADE,
  submission_id uuid REFERENCES submissions(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  sender_role text NOT NULL,
  content text NOT NULL,
  thread_id uuid, -- self-reference for threading
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_conv
  ON direct_messages (convocatoria_id, created_at);

CREATE INDEX IF NOT EXISTS idx_direct_messages_submission
  ON direct_messages (submission_id, created_at);

CREATE INDEX IF NOT EXISTS idx_direct_messages_thread
  ON direct_messages (thread_id, created_at);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their messages"
  ON direct_messages FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can send messages"
  ON direct_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can mark as read"
  ON direct_messages FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

-- ── 3. Internal Notes (municipality team only) ──
CREATE TABLE IF NOT EXISTS internal_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  campo_id text, -- optional: if tied to a specific field
  author_id uuid NOT NULL REFERENCES auth.users(id),
  content text NOT NULL,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_internal_notes_submission
  ON internal_notes (submission_id, campo_id);

ALTER TABLE internal_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can read internal notes"
  ON internal_notes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create internal notes"
  ON internal_notes FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update internal notes"
  ON internal_notes FOR UPDATE TO authenticated
  USING (author_id = auth.uid());
