export class UpdateInterviewDto {
  startsAt?: string;
  endsAt?: string | null;
  interviewTypeCode?: string;
  location?: string | null;
  meetingUrl?: string | null;
  status?: string;
}
