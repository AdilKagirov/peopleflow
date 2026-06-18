export class CreateApplicationDto {
  vacancyId!: string;
  candidateId!: string;
  statusCode?: string;
  stageCode?: string;
  sourceCode?: string;
  recruiterId?: string;
  rating?: number;
  summary?: string;
  appliedAt?: string;
}

