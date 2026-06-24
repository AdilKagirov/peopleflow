export const candidateDocumentTypes = [
  'resume',
  'candidate_questionnaire',
  'security_questionnaire',
  'credit_bureau_report',
] as const;

export type CandidateDocumentType = (typeof candidateDocumentTypes)[number];

export const candidateDocumentLabels: Record<CandidateDocumentType, string> = {
  resume: 'Резюме',
  candidate_questionnaire: 'Анкета кандидата',
  security_questionnaire: 'Анкета СБ',
  credit_bureau_report: 'Полный отчет кредитного бюро',
};

export const customerRequiredDocuments: CandidateDocumentType[] = ['resume'];
export const securityRequiredDocuments: CandidateDocumentType[] = [...candidateDocumentTypes];

