export class UpdateVacancyDto {
  title?: string;
  position?: string;
  description?: string;
  requirements?: string;
  workingConditions?: string;
  departmentId?: string | null;
  hiringManagerId?: string | null;
  recruiterId?: string | null;
  statusCode?: string;
  employmentTypeCode?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string;
  publishedAt?: string | null;
  closedAt?: string | null;
  closeReason?: string | null;
  headcount?: number;
  isConfidential?: boolean;
}

