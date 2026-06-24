ALTER TABLE branches ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS is_head_office boolean NOT NULL DEFAULT false;

UPDATE branches SET code = CASE
  WHEN name = 'Головной офис KMF Bank' THEN 'HEAD'
  WHEN name = 'Филиал Астана' THEN 'AST'
  ELSE 'BR-' || upper(substr(replace(id::text, '-', ''), 1, 8))
END WHERE code IS NULL;

ALTER TABLE branches ALTER COLUMN code SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS branches_code_unique_idx ON branches (code);
UPDATE branches SET is_head_office = true WHERE code = 'HEAD';

INSERT INTO branches (code, name, city, is_head_office) VALUES
  ('ALA', 'Филиал Алматы', 'Алматы', false),
  ('SHY', 'Филиал Шымкент', 'Шымкент', false),
  ('AKT', 'Филиал Актобе', 'Актобе', false),
  ('ATY', 'Филиал Атырау', 'Атырау', false),
  ('AKU', 'Филиал Актау', 'Актау', false),
  ('KRG', 'Филиал Караганда', 'Караганда', false),
  ('PVL', 'Филиал Павлодар', 'Павлодар', false),
  ('KST', 'Филиал Костанай', 'Костанай', false),
  ('PET', 'Филиал Петропавловск', 'Петропавловск', false),
  ('KOK', 'Филиал Кокшетау', 'Кокшетау', false),
  ('SEM', 'Филиал Семей', 'Семей', false),
  ('OSK', 'Филиал Усть-Каменогорск', 'Усть-Каменогорск', false),
  ('TRZ', 'Филиал Тараз', 'Тараз', false),
  ('KZO', 'Филиал Кызылорда', 'Кызылорда', false),
  ('TRK', 'Филиал Туркестан', 'Туркестан', false),
  ('TAL', 'Филиал Талдыкорган', 'Талдыкорган', false),
  ('URA', 'Филиал Уральск', 'Уральск', false),
  ('ZHE', 'Филиал Жезказган', 'Жезказган', false)
ON CONFLICT (code) DO UPDATE SET name = excluded.name, city = excluded.city;

ALTER TABLE users ADD COLUMN IF NOT EXISTS access_all_branches boolean NOT NULL DEFAULT false;
UPDATE users SET branch_id = d.branch_id
FROM departments d
WHERE users.department_id = d.id AND users.branch_id IS NULL;
UPDATE users SET access_all_branches = true
WHERE id IN (
  SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id
  WHERE r.code = 'admin'
) OR branch_id = (SELECT id FROM branches WHERE code = 'HEAD');

CREATE TABLE IF NOT EXISTS user_branch_access (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  PRIMARY KEY (user_id, branch_id)
);
INSERT INTO user_branch_access (user_id, branch_id, is_primary)
SELECT id, branch_id, true FROM users WHERE branch_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO users (branch_id, role_id, full_name, email, access_all_branches)
SELECT b.id, r.id, 'Рекрутер — ' || b.name,
       'recruiter.' || lower(b.code) || '@kmf.kz', false
FROM branches b CROSS JOIN roles r
WHERE r.code = 'recruiter' AND b.is_head_office = false
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_branch_access (user_id, branch_id, is_primary)
SELECT u.id, u.branch_id, true
FROM users u JOIN roles r ON r.id = u.role_id
WHERE r.code = 'recruiter' AND u.branch_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO users (branch_id, role_id, full_name, email, access_all_branches)
SELECT b.id, r.id, 'Рекрутер головного офиса ' || n,
       'hq.recruiter' || n || '@kmf.kz', true
FROM branches b CROSS JOIN roles r CROSS JOIN generate_series(1, 5) n
WHERE b.code = 'HEAD' AND r.code = 'recruiter'
ON CONFLICT (email) DO NOTHING;

ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES branches(id);
ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS external_request_id text;
ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS source_system text;
CREATE UNIQUE INDEX IF NOT EXISTS vacancies_external_request_unique_idx
  ON vacancies (external_request_id) WHERE external_request_id IS NOT NULL;
UPDATE vacancies v
SET branch_id = coalesce(
  (SELECT d.branch_id FROM departments d WHERE d.id = v.department_id),
  (SELECT id FROM branches WHERE code = 'HEAD')
)
WHERE v.branch_id IS NULL;

ALTER TABLE candidates ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES branches(id);
UPDATE candidates c SET branch_id = scoped.branch_id
FROM (
  SELECT a.candidate_id, min(v.branch_id::text)::uuid AS branch_id
  FROM applications a JOIN vacancies v ON v.id = a.vacancy_id
  WHERE v.branch_id IS NOT NULL GROUP BY a.candidate_id
) scoped
WHERE c.id = scoped.candidate_id AND c.branch_id IS NULL;
UPDATE candidates SET branch_id = (SELECT id FROM branches WHERE code = 'HEAD')
WHERE branch_id IS NULL;

CREATE INDEX IF NOT EXISTS vacancies_branch_idx ON vacancies (branch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS candidates_branch_idx ON candidates (branch_id, created_at DESC);
