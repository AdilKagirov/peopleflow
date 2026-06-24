export class RequestApprovalDto {
  type!: 'customer' | 'security';
  requestedBy?: string;
  assignedTo?: string;
  comment?: string;
}

