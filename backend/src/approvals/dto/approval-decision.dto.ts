export class ApprovalDecisionDto {
  decision!: 'approved' | 'rejected';
  decidedBy?: string;
  comment?: string;
}

