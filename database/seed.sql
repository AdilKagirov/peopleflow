INSERT INTO branches (code, name, city, is_head_office) VALUES
  ('HEAD', 'Головной офис KMF Bank', 'Алматы', true),
  ('AST', 'Филиал Астана', 'Астана', false)
ON CONFLICT DO NOTHING;

INSERT INTO departments (branch_id, name)
SELECT b.id, d.name
FROM branches b
CROSS JOIN (VALUES ('HR'), ('IT'), ('Розничный бизнес')) AS d(name)
WHERE b.name = 'Головной офис KMF Bank'
ON CONFLICT DO NOTHING;

INSERT INTO roles (code, name, description) VALUES
  ('admin', 'Администратор', 'Полный доступ к системе'),
  ('recruiter', 'Рекрутер', 'Ведение вакансий, кандидатов и коммуникаций'),
  ('hiring_manager', 'Менеджер по найму', 'Просмотр кандидатов и оценка интервью'),
  ('security', 'Служба безопасности', 'Проверка и согласование кандидатов'),
  ('branch_hr', 'HR филиала', 'Работа с вакансиями и кандидатами филиала')
ON CONFLICT (code) DO NOTHING;

INSERT INTO permissions (code, name) VALUES
  ('vacancy.view', 'Просмотр вакансий'),
  ('vacancy.create', 'Создание вакансий'),
  ('vacancy.edit', 'Редактирование вакансий'),
  ('candidate.view', 'Просмотр кандидатов'),
  ('candidate.create', 'Создание кандидатов'),
  ('candidate.edit', 'Редактирование кандидатов'),
  ('application.move', 'Перемещение по этапам'),
  ('approval.view', 'Просмотр согласований'),
  ('approval.request', 'Отправка кандидата на согласование'),
  ('approval.decide', 'Принятие решения по согласованию'),
  ('interview.manage', 'Управление интервью'),
  ('communication.send', 'Отправка писем'),
  ('report.view', 'Просмотр отчетов'),
  ('settings.manage', 'Управление настройками')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'vacancy.view', 'vacancy.create', 'vacancy.edit',
  'candidate.view', 'candidate.create', 'candidate.edit',
  'application.move', 'interview.manage', 'communication.send', 'report.view'
)
WHERE r.code = 'recruiter'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('vacancy.view', 'candidate.view', 'application.move', 'interview.manage', 'report.view')
WHERE r.code = 'hiring_manager'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('vacancy.view', 'vacancy.create', 'candidate.view', 'candidate.create', 'candidate.edit', 'application.move')
WHERE r.code = 'branch_hr'
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

INSERT INTO vacancy_statuses (code, name, sort_order) VALUES
  ('open', 'Открыта', 10),
  ('paused', 'Приостановлена', 20),
  ('closed', 'Закрыта', 30),
  ('filled', 'Заполнена', 40)
ON CONFLICT (code) DO NOTHING;

INSERT INTO employment_types (code, name) VALUES
  ('full_time', 'Полная занятость'),
  ('part_time', 'Частичная занятость'),
  ('project', 'Проектная работа'),
  ('internship', 'Стажировка')
ON CONFLICT (code) DO NOTHING;

INSERT INTO publication_channels (code, name, is_external) VALUES
  ('company_site', 'Сайт компании', false),
  ('internal_portal', 'Внутренний портал', false),
  ('hh', 'hh.kz / hh.ru', true),
  ('linkedin', 'LinkedIn', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO sources (code, name, is_external) VALUES
  ('manual', 'Ручной ввод', false),
  ('company_site', 'Сайт компании', false),
  ('hh', 'hh.kz / hh.ru', true),
  ('email', 'Электронная почта', false),
  ('referral', 'Рекомендация', false)
ON CONFLICT (code) DO NOTHING;

INSERT INTO pipeline_templates (name, is_default)
SELECT 'Стандартный подбор', true
WHERE NOT EXISTS (SELECT 1 FROM pipeline_templates WHERE is_default = true);

INSERT INTO pipeline_stages (template_id, code, name, sort_order, is_terminal)
SELECT t.id, stage.code, stage.name, stage.sort_order, stage.is_terminal
FROM pipeline_templates t
CROSS JOIN (VALUES
  ('resume_review', 'Рассмотрение резюме', 10, false),
  ('phone_screen', 'Телефонное интервью', 20, false),
  ('customer_review', 'Согласование заказчиком', 25, false),
  ('onsite_interview', 'Личное собеседование', 30, false),
  ('customer_interview', 'Интервью с заказчиком', 35, false),
  ('test_task', 'Тестовое задание', 40, false),
  ('reference_check', 'Проверка рекомендаций', 50, false),
  ('security_check', 'Проверка СБ', 55, false),
  ('recruiter_followup', 'Возвращен рекрутеру', 58, false),
  ('final_interview', 'Финальное интервью', 60, false),
  ('offer', 'Оффер', 70, false),
  ('hired', 'Принят', 80, true),
  ('rejected', 'Отказ', 90, true)
) AS stage(code, name, sort_order, is_terminal)
WHERE t.is_default = true
ON CONFLICT (template_id, code) DO NOTHING;

INSERT INTO application_statuses (code, name) VALUES
  ('active', 'В работе'),
  ('paused', 'Приостановлен'),
  ('rejected', 'Отказ'),
  ('hired', 'Нанят')
ON CONFLICT (code) DO NOTHING;

INSERT INTO interview_types (code, name) VALUES
  ('phone', 'Телефонное интервью'),
  ('hr', 'HR интервью'),
  ('manager', 'Интервью с руководителем'),
  ('final', 'Финальное интервью')
ON CONFLICT (code) DO NOTHING;

INSERT INTO communication_templates (code, name, subject, body)
VALUES
  ('resume_received', 'Подтверждение получения резюме', 'Мы получили ваше резюме', 'Здравствуйте, {{candidate_name}}! Спасибо за отклик на вакансию {{vacancy_title}}.'),
  ('interview_invite', 'Приглашение на интервью', 'Интервью по вакансии {{vacancy_title}}', 'Здравствуйте, {{candidate_name}}! Приглашаем вас на интервью.'),
  ('rejection', 'Отказ', 'Статус по вакансии {{vacancy_title}}', 'Здравствуйте, {{candidate_name}}! Спасибо за интерес к KMF Bank. Сейчас мы не готовы продолжить процесс.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO users (branch_id, department_id, role_id, full_name, email, phone, password_hash, access_all_branches)
SELECT d.branch_id, d.id, r.id, 'Администратор KMF', 'admin.peopleflow@kmf.kz', '+7 700 000 00 00',
       'pbkdf2_sha256$120000$peopleflow-demo-salt-2026$afad7f92fb501a19a9eccded68a7cb6a006c14d57784c77bb74713fd0bdeeef8',
       true
FROM departments d
JOIN roles r ON r.code = 'admin'
WHERE d.name = 'HR'
ON CONFLICT (email) DO NOTHING;

UPDATE users
SET password_hash = 'pbkdf2_sha256$120000$peopleflow-demo-salt-2026$afad7f92fb501a19a9eccded68a7cb6a006c14d57784c77bb74713fd0bdeeef8'
WHERE email = 'admin.peopleflow@kmf.kz' AND password_hash IS NULL;

INSERT INTO vacancies (
  branch_id, department_id, hiring_manager_id, recruiter_id, status_id, employment_type_id,
  title, position, description, requirements, working_conditions,
  salary_min, salary_max, published_at, closed_at, created_by
)
SELECT
  d.branch_id, d.id, u.id, u.id, vs.id, et.id,
  'Frontend-разработчик',
  'Middle Frontend Developer',
  'Разработка интерфейсов KMF PeopleFlow и внутренних HR-сервисов.',
  'JavaScript, React, REST API, внимательность к UX.',
  'Гибридный формат, ДМС, обучение, техника.',
  450000, 650000, current_date, current_date + interval '30 days', u.id
FROM departments d
JOIN users u ON u.email = 'admin.peopleflow@kmf.kz'
JOIN vacancy_statuses vs ON vs.code = 'open'
JOIN employment_types et ON et.code = 'full_time'
WHERE d.name = 'IT'
ON CONFLICT DO NOTHING;

INSERT INTO candidates (branch_id, full_name, email, phone, city, current_position, total_experience_months, education, skills, source_id, consent_personal_data, created_by)
SELECT u.branch_id, 'Алия Смагулова', 'aliya@example.com', '+7 701 111 22 33', 'Алматы', 'Frontend Developer', 48,
       'КазНУ, информационные системы', 'JavaScript, React, TypeScript, CSS', s.id, true, u.id
FROM sources s
JOIN users u ON u.email = 'admin.peopleflow@kmf.kz'
WHERE s.code = 'hh'
ON CONFLICT DO NOTHING;

INSERT INTO applications (vacancy_id, candidate_id, status_id, current_stage_id, source_id, recruiter_id, rating, summary)
SELECT v.id, c.id, st.id, ps.id, s.id, u.id, 5, 'Сильный frontend-профиль, приглашена на интервью.'
FROM vacancies v
JOIN candidates c ON c.email = 'aliya@example.com'
JOIN application_statuses st ON st.code = 'active'
JOIN pipeline_stages ps ON ps.code = 'onsite_interview'
JOIN sources s ON s.code = 'hh'
JOIN users u ON u.email = 'admin.peopleflow@kmf.kz'
WHERE v.title = 'Frontend-разработчик'
ON CONFLICT DO NOTHING;
