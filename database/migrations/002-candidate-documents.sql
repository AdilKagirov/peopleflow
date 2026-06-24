ALTER TABLE attachments
  ADD COLUMN IF NOT EXISTS document_type text;

UPDATE attachments a
SET document_type = 'resume'
FROM resumes r
WHERE r.attachment_id = a.id
  AND a.document_type IS NULL;

CREATE INDEX IF NOT EXISTS attachments_candidate_documents_idx
  ON attachments (owner_type, owner_id, document_type, uploaded_at DESC);
