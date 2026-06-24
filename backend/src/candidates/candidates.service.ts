import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { QueryResultRow } from 'pg';
import { unlink } from 'node:fs/promises';
import { AccessScopeService } from '../access/access-scope.service';
import { compact, toNumber } from '../common/sql';
import { DatabaseService } from '../database/database.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';

interface CandidateRow extends QueryResultRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  current_position: string | null;
  total_experience_months: number | null;
  education: string | null;
  skills: string | null;
  expected_salary: string | null;
  expected_salary_currency: string | null;
  consent_personal_data: boolean;
  source_code: string | null;
  source_name: string | null;
  applications_count: number;
  document_types: string[];
  branch_id: string | null;
  branch_code: string | null;
  branch_name: string | null;
  created_at: string;
  updated_at: string;
}

interface AttachmentRow extends QueryResultRow {
  id: string;
  file_path: string;
}

@Injectable()
export class CandidatesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly accessScopeService: AccessScopeService,
  ) {}

  async findAll(filters: { search?: string; source?: string; branchId?: string; userId?: string }) {
    const where: string[] = [];
    const params: unknown[] = [];

    if (filters.source) {
      params.push(filters.source);
      where.push(`s.code = $${params.length}`);
    }

    if (filters.search) {
      params.push(`%${filters.search}%`);
      where.push(`(
        c.full_name ilike $${params.length}
        or c.email ilike $${params.length}
        or c.phone ilike $${params.length}
        or c.skills ilike $${params.length}
      )`);
    }
    const scope = await this.accessScopeService.getScope(filters.userId);
    if (!scope.allBranches) {
      params.push(scope.branchIds);
      where.push(`(
        c.branch_id = any($${params.length}::uuid[])
        or exists (
          select 1 from applications scoped_a
          join vacancies scoped_v on scoped_v.id = scoped_a.vacancy_id
          where scoped_a.candidate_id = c.id
            and scoped_v.branch_id = any($${params.length}::uuid[])
        )
      )`);
    }
    if (filters.branchId) {
      await this.accessScopeService.assertBranchAccess(filters.userId, filters.branchId);
      params.push(filters.branchId);
      where.push(`(
        c.branch_id = $${params.length}
        or exists (
          select 1 from applications scoped_a
          join vacancies scoped_v on scoped_v.id = scoped_a.vacancy_id
          where scoped_a.candidate_id = c.id and scoped_v.branch_id = $${params.length}
        )
      )`);
    }

    const result = await this.databaseService.query<CandidateRow>(
      `${this.baseQuery()}
       ${where.length ? `where ${where.join(' and ')}` : ''}
       group by c.id, s.code, s.name, b.id
       order by c.created_at desc`,
      params,
    );

    return result.rows.map((row) => this.mapCandidate(row));
  }

  async findOne(id: string, userId?: string) {
    const result = await this.databaseService.query<CandidateRow>(
      `${this.baseQuery()}
       where c.id = $1
       group by c.id, s.code, s.name, b.id`,
      [id],
    );

    const candidate = result.rows[0];
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }
    await this.assertCandidateAccess(id, candidate.branch_id, userId);

    return this.mapCandidate(candidate);
  }

  async create(dto: CreateCandidateDto, userId?: string) {
    this.require(dto.fullName, 'fullName');

    const sourceId = await this.lookupOptionalSourceId(dto.sourceCode || 'manual');
    const branchId = dto.branchId || await this.accessScopeService.getPrimaryBranchId(userId);
    await this.accessScopeService.assertBranchAccess(userId, branchId);
    const result = await this.databaseService.query<{ id: string }>(
      `insert into candidates (
        branch_id, first_name, last_name, middle_name, full_name, email, phone, city,
        current_position, total_experience_months, education, skills,
        expected_salary, expected_salary_currency, source_id, consent_personal_data
      )
      values (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15, $16
      )
      returning id`,
      [
        branchId,
        dto.firstName || null,
        dto.lastName || null,
        dto.middleName || null,
        dto.fullName,
        dto.email || null,
        dto.phone || null,
        dto.city || null,
        dto.currentPosition || null,
        toNumber(dto.totalExperienceMonths) ?? null,
        dto.education || null,
        dto.skills || null,
        toNumber(dto.expectedSalary) ?? null,
        dto.expectedSalaryCurrency || 'KZT',
        sourceId,
        dto.consentPersonalData ?? false,
      ],
    );

    return this.findOne(result.rows[0].id, userId);
  }

  async update(id: string, dto: UpdateCandidateDto, userId?: string) {
    await this.findOne(id, userId);
    if (dto.branchId) await this.accessScopeService.assertBranchAccess(userId, dto.branchId);

    const values = compact({
      branch_id: dto.branchId,
      first_name: dto.firstName,
      last_name: dto.lastName,
      middle_name: dto.middleName,
      full_name: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      city: dto.city,
      current_position: dto.currentPosition,
      total_experience_months:
        dto.totalExperienceMonths === undefined
          ? undefined
          : toNumber(dto.totalExperienceMonths) ?? null,
      education: dto.education,
      skills: dto.skills,
      expected_salary:
        dto.expectedSalary === undefined ? undefined : toNumber(dto.expectedSalary) ?? null,
      expected_salary_currency: dto.expectedSalaryCurrency,
      consent_personal_data: dto.consentPersonalData,
    });

    if (dto.sourceCode !== undefined) {
      values.source_id = dto.sourceCode
        ? await this.lookupOptionalSourceId(dto.sourceCode)
        : null;
    }

    const entries = Object.entries(values);
    if (!entries.length) {
      return this.findOne(id, userId);
    }

    const assignments = entries.map(([key], index) => `${key} = $${index + 2}`);
    await this.databaseService.query(
      `update candidates
       set ${assignments.join(', ')}, updated_at = now()
       where id = $1`,
      [id, ...entries.map(([, value]) => value)],
    );

    return this.findOne(id, userId);
  }

  async remove(id: string, userId?: string) {
    await this.findOne(id, userId);
    const attachments = await this.databaseService.query<AttachmentRow>(
      `select id, file_path
       from attachments
       where owner_type = 'candidate' and owner_id = $1`,
      [id],
    );

    await this.databaseService.query('delete from candidates where id = $1', [id]);
    await this.databaseService.query(
      `delete from attachments
       where owner_type = 'candidate' and owner_id = $1`,
      [id],
    );

    const deletedFiles: string[] = [];
    for (const attachment of attachments.rows) {
      try {
        await unlink(attachment.file_path);
        deletedFiles.push(attachment.file_path);
      } catch {
        // The database deletion should not fail because a local file is already missing.
      }
    }

    return {
      deleted: true,
      candidateId: id,
      removedAttachments: attachments.rowCount,
      removedFiles: deletedFiles.length,
    };
  }

  private baseQuery() {
    return `select
      c.id, c.first_name, c.last_name, c.middle_name, c.full_name,
      c.branch_id, b.code as branch_code, b.name as branch_name,
      c.email, c.phone, c.city, c.current_position, c.total_experience_months,
      c.education, c.skills, c.expected_salary, c.expected_salary_currency,
      c.consent_personal_data, c.created_at, c.updated_at,
      s.code as source_code, s.name as source_name,
      count(distinct a.id)::int as applications_count,
      coalesce(
        array_agg(distinct att.document_type) filter (where att.document_type is not null),
        '{}'::text[]
      ) as document_types
    from candidates c
    left join sources s on s.id = c.source_id
    left join branches b on b.id = c.branch_id
    left join applications a on a.candidate_id = c.id
    left join attachments att
      on att.owner_type = 'candidate' and att.owner_id = c.id`;
  }

  private mapCandidate(row: CandidateRow) {
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      middleName: row.middle_name,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      city: row.city,
      currentPosition: row.current_position,
      totalExperienceMonths: row.total_experience_months,
      education: row.education,
      skills: row.skills,
      expectedSalary: row.expected_salary ? Number(row.expected_salary) : null,
      expectedSalaryCurrency: row.expected_salary_currency,
      source: row.source_code ? { code: row.source_code, name: row.source_name } : null,
      consentPersonalData: row.consent_personal_data,
      applicationsCount: row.applications_count,
      documentTypes: row.document_types,
      branch: row.branch_id
        ? { id: row.branch_id, code: row.branch_code, name: row.branch_name }
        : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private async lookupOptionalSourceId(code: string) {
    const result = await this.databaseService.query<{ id: string }>(
      'select id from sources where code = $1',
      [code],
    );

    if (!result.rows[0]) {
      throw new BadRequestException('Source not found');
    }

    return result.rows[0].id;
  }

  private async assertCandidateAccess(id: string, branchId: string | null, userId?: string) {
    const scope = await this.accessScopeService.getScope(userId);
    if (scope.allBranches) return;
    if (branchId && scope.branchIds.includes(branchId)) return;
    const application = await this.databaseService.query(
      `select 1 from applications a join vacancies v on v.id = a.vacancy_id
       where a.candidate_id = $1 and v.branch_id = any($2::uuid[]) limit 1`,
      [id, scope.branchIds],
    );
    if (!application.rowCount) await this.accessScopeService.assertBranchAccess(userId, branchId);
  }

  private require(value: unknown, field: string) {
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException(`${field} is required`);
    }
  }
}
