import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryResultRow } from 'pg';
import { DatabaseService } from '../database/database.service';
import {
  CandidateDocumentType,
  candidateDocumentLabels,
  customerRequiredDocuments,
  securityRequiredDocuments,
} from '../candidates/document-types';
import { ApprovalDecisionDto } from './dto/approval-decision.dto';
import { RequestApprovalDto } from './dto/request-approval.dto';

interface ApprovalRow extends QueryResultRow {
  id: string;
  application_id: string;
  approval_type: 'customer' | 'security';
  status: string;
  assigned_role: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  requested_by: string | null;
  requested_by_name: string | null;
  decided_by: string | null;
  decided_by_name: string | null;
  request_comment: string | null;
  decision_comment: string | null;
  requested_at: string;
  decided_at: string | null;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string | null;
  vacancy_id: string;
  vacancy_title: string;
  stage_code: string | null;
  stage_name: string | null;
  recruiter_id: string | null;
  recruiter_name: string | null;
}

@Injectable()
export class ApprovalsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(filters: {
    status?: string;
    type?: string;
    assignedRole?: string;
    applicationId?: string;
  }) {
    const where: string[] = [];
    const params: unknown[] = [];

    for (const [column, value] of [
      ['ar.status', filters.status],
      ['ar.approval_type', filters.type],
      ['ar.assigned_role', filters.assignedRole],
      ['ar.application_id', filters.applicationId],
    ] as const) {
      if (value) {
        params.push(value);
        where.push(`${column} = $${params.length}`);
      }
    }

    const result = await this.databaseService.query<ApprovalRow>(
      `${this.baseQuery()}
       ${where.length ? `where ${where.join(' and ')}` : ''}
       order by (ar.status = 'pending') desc, ar.requested_at desc`,
      params,
    );
    return result.rows.map((row) => this.mapApproval(row));
  }

  async findOne(id: string) {
    const result = await this.databaseService.query<ApprovalRow>(
      `${this.baseQuery()} where ar.id = $1`,
      [id],
    );
    if (!result.rows[0]) throw new NotFoundException('Approval request not found');
    return this.mapApproval(result.rows[0]);
  }

  async request(applicationId: string, dto: RequestApprovalDto) {
    if (!['customer', 'security'].includes(dto.type)) {
      throw new BadRequestException('Approval type must be customer or security');
    }

    const application = await this.getApplication(applicationId);
    await this.ensureRequiredDocuments(application.candidate_id, dto.type);
    if (dto.type === 'security') {
      const customerApproved = await this.databaseService.query(
        `select 1 from approval_requests
         where application_id = $1 and approval_type = 'customer' and status = 'approved'
         limit 1`,
        [applicationId],
      );
      if (!customerApproved.rowCount) {
        throw new BadRequestException('Customer approval is required before security check');
      }
    }

    const stageId = await this.lookupStageId(
      dto.type === 'customer' ? 'customer_review' : 'security_check',
    );
    const assignedRole = dto.type === 'customer' ? 'hiring_manager' : 'security';

    try {
      const created = await this.databaseService.query<{ id: string }>(
        `insert into approval_requests (
          application_id, approval_type, assigned_role, assigned_to,
          requested_by, previous_stage_id, request_comment
        ) values ($1, $2, $3, $4, $5, $6, $7)
        returning id`,
        [
          applicationId,
          dto.type,
          assignedRole,
          dto.assignedTo || null,
          dto.requestedBy || null,
          application.current_stage_id,
          dto.comment || null,
        ],
      );

      await this.moveApplication(
        applicationId,
        application.current_stage_id,
        stageId,
        dto.requestedBy || null,
        dto.type === 'customer' ? 'Отправлен на согласование заказчику' : 'Отправлен на проверку СБ',
      );
      return this.findOne(created.rows[0].id);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('This approval is already pending');
      }
      throw error;
    }
  }

  async decide(id: string, dto: ApprovalDecisionDto) {
    if (!['approved', 'rejected'].includes(dto.decision)) {
      throw new BadRequestException('Decision must be approved or rejected');
    }

    const approval = await this.getApprovalRecord(id);
    if (approval.status !== 'pending') {
      throw new ConflictException('Approval request is already completed');
    }

    const application = await this.getApplication(approval.application_id);
    const nextStageCode =
      approval.approval_type === 'customer' && dto.decision === 'approved'
        ? 'customer_interview'
        : 'recruiter_followup';
    const nextStageId = await this.lookupStageId(nextStageCode);

    await this.databaseService.query(
      `update approval_requests
       set status = $2, decided_by = $3, decision_comment = $4,
           decided_at = now(), updated_at = now()
       where id = $1`,
      [id, dto.decision, dto.decidedBy || null, dto.comment || null],
    );

    const decisionLabel = dto.decision === 'approved' ? 'одобрен' : 'отклонен';
    await this.moveApplication(
      approval.application_id,
      application.current_stage_id,
      nextStageId,
      dto.decidedBy || null,
      `${approval.approval_type === 'customer' ? 'Заказчик' : 'СБ'}: кандидат ${decisionLabel}. ${dto.comment || ''}`.trim(),
    );

    return this.findOne(id);
  }

  private baseQuery() {
    return `select
      ar.id, ar.application_id, ar.approval_type, ar.status, ar.assigned_role,
      ar.assigned_to, assigned.full_name as assigned_to_name,
      ar.requested_by, requester.full_name as requested_by_name,
      ar.decided_by, decider.full_name as decided_by_name,
      ar.request_comment, ar.decision_comment, ar.requested_at, ar.decided_at,
      c.id as candidate_id, c.full_name as candidate_name, c.email as candidate_email,
      v.id as vacancy_id, v.title as vacancy_title,
      ps.code as stage_code, ps.name as stage_name,
      a.recruiter_id, recruiter.full_name as recruiter_name
    from approval_requests ar
    join applications a on a.id = ar.application_id
    join candidates c on c.id = a.candidate_id
    join vacancies v on v.id = a.vacancy_id
    left join pipeline_stages ps on ps.id = a.current_stage_id
    left join users assigned on assigned.id = ar.assigned_to
    left join users requester on requester.id = ar.requested_by
    left join users decider on decider.id = ar.decided_by
    left join users recruiter on recruiter.id = a.recruiter_id`;
  }

  private mapApproval(row: ApprovalRow) {
    return {
      id: row.id,
      applicationId: row.application_id,
      type: row.approval_type,
      typeName: row.approval_type === 'customer' ? 'Согласование заказчиком' : 'Проверка СБ',
      status: row.status,
      assignedRole: row.assigned_role,
      assignedTo: row.assigned_to ? { id: row.assigned_to, name: row.assigned_to_name } : null,
      requestedBy: row.requested_by ? { id: row.requested_by, name: row.requested_by_name } : null,
      decidedBy: row.decided_by ? { id: row.decided_by, name: row.decided_by_name } : null,
      requestComment: row.request_comment,
      decisionComment: row.decision_comment,
      requestedAt: row.requested_at,
      decidedAt: row.decided_at,
      candidate: { id: row.candidate_id, name: row.candidate_name, email: row.candidate_email },
      vacancy: { id: row.vacancy_id, title: row.vacancy_title },
      currentStage: row.stage_code ? { code: row.stage_code, name: row.stage_name } : null,
      recruiter: row.recruiter_id ? { id: row.recruiter_id, name: row.recruiter_name } : null,
    };
  }

  private async getApplication(id: string) {
    const result = await this.databaseService.query<{
      id: string;
      current_stage_id: string | null;
      candidate_id: string;
    }>('select id, current_stage_id, candidate_id from applications where id = $1', [id]);
    if (!result.rows[0]) throw new NotFoundException('Application not found');
    return result.rows[0];
  }

  private async ensureRequiredDocuments(candidateId: string, type: 'customer' | 'security') {
    const required = type === 'customer'
      ? customerRequiredDocuments
      : securityRequiredDocuments;
    const result = await this.databaseService.query<{ document_type: CandidateDocumentType }>(
      `select distinct document_type
       from attachments
       where owner_type = 'candidate' and owner_id = $1
         and document_type = any($2::text[])`,
      [candidateId, required],
    );
    const available = new Set(result.rows.map((row) => row.document_type));
    const missing = required.filter((documentType) => !available.has(documentType));
    if (missing.length) {
      throw new BadRequestException({
        message: type === 'customer'
          ? 'Для отправки заказчику необходимо загрузить резюме'
          : 'Для отправки в СБ необходимо загрузить полный комплект документов',
        missingDocuments: missing.map((documentType) => ({
          type: documentType,
          name: candidateDocumentLabels[documentType],
        })),
      });
    }
  }

  private async getApprovalRecord(id: string) {
    const result = await this.databaseService.query<{
      id: string;
      application_id: string;
      approval_type: 'customer' | 'security';
      status: string;
    }>(
      'select id, application_id, approval_type, status from approval_requests where id = $1',
      [id],
    );
    if (!result.rows[0]) throw new NotFoundException('Approval request not found');
    return result.rows[0];
  }

  private async lookupStageId(code: string) {
    const result = await this.databaseService.query<{ id: string }>(
      `select ps.id from pipeline_stages ps
       join pipeline_templates pt on pt.id = ps.template_id
       where ps.code = $1
       order by pt.is_default desc, ps.sort_order limit 1`,
      [code],
    );
    if (!result.rows[0]) throw new BadRequestException(`Pipeline stage ${code} not found`);
    return result.rows[0].id;
  }

  private async moveApplication(
    applicationId: string,
    fromStageId: string | null,
    toStageId: string,
    changedBy: string | null,
    comment: string,
  ) {
    await this.databaseService.query(
      'update applications set current_stage_id = $2, updated_at = now() where id = $1',
      [applicationId, toStageId],
    );
    await this.databaseService.query(
      `insert into application_stage_history
       (application_id, from_stage_id, to_stage_id, changed_by, comment)
       values ($1, $2, $3, $4, $5)`,
      [applicationId, fromStageId, toStageId, changedBy, comment],
    );
  }

  private isUniqueViolation(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
  }
}
