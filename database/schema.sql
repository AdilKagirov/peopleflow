CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES branches(id),
  name text NOT NULL,
  parent_id uuid REFERENCES departments(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (branch_id, name)
);

CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text
);

CREATE TABLE permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL
);

CREATE TABLE role_permissions (
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES branches(id),
  department_id uuid REFERENCES departments(id),
  role_id uuid REFERENCES roles(id),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  password_hash text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vacancy_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE employment_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL
);

CREATE TABLE vacancies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES departments(id),
  hiring_manager_id uuid REFERENCES users(id),
  recruiter_id uuid REFERENCES users(id),
  status_id uuid NOT NULL REFERENCES vacancy_statuses(id),
  employment_type_id uuid REFERENCES employment_types(id),
  title text NOT NULL,
  position text NOT NULL,
  description text NOT NULL,
  requirements text NOT NULL,
  working_conditions text NOT NULL,
  salary_min numeric(14,2),
  salary_max numeric(14,2),
  salary_currency char(3) NOT NULL DEFAULT 'KZT',
  published_at date,
  closed_at date,
  close_reason text,
  headcount integer NOT NULL DEFAULT 1,
  is_confidential boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE publication_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  is_external boolean NOT NULL DEFAULT false
);

CREATE TABLE vacancy_publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vacancy_id uuid NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES publication_channels(id),
  external_url text,
  external_id text,
  published_at timestamptz NOT NULL DEFAULT now(),
  unpublished_at timestamptz,
  status text NOT NULL DEFAULT 'published'
);

CREATE TABLE sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  is_external boolean NOT NULL DEFAULT false
);

CREATE TABLE candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text,
  last_name text,
  middle_name text,
  full_name text NOT NULL,
  email text,
  phone text,
  city text,
  current_position text,
  total_experience_months integer,
  education text,
  skills text,
  expected_salary numeric(14,2),
  expected_salary_currency char(3) DEFAULT 'KZT',
  source_id uuid REFERENCES sources(id),
  consent_personal_data boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX candidates_email_unique_idx ON candidates (lower(email)) WHERE email IS NOT NULL;
CREATE INDEX candidates_full_name_idx ON candidates USING gin (to_tsvector('simple', full_name));
CREATE INDEX candidates_skills_idx ON candidates USING gin (to_tsvector('simple', coalesce(skills, '')));

CREATE TABLE pipeline_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES pipeline_templates(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_terminal boolean NOT NULL DEFAULT false,
  UNIQUE (template_id, code)
);

CREATE TABLE application_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL
);

CREATE TABLE applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vacancy_id uuid NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  status_id uuid NOT NULL REFERENCES application_statuses(id),
  current_stage_id uuid REFERENCES pipeline_stages(id),
  source_id uuid REFERENCES sources(id),
  recruiter_id uuid REFERENCES users(id),
  applied_at timestamptz NOT NULL DEFAULT now(),
  rating smallint CHECK (rating BETWEEN 1 AND 5),
  summary text,
  rejection_reason text,
  hired_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vacancy_id, candidate_id)
);

CREATE INDEX applications_vacancy_idx ON applications (vacancy_id);
CREATE INDEX applications_candidate_idx ON applications (candidate_id);
CREATE INDEX applications_stage_idx ON applications (current_stage_id);

CREATE TABLE application_stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  from_stage_id uuid REFERENCES pipeline_stages(id),
  to_stage_id uuid REFERENCES pipeline_stages(id),
  changed_by uuid REFERENCES users(id),
  changed_at timestamptz NOT NULL DEFAULT now(),
  comment text
);

CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text
);

CREATE TABLE candidate_tags (
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (candidate_id, tag_id)
);

CREATE TABLE application_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  author_id uuid REFERENCES users(id),
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE interview_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL
);

CREATE TABLE interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  interview_type_id uuid REFERENCES interview_types(id),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  location text,
  meeting_url text,
  status text NOT NULL DEFAULT 'planned',
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE interview_participants (
  interview_id uuid NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'interviewer',
  PRIMARY KEY (interview_id, user_id)
);

CREATE TABLE interview_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  author_id uuid REFERENCES users(id),
  score smallint CHECK (score BETWEEN 1 AND 5),
  strengths text,
  risks text,
  conclusion text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE communication_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  stage_id uuid REFERENCES pipeline_stages(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE,
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  template_id uuid REFERENCES communication_templates(id),
  channel text NOT NULL,
  direction text NOT NULL,
  subject text,
  body text,
  sent_by uuid REFERENCES users(id),
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'draft'
);

CREATE TABLE attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type text NOT NULL CHECK (owner_type IN ('vacancy', 'candidate', 'application', 'communication')),
  owner_id uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  mime_type text,
  file_size bigint,
  uploaded_by uuid REFERENCES users(id),
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  attachment_id uuid REFERENCES attachments(id),
  raw_text text,
  parsed_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  parser_status text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id),
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_entity_idx ON audit_logs (entity_type, entity_id);
CREATE INDEX audit_logs_actor_idx ON audit_logs (actor_id);
