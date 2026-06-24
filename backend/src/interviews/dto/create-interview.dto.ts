export class CreateInterviewDto {
  applicationId!: string;
  startsAt!: string;
  endsAt?: string;
  interviewTypeCode?: string;
  location?: string;
  meetingUrl?: string;
  createdBy?: string;
}

