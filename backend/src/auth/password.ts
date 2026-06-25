import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

const PASSWORD_ALGORITHM = 'pbkdf2_sha256';
const PASSWORD_ITERATIONS = 120000;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, 32, 'sha256').toString('hex');
  return [PASSWORD_ALGORITHM, PASSWORD_ITERATIONS, salt, hash].join('$');
}

export function verifyPassword(password: string, storedHash: string) {
  const [algorithm, iterationsText, salt, hash] = storedHash.split('$');
  if (algorithm !== PASSWORD_ALGORITHM || !iterationsText || !salt || !hash) return false;

  const expected = Buffer.from(hash, 'hex');
  const calculated = pbkdf2Sync(
    password,
    salt,
    Number(iterationsText),
    expected.length,
    'sha256',
  );

  return calculated.length === expected.length && timingSafeEqual(calculated, expected);
}
