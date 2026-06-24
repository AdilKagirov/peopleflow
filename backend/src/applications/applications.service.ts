import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryResultRow } from 'pg';
import { compact, toNumber } from '../common/sql';
import { DatabaseService } from '../database/database.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { MoveApplicationDto } from './dto/move-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

interface ApplicationRow extends QueryResultRow {
  id: string;
  vacancy_id: string;
  vacancy_title: string;
  vacancy_position: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string | null;
  status_code: string;
  status_name: string;
  stage_id: string | null;
  stage_code: string | null;
  stage_name: string | null;
  stage_sort_order: number | null;
  source_code: string | null;
  source_name: string | null;
  recruiter_id: string | null;
  recruiter_name: string | null;
  applied_at: string;
  rating: number | null;
  summary: string | null;
  rejection_reason: string | null;
  hired_at: string | null;
  created_at: string;
  updated_at: string;
}

interface StageHistoryRow extends QueryResultRow {
  id: string;
  application_id: string;
  from_stage_code: string | null;
  from_stage_name: string | null;
  to_stage_code: string | null;
  to_stage_name: string | null;
  changed_by: string | null;
  changed_by_name: string | null;
  changed_at: string;
  comment: string | null;
}

@Injectable()
export class ApplicationsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(filters: {
    vacancyId?: string;
    candidateId?: string;
    stage?: string;
    status?: string;
  }) {
    const where: string[] = [];
    const params: unknown[] = [];

    if (filters.vacancyId) {
      params.push(filters.vacancyId);
      where.push(`a.vacancy_id = $${params.length}`);
    }

    if (filters.candidateId) {
      params.push(filters.candidateId);
      where.push(`a.candidate_id = $${params.length}`);
    }

    if (filters.stage) {
      params.push(filters.stage);
      where.push(`ps.code = $${params.length}`);
    }

    if (filters.status) {
      params.push(filters.status);
      where.push(`st.code = $${params.length}`);
    }

    const result = await this.databaseService.query<ApplicationRow>(
      `${this.baseQuery()}
       ${where.length ? `where ${where.join(' and ')}` : ''}
       order by ps.sort_order nulls last, a.applied_at desc`,
      params,
    );

    return result.rows.map((row) => this.mapApplication(row));
  }

  async findOne(id: string) {
    const result = await this.databaseService.query<ApplicationRow>(
      `${this.baseQuery()} where a.id = $1`,
      [id],
    );

    const application = result.rows[0];
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return this.mapApplication(application);
  }

  async getHistory(id: string) {
    await this.findOne(id);

    const result = await this.databaseService.query<StageHistoryRow>(
      `select
        h.id, h.application_id,
        from_stage.code as from_stage_code,
        from_stage.name as from_stage_name,
        to_stage.code as to_stage_code,
        to_stage.name as to_stage_name,
        h.changed_by,
        u.full_name as changed_by_name,
        h.changed_at,
        h.comment
      from application_stage_history h
      left join pipeline_stages from_stage on from_stage.id = h.from_stage_id
      left join pipeline_stages to_stage on to_stage.id = h.to_stage_id
      left join users u on u.id = h.changed_by
      where h.application_id = $1
      order by h.changed_at desc`,
      [id],
    );

    return result.rows.map((row) => ({
      id: row.id,
      applicationId: row.application_id,
      fromStage: row.from_stage_code
        ? { code: row.from_stage_code, name: row.from_stage_name }
        : null,
      toStage: row.to_stage_code
        ? { code: row.to_stage_code, name: row.to_stage_name }
        : null,
      changedBy: row.changed_by
        ? { id: row.changed_by, name: row.changed_by_name }
        : null,
      changedAt: row.changed_at,
      comment: row.comment,
    }));
  }

  async create(dto: CreateApplicationDto) {
    this.require(dto.vacancyId, 'vacancyId');
    this.require(dto.candidateId, 'candidateId');

    await this.ensureExists('vacancies', dto.vacancyId, 'Vacancy not found');
    await this.ensureExists('candidates', dto.candidateId, 'Candidate not found');

    const statusId = await this.lookupId(
      'application_statuses',
      dto.statusCode || 'active',
      'Application status not found',
    );
    const stageId = await this.lookupStageId(dto.stageCode || 'resume_review');
    const sourceId = dto.sourceCode
      ? await this.lookupId('sources', dto.sourceCode, 'Source not found')
      : null;

    try {
      const result = await this.databaseService.query<{ id: string }>(
        `insert into applications (
          vacancy_id, candidate_id, status_id, current_stage_id, source_id,
          recruiter_id, applied_at, rating, summary
        )
        values ($1, $2, $3, $4, $5, $6, coalesce($7::timestamptz, now()), $8, $9)
        returning id`,
        [
          dto.vacancyId,
          dto.candidateId,
          statusId,
          stageId,
          sourceId,
          dto.recruiterId || null,
          dto.appliedAt || null,
          toNumber(dto.rating) ?? null,
          dto.summary || null,
        ],
      );

      await this.insertStageHistory({
        applicationId: result.rows[0].id,
        fromStageId: null,
        toStageId: stageId,
        changedBy: dto.recruiterId || null,
        comment: 'Application created',
      });

      return this.findOne(result.rows[0].id);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Candidate is already linked to this vacancy');
      }

      throw error;
    }
  }

  async update(id: string, dto: UpdateApplicationDto) {
    await this.findOne(id);

    const values = compact({
      recruiter_id: dto.recruiterId,
      rating: dto.rating === undefined ? undefined : toNumber(dto.rating) ?? null,
      summary: dto.summary,
      rejection_reason: dto.rejectionReason,
      hired_at: dto.hiredAt,
    });

    if (dto.statusCode !== undefined) {
      values.status_id = await this.lookupId(
        'application_statuses',
        dto.statusCode,
        'Application status not found',
      );
    }

    if (dto.stageCode !== undefined) {
      values.current_stage_id = dto.stageCode
        ? await this.lookupStageId(dto.stageCode)
        : null;
    }

    if (dto.sourceCode !== undefined) {
      values.source_id = dto.sourceCode
        ? await this.lookupId('sources', dto.sourceCode, 'Source not found')
        : null;
    }

    const entries = Object.entries(values);
    if (!entries.length) {
      return this.findOne(id);
    }

    const assignments = entries.map(([key], index) => `${key} = $${index + 2}`);
    await this.databaseService.query(
      `update applications
       set ${assignments.join(', ')}, updated_at = now()
       where id = $1`,
      [id, ...entries.map(([, value]) => value)],
    );

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    const approvals = await this.databaseService.query(
      'select 1 from approval_requests where application_id = $1 limit 1',
      [id],
    );
    if (approvals.rowCount) {
      throw new ConflictException('Application with approval history cannot be deleted');
    }
    await this.databaseService.query('delete from applications where id = $1', [id]);
    return { deleted: true, applicationId: id };
  }

  async move(id: string, dto: MoveApplicationDto) {
    this.require(dto.stageCode, 'stageCode');

    const application = await this.getApplicationRecord(id);
    const toStageId = await this.lookupStageId(dto.stageCode);
    const statusId = dto.statusCode
      ? await this.lookupId(
          'application_statuses',
          dto.statusCode,
          'Application status not found',
        )
      : null;

    if (application.current_stage_id === toStageId && !statusId) {
      return this.findOne(id);
    }

    await this.databaseService.query(
      `update applications
       set current_stage_id = $2,
           status_id = coalesce($3, status_id),
           updated_at = now()
       where id = $1`,
      [id, toStageId, statusId],
    );

    await this.insertStageHistory({
      applicationId: id,
      fromStageId: application.current_stage_id,
      toStageId,
      changedBy: dto.changedBy || null,
      comment: dto.comment || null,
    });

    return this.findOne(id);
  }

  private baseQuery() {
    return `select
      a.id, a.vacancy_id, v.title as vacancy_title, v.position as vacancy_position,
      a.candidate_id, c.full_name as candidate_name, c.email as candidate_email,
      st.code as status_code, st.name as status_name,
      ps.id as stage_id, ps.code as stage_code, ps.name as stage_name,
      ps.sort_order as stage_sort_order,
      s.code as source_code, s.name as source_name,
      a.recruiter_id, u.full_name as recruiter_name,
      a.applied_at, a.rating, a.summary, a.rejection_reason, a.hired_at,
      a.created_at, a.updated_at
    from applications a
    join vacancies v on v.id = a.vacancy_id
    join candidates c on c.id = a.candidate_id
    join application_statuses st on st.id = a.status_id
    left join pipeline_stages ps on ps.id = a.current_stage_id
    left join sources s on s.id = a.source_id
    left join users u on u.id = a.recruiter_id`;
  }

  private mapApplication(row: ApplicationRow) {
    return {
      id: row.id,
      vacancy: {
        id: row.vacancy_id,
        title: row.vacancy_title,
        position: row.vacancy_position,
      },
      candidate: {
        id: row.candidate_id,
        name: row.candidate_name,
        email: row.candidate_email,
      },
      status: {
        code: row.status_code,
        name: row.status_name,
      },
      stage: row.stage_id
        ? {
            id: row.stage_id,
            code: row.stage_code,
            name: row.stage_name,
            sortOrder: row.stage_sort_order,
          }
        : null,
      source: row.source_code ? { code: row.source_code, name: row.source_name } : null,
      recruiter: row.recruiter_id
        ? { id: row.recruiter_id, name: row.recruiter_name }
        : null,
      appliedAt: row.applied_at,
      rating: row.rating,
      summary: row.summary,
      rejectionReason: row.rejection_reason,
      hiredAt: row.hired_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private async getApplicationRecord(id: string) {
    const result = await this.databaseService.query<{
      id: string;
      current_stage_id: string | null;
    }>('select id, current_stage_id from applications where id = $1', [id]);

    if (!result.rows[0]) {
      throw new NotFoundException('Application not found');
    }

    return result.rows[0];
  }

  private async lookupId(table: string, code: string, message: string) {
    const result = await this.databaseService.query<{ id: string }>(
      `select id from ${table} where code = $1`,
      [code],
    );

    if (!result.rows[0]) {
      throw new BadRequestException(message);
    }

    return result.rows[0].id;
  }

  private async lookupStageId(code: string) {
    const result = await this.databaseService.query<{ id: string }>(
      `select ps.id
       from pipeline_stages ps
       join pipeline_templates pt on pt.id = ps.template_id
       where ps.code = $1
       order by pt.is_default desc, ps.sort_order
       limit 1`,
      [code],
    );

    if (!result.rows[0]) {
      throw new BadRequestException('Pipeline stage not found');
    }

    return result.rows[0].id;
  }

  private async ensureExists(table: string, id: string, message: string) {
    const result = await this.databaseService.query<{ id: string }>(
      `select id from ${table} where id = $1`,
      [id],
    );

    if (!result.rows[0]) {
      throw new BadRequestException(message);
    }
  }

  private async insertStageHistory(input: {
    applicationId: string;
    fromStageId: string | null;
    toStageId: string | null;
    changedBy: string | null;
    comment: string | null;
  }) {
    await this.databaseService.query(
      `insert into application_stage_history (
        application_id, from_stage_id, to_stage_id, changed_by, comment
      )
      values ($1, $2, $3, $4, $5)`,
      [
        input.applicationId,
        input.fromStageId,
        input.toStageId,
        input.changedBy,
        input.comment,
      ],
    );
  }

  private isUniqueViolation(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }

  private require(value: unknown, field: string) {
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException(`${field} is required`);
    }
  }
}
