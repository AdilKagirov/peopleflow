import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { QueryResultRow } from 'pg';
import { DatabaseService } from '../database/database.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';

interface InterviewRow extends QueryResultRow {
  id: string;
  application_id: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  meeting_url: string | null;
  status: string;
  created_at: string;
  interview_type_code: string | null;
  interview_type_name: string | null;
  candidate_id: string;
  candidate_name: string;
  vacancy_id: string;
  vacancy_title: string;
  created_by: string | null;
  created_by_name: string | null;
}

@Injectable()
export class InterviewsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(filters: { applicationId?: string; status?: string }) {
    const where: string[] = [];
    const params: unknown[] = [];
    if (filters.applicationId) {
      params.push(filters.applicationId);
      where.push(`i.application_id = $${params.length}`);
    }
    if (filters.status) {
      params.push(filters.status);
      where.push(`i.status = $${params.length}`);
    }
    const result = await this.databaseService.query<InterviewRow>(
      `${this.baseQuery()}
       ${where.length ? `where ${where.join(' and ')}` : ''}
       order by i.starts_at asc`,
      params,
    );
    return result.rows.map((row) => this.mapInterview(row));
  }

  async findOne(id: string) {
    const result = await this.databaseService.query<InterviewRow>(
      `${this.baseQuery()} where i.id = $1`,
      [id],
    );
    if (!result.rows[0]) throw new NotFoundException('Interview not found');
    return this.mapInterview(result.rows[0]);
  }

  async create(dto: CreateInterviewDto) {
    if (!dto.applicationId) throw new BadRequestException('applicationId is required');
    if (!dto.startsAt || Number.isNaN(Date.parse(dto.startsAt))) {
      throw new BadRequestException('Valid startsAt is required');
    }
    if (dto.endsAt && Number.isNaN(Date.parse(dto.endsAt))) {
      throw new BadRequestException('endsAt must be a valid date');
    }
    if (dto.endsAt && Date.parse(dto.endsAt) <= Date.parse(dto.startsAt)) {
      throw new BadRequestException('endsAt must be later than startsAt');
    }

    const application = await this.databaseService.query(
      'select 1 from applications where id = $1',
      [dto.applicationId],
    );
    if (!application.rowCount) throw new NotFoundException('Application not found');

    const type = await this.databaseService.query<{ id: string }>(
      'select id from interview_types where code = $1',
      [dto.interviewTypeCode || 'manager'],
    );
    if (!type.rows[0]) throw new BadRequestException('Interview type not found');

    const result = await this.databaseService.query<{ id: string }>(
      `insert into interviews (
        application_id, interview_type_id, starts_at, ends_at,
        location, meeting_url, created_by
      ) values ($1, $2, $3::timestamptz, $4::timestamptz, $5, $6, $7)
      returning id`,
      [
        dto.applicationId,
        type.rows[0].id,
        dto.startsAt,
        dto.endsAt || null,
        dto.location || null,
        dto.meetingUrl || null,
        dto.createdBy || null,
      ],
    );
    return this.findOne(result.rows[0].id);
  }

  async update(id: string, dto: UpdateInterviewDto) {
    await this.findOne(id);
    if (dto.startsAt !== undefined && (!dto.startsAt || Number.isNaN(Date.parse(dto.startsAt)))) {
      throw new BadRequestException('startsAt must be a valid date');
    }
    if (dto.endsAt && Number.isNaN(Date.parse(dto.endsAt))) {
      throw new BadRequestException('endsAt must be a valid date');
    }
    const startsAt = dto.startsAt ? Date.parse(dto.startsAt) : null;
    const endsAt = dto.endsAt ? Date.parse(dto.endsAt) : null;
    if (startsAt && endsAt && endsAt <= startsAt) {
      throw new BadRequestException('endsAt must be later than startsAt');
    }

    let typeId: string | null | undefined;
    if (dto.interviewTypeCode !== undefined) {
      const type = await this.databaseService.query<{ id: string }>(
        'select id from interview_types where code = $1',
        [dto.interviewTypeCode],
      );
      if (!type.rows[0]) throw new BadRequestException('Interview type not found');
      typeId = type.rows[0].id;
    }

    const values: Record<string, unknown> = {};
    if (dto.startsAt !== undefined) values.starts_at = dto.startsAt;
    if (dto.endsAt !== undefined) values.ends_at = dto.endsAt;
    if (dto.location !== undefined) values.location = dto.location;
    if (dto.meetingUrl !== undefined) values.meeting_url = dto.meetingUrl;
    if (dto.status !== undefined) values.status = dto.status;
    if (typeId !== undefined) values.interview_type_id = typeId;

    const entries = Object.entries(values);
    if (!entries.length) return this.findOne(id);

    const assignments = entries.map(([key], index) => `${key} = $${index + 2}`);
    await this.databaseService.query(
      `update interviews set ${assignments.join(', ')} where id = $1`,
      [id, ...entries.map(([, value]) => value)],
    );
    return this.findOne(id);
  }

  private baseQuery() {
    return `select
      i.id, i.application_id, i.starts_at, i.ends_at, i.location,
      i.meeting_url, i.status, i.created_at,
      it.code as interview_type_code, it.name as interview_type_name,
      c.id as candidate_id, c.full_name as candidate_name,
      v.id as vacancy_id, v.title as vacancy_title,
      i.created_by, creator.full_name as created_by_name
    from interviews i
    join applications a on a.id = i.application_id
    join candidates c on c.id = a.candidate_id
    join vacancies v on v.id = a.vacancy_id
    left join interview_types it on it.id = i.interview_type_id
    left join users creator on creator.id = i.created_by`;
  }

  private mapInterview(row: InterviewRow) {
    return {
      id: row.id,
      applicationId: row.application_id,
      candidate: { id: row.candidate_id, name: row.candidate_name },
      vacancy: { id: row.vacancy_id, title: row.vacancy_title },
      type: row.interview_type_code
        ? { code: row.interview_type_code, name: row.interview_type_name }
        : null,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      location: row.location,
      meetingUrl: row.meeting_url,
      status: row.status,
      createdBy: row.created_by
        ? { id: row.created_by, name: row.created_by_name }
        : null,
      createdAt: row.created_at,
    };
  }
}
