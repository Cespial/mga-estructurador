-- ============================================================
-- Migration 00014: claim_next_scoring_job function
-- Atomic job-claiming function for the scoring worker
-- ============================================================

CREATE OR REPLACE FUNCTION claim_next_scoring_job(p_engine_version text DEFAULT 'v1')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job_id uuid;
BEGIN
  -- Recover stale claims (> 5 min)
  UPDATE scoring_jobs
  SET status = 'pending', claimed_at = NULL
  WHERE status = 'claimed'
    AND claimed_at < now() - interval '5 minutes';

  -- Claim next pending job
  SELECT id INTO v_job_id
  FROM scoring_jobs
  WHERE status = 'pending'
    AND engine_version = p_engine_version
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_job_id IS NOT NULL THEN
    UPDATE scoring_jobs
    SET status = 'claimed', claimed_at = now()
    WHERE id = v_job_id;
  END IF;

  RETURN v_job_id;
END;
$$;
