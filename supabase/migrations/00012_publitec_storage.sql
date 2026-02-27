-- ============================================================
-- Migration 00012: Publitec Storage Buckets & Policies
-- ============================================================

-- ============================================================
-- 1) Create storage buckets
-- ============================================================

-- project-documents: private bucket for project file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-documents',
  'project-documents',
  false,
  52428800, -- 50 MB
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp'
  ]
);

-- convocatoria-assets: public bucket for convocatoria images, banners, etc.
INSERT INTO storage.buckets (id, name, public)
VALUES (
  'convocatoria-assets',
  'convocatoria-assets',
  true
);

-- reports: private bucket for generated reports
INSERT INTO storage.buckets (id, name, public)
VALUES (
  'reports',
  'reports',
  false
);

-- ============================================================
-- 2) Storage policies for project-documents
-- ============================================================

-- Authenticated users can upload files to project-documents
-- Path convention: {organization_id}/{project_id}/{filename}
CREATE POLICY "authenticated_upload_project_docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'project-documents'
  );

-- Project owners can read their own documents
-- The first path segment is the organization_id
CREATE POLICY "project_owner_read_own_docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'project-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT o.id::text
      FROM organizations o
      WHERE o.owner_id = auth.uid()
    )
  );

-- Entity admins can read submitted project documents
-- They can read docs from any project submitted to their convocatorias
CREATE POLICY "entity_admin_read_submission_docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'project-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT pd_org.id::text
      FROM projects p
      JOIN organizations pd_org ON pd_org.id = p.organization_id
      JOIN convocatorias_v2 c ON c.id = p.convocatoria_id
      JOIN organizations entity_org ON entity_org.id = c.organization_id
      WHERE entity_org.owner_id = auth.uid()
        AND p.status NOT IN ('draft')
    )
  );

-- Project owners can delete their own documents
CREATE POLICY "project_owner_delete_own_docs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'project-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT o.id::text
      FROM organizations o
      WHERE o.owner_id = auth.uid()
    )
  );

-- ============================================================
-- 3) Storage policies for convocatoria-assets (public bucket)
-- ============================================================

-- Anyone can read from public bucket
CREATE POLICY "public_read_convocatoria_assets"
  ON storage.objects FOR SELECT
  TO public
  USING (
    bucket_id = 'convocatoria-assets'
  );

-- Entity org owners can upload convocatoria assets
CREATE POLICY "entity_owner_upload_convocatoria_assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'convocatoria-assets'
    AND (storage.foldername(name))[1] IN (
      SELECT o.id::text
      FROM organizations o
      WHERE o.owner_id = auth.uid()
        AND o.type = 'entity'
    )
  );

-- Entity org owners can delete their convocatoria assets
CREATE POLICY "entity_owner_delete_convocatoria_assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'convocatoria-assets'
    AND (storage.foldername(name))[1] IN (
      SELECT o.id::text
      FROM organizations o
      WHERE o.owner_id = auth.uid()
        AND o.type = 'entity'
    )
  );

-- ============================================================
-- 4) Storage policies for reports (private)
-- ============================================================

-- Entity org owners can read their reports
CREATE POLICY "entity_owner_read_reports"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'reports'
    AND (storage.foldername(name))[1] IN (
      SELECT o.id::text
      FROM organizations o
      WHERE o.owner_id = auth.uid()
        AND o.type = 'entity'
    )
  );

-- System/service role can upload reports (no RLS restriction needed for service_role)
-- Authenticated entity owners can also upload
CREATE POLICY "entity_owner_upload_reports"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'reports'
    AND (storage.foldername(name))[1] IN (
      SELECT o.id::text
      FROM organizations o
      WHERE o.owner_id = auth.uid()
        AND o.type = 'entity'
    )
  );
