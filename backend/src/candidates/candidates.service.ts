import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { QueryResultRow } from 'pg';
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
  created_at: string;
  updated_at: string;
}

@Injectable()
export class CandidatesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(filters: { search?: string; source?: string }) {
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

    const result = await this.databaseService.query<CandidateRow>(
      `${this.baseQuery()}
       ${where.length ? `where ${where.join(' and ')}` : ''}
       group by c.id, s.code, s.name
       order by c.created_at desc`,
      params,
    );

    return result.rows.map((row) => this.mapCandidate(row));
  }

  async findOne(id: string) {
    const result = await this.databaseService.query<CandidateRow>(
      `${this.baseQuery()}
       where c.id = $1
       group by c.id, s.code, s.name`,
      [id],
    );

    const candidate = result.rows[0];
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    return this.mapCandidate(candidate);
  }

  async create(dto: CreateCandidateDto) {
    this.require(dto.fullName, 'fullName');

    const sourceId = await this.lookupOptionalSourceId(dto.sourceCode || 'manual');
    const result = await this.databaseService.query<{ id: string }>(
      `insert into candidates (
        first_name, last_name, middle_name, full_name, email, phone, city,
        current_position, total_experience_months, education, skills,
        expected_salary, expected_salary_currency, source_id, consent_personal_data
      )
      values (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11,
        $12, $13, $14, $15
      )
      returning id`,
      [
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

    return this.findOne(result.rows[0].id);
  }

  async update(id: string, dto: UpdateCandidateDto) {
    await this.findOne(id);

    const values = compact({
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
      return this.findOne(id);
    }

    const assignments = entries.map(([key], index) => `${key} = $${index + 2}`);
    await this.databaseService.query(
      `update candidates
       set ${assignments.join(', ')}, updated_at = now()
       where id = $1`,
      [id, ...entries.map(([, value]) => value)],
    );

    return this.findOne(id);
  }

  private baseQuery() {
    return `select
      c.id, c.first_name, c.last_name, c.middle_name, c.full_name,
      c.email, c.phone, c.city, c.current_position, c.total_experience_months,
      c.education, c.skills, c.expected_salary, c.expected_salary_currency,
      c.consent_personal_data, c.created_at, c.updated_at,
      s.code as source_code, s.name as source_name,
      count(a.id)::int as applications_count
    from candidates c
    left join sources s on s.id = c.source_id
    left join applications a on a.candidate_id = c.id`;
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

  private require(value: unknown, field: string) {
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException(`${field} is required`);
    }
  }
}

