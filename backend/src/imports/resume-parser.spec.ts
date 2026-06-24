import { parseResumeText } from './resume-parser';

describe('parseResumeText', () => {
  it('separates candidate name from desired position in an HH resume', () => {
    const parsed = parseResumeText(
      `Резюме обновлено 9 января 2026 Кагиров Адиль Абзалович
Мужчина, 32 года
+7 (778) 8658966
adil.kagirov@gmail.com
Проживает: Алматы
Желаемая должность и зарплатаTeam lead, Senior application administrator
Специализации: DevOps-инженер
Опыт работы — 11 лет
Образование
Высшее
Алматинский университет энергетики и связи
Навыки
Linux Windows Server Nginx Docker
Опыт вождения`,
      'Team lead, Senior application administrator.doc',
    );

    expect(parsed).toMatchObject({
      fullName: 'Кагиров Адиль Абзалович',
      email: 'adil.kagirov@gmail.com',
      phone: '+7 (778) 8658966',
      city: 'Алматы',
      currentPosition: 'Team lead, Senior application administrator',
      totalExperienceMonths: 132,
      parserStatus: 'parsed_text',
    });
    expect(parsed.education).toContain('Алматинский университет');
    expect(parsed.skills).toContain('Nginx');
  });

  it('does not use a job-title filename as the candidate name', () => {
    const parsed = parseResumeText('', 'Senior application administrator.pdf');
    expect(parsed.fullName).toBe('Имя не распознано');
    expect(parsed.currentPosition).toBe('Senior application administrator');
    expect(parsed.parserStatus).toBe('needs_review');
  });
});
