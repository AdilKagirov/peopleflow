import { basename, extname } from 'node:path';

export interface ParsedResume {
  fullName: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  currentPosition: string | null;
  totalExperienceMonths: number | null;
  education: string | null;
  skills: string | null;
  parserStatus: 'parsed_text' | 'needs_review';
}

export function parseResumeText(rawText: string, fileName: string): ParsedResume {
  const text = normalizeText(rawText);
  const fullName = extractFullName(text);
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || null;
  const phone = extractPhone(text);
  const city = text.match(/(?:Проживает|Город|City)\s*:\s*([^\n,]+)/i)?.[1]?.trim() || null;
  const currentPosition = extractCurrentPosition(text) || cleanFileName(fileName);
  const totalExperienceMonths = extractExperienceMonths(text);
  const education = extractSection(
    text,
    /Образование\s*/i,
    /(?:Повышение квалификации|Навыки|Знание языков)/i,
    1200,
  );
  const skills = extractSkills(text);

  return {
    fullName: fullName || 'Имя не распознано',
    email,
    phone,
    city,
    currentPosition,
    totalExperienceMonths,
    education,
    skills,
    parserStatus: fullName ? 'parsed_text' : 'needs_review',
  };
}

function normalizeText(value: string) {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/[\u2028\u2029]/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractFullName(text: string) {
  const beginning = text.slice(0, 1800);
  const cyrillic = beginning.match(/([А-ЯЁ][а-яё-]{1,}(?:\s+[А-ЯЁ][а-яё-]{1,}){2})/u)?.[1];
  if (cyrillic && !containsRoleWord(cyrillic)) return cyrillic;

  return beginning
    .split('\n')
    .map((line) => line.trim())
    .find((line) => {
      const words = line.split(/\s+/);
      return words.length >= 2 && words.length <= 4 &&
        words.every((word) => /^[A-Z][a-z'-]{1,}$/u.test(word)) &&
        !containsRoleWord(line);
    }) || null;
}

function containsRoleWord(value: string) {
  return /developer|engineer|administrator|manager|lead|руководитель|разработчик|инженер|администратор/i.test(value);
}

function extractPhone(text: string) {
  const matches = text.match(/[+]?\d[\d ()-]{8,}\d/g) || [];
  return matches
    .map((value) => value.replace(/\s+/g, ' ').trim())
    .find((value) => {
      const digits = value.replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 15;
    }) || null;
}

function extractCurrentPosition(text: string) {
  const match = text.match(
    /(?:Желаемая должность(?: и зарплата)?|Desired position(?: and salary)?)\s*:?\s*([\s\S]{1,240}?)(?:\n|Специализации|Specializations)/i,
  );
  return match?.[1]?.replace(/\s+/g, ' ').trim() || null;
}

function extractExperienceMonths(text: string) {
  const match = text.match(/Опыт работы\s*[—-]?\s*(\d+)\s*(лет|года?|месяц(?:ев|а)?)/i);
  if (!match) return null;
  const value = Number(match[1]);
  return /месяц/i.test(match[2]) ? value : value * 12;
}

function extractSkills(text: string) {
  const end = text.search(/(?:Опыт вождения|Дополнительная информация)/i);
  const searchable = end > -1 ? text.slice(0, end) : text;
  const marker = Math.max(searchable.lastIndexOf('Навыки'), searchable.lastIndexOf('Skills'));
  if (marker < 0) return null;
  return searchable
    .slice(marker)
    .replace(/^(?:Навыки|Skills)\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1600) || null;
}

function extractSection(
  text: string,
  start: RegExp,
  end: RegExp,
  maxLength: number,
) {
  const startMatch = start.exec(text);
  if (!startMatch) return null;
  const remainder = text.slice(startMatch.index + startMatch[0].length);
  const endMatch = end.exec(remainder);
  return remainder
    .slice(0, endMatch?.index ?? remainder.length)
    .replace(/\s*\n\s*/g, '; ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength) || null;
}

function cleanFileName(fileName: string) {
  const value = basename(fileName, extname(fileName)).replace(/[_-]+/g, ' ').trim();
  return value && containsRoleWord(value) ? value : null;
}
