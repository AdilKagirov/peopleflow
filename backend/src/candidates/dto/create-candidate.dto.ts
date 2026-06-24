export class CreateCandidateDto {
  branchId?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  fullName!: string;
  email?: string;
  phone?: string;
  city?: string;
  currentPosition?: string;
  totalExperienceMonths?: number;
  education?: string;
  skills?: string;
  expectedSalary?: number;
  expectedSalaryCurrency?: string;
  sourceCode?: string;
  consentPersonalData?: boolean;
}
