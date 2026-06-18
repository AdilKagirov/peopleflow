export class UpdateApplicationDto {
  statusCode?: string;
  stageCode?: string | null;
  sourceCode?: string | null;
  recruiterId?: string | null;
  rating?: number | null;
  summary?: string | null;
  rejectionReason?: string | null;
  hiredAt?: string | null;
}

