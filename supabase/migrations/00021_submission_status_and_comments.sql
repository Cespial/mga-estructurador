-- ============================================================
-- Migration 00021: Submission status machine + Comment resolution
-- Wave A: Establishes submission lifecycle and comment workflow
-- ============================================================

-- ── 1. Submission Status ──

-- Add status column to submissions with state machine
-- Valid states: draft → submitted → under_review → needs_revision → approved → rejected
-- needs_revision can loop back to submitted
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'submissions' AND column_name = 'status'
  ) THEN
    ALTER TABLE submissions
      ADD COLUMN status text NOT NULL DEFAULT 'draft'
      CHECK (status IN ('draft', 'submitted', 'under_review', 'needs_revision', 'approved', 'rejected'));
  END IF;
END $$;

-- Add submitted_at timestamp
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'submissions' AND column_name = 'submitted_at'
  ) THEN
    ALTER TABLE submissions ADD COLUMN submitted_at timestamptz;
  END IF;
END $$;

-- Add locked flag (true when submitted, prevents edits)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'submissions' AND column_name = 'locked'
  ) THEN
    ALTER TABLE submissions ADD COLUMN locked boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Index for status queries on dashboard
CREATE INDEX IF NOT EXISTS idx_submissions_status
  ON submissions (status);

CREATE INDEX IF NOT EXISTS idx_submissions_municipio_status
  ON submissions (municipio_id, status);

-- ── 2. Field Comments Resolution ──

-- Add resolution fields to field_comments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'field_comments' AND column_name = 'resolved_at'
  ) THEN
    ALTER TABLE field_comments ADD COLUMN resolved_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'field_comments' AND column_name = 'resolved_by'
  ) THEN
    ALTER TABLE field_comments ADD COLUMN resolved_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'field_comments' AND column_name = 'resolved_note'
  ) THEN
    ALTER TABLE field_comments ADD COLUMN resolved_note text;
  END IF;
END $$;

-- Add blocking flag (blocking comments must be resolved before submission)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'field_comments' AND column_name = 'blocking'
  ) THEN
    ALTER TABLE field_comments ADD COLUMN blocking boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Index for unresolved comments count queries
CREATE INDEX IF NOT EXISTS idx_field_comments_unresolved
  ON field_comments (submission_id, resolved)
  WHERE resolved = false;
