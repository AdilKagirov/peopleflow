export class UpdateCandidateDto {
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
  fullName?: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  currentPosition?: string | null;
  totalExperienceMonths?: number | null;
  education?: string | null;
  skills?: string | null;
  expectedSalary?: number | null;
  expectedSalaryCurrency?: string | null;
  sourceCode?: string | null;
  consentPersonalData?: boolean;
}

