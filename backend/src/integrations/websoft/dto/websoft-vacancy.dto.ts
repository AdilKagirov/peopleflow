export class WebsoftVacancyDto {
  externalRequestId!: string;
  approvalStatus!: string;
  branchCode!: string;
  title!: string;
  position!: string;
  departmentName?: string;
  hiringManagerEmail?: string;
  description?: string;
  requirements?: string;
  workingConditions?: string;
  employmentTypeCode?: string;
  headcount?: number;
  desiredStartDate?: string;
}

