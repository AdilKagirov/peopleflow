export class CreateVacancyDto {
  title!: string;
  position!: string;
  description!: string;
  requirements!: string;
  workingConditions!: string;
  branchId?: string;
  departmentId?: string;
  hiringManagerId?: string;
  recruiterId?: string;
  statusCode?: string;
  employmentTypeCode?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  publishedAt?: string;
  closedAt?: string;
  headcount?: number;
  isConfidential?: boolean;
}
