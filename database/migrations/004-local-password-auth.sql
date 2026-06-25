ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;

UPDATE users
SET password_hash = 'pbkdf2_sha256$120000$peopleflow-demo-salt-2026$afad7f92fb501a19a9eccded68a7cb6a006c14d57784c77bb74713fd0bdeeef8'
WHERE password_hash IS NULL;
