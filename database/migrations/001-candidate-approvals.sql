CREATE TABLE IF NOT EXISTS approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  approval_type text NOT NULL CHECK (approval_type IN ('customer', 'security')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  assigned_role text NOT NULL,
  assigned_to uuid REFERENCES users(id),
  requested_by uuid REFERENCES users(id),
  decided_by uuid REFERENCES users(id),
  previous_stage_id uuid REFERENCES pipeline_stages(id),
  request_comment text,
  decision_comment text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS approval_requests_application_idx
  ON approval_requests (application_id, requested_at DESC);

CREATE INDEX IF NOT EXISTS approval_requests_queue_idx
  ON approval_requests (assigned_role, status, requested_at);

CREATE UNIQUE INDEX IF NOT EXISTS approval_requests_one_pending_idx
  ON approval_requests (application_id, approval_type)
  WHERE status = 'pending';

INSERT INTO roles (code, name, description) VALUES
  ('security', 'Служба безопасности', 'Проверка и согласование кандидатов')
ON CONFLICT (code) DO UPDATE SET
  name = excluded.name,
  description = excluded.description;

INSERT INTO permissions (code, name) VALUES
  ('approval.view', 'Просмотр согласований'),
  ('approval.request', 'Отправка кандидата на согласование'),
  ('approval.decide', 'Принятие решения по согласованию')
ON CONFLICT (code) DO UPDATE SET name = excluded.name;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('approval.view', 'approval.request', 'approval.decide')
WHERE r.code = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('approval.view', 'approval.request')
WHERE r.code = 'recruiter'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('approval.view', 'approval.decide')
WHERE r.code IN ('hiring_manager', 'security')
ON CONFLICT DO NOTHING;

INSERT INTO pipeline_stages (template_id, code, name, sort_order, is_terminal)
SELECT t.id, stage.code, stage.name, stage.sort_order, false
FROM pipeline_templates t
CROSS JOIN (VALUES
  ('customer_review', 'Согласование заказчиком', 25),
  ('customer_interview', 'Интервью с заказчиком', 35),
  ('security_check', 'Проверка СБ', 55),
  ('recruiter_followup', 'Возвращен рекрутеру', 58)
) AS stage(code, name, sort_order)
WHERE t.is_default = true
ON CONFLICT (template_id, code) DO UPDATE SET
  name = excluded.name,
  sort_order = excluded.sort_order;

