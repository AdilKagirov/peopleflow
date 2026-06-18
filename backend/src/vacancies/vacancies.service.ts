import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { QueryResultRow } from 'pg';
import { compact, toNumber } from '../common/sql';
import { DatabaseService } from '../database/database.service';
import { CreateVacancyDto } from './dto/create-vacancy.dto';
import { UpdateVacancyDto } from './dto/update-vacancy.dto';

interface VacancyRow extends QueryResultRow {
  id: string;
  title: string;
  position: string;
  description: string;
  requirements: string;
  working_conditions: string;
  salary_min: string | null;
  salary_max: string | null;
  salary_currency: string;
  published_at: string | null;
  closed_at: string | null;
  close_reason: string | null;
  headcount: number;
  is_confidential: boolean;
  created_at: string;
  updated_at: string;
  department_id: string | null;
  department_name: string | null;
  status_code: string;
  status_name: string;
  employment_type_code: string | null;
  employment_type_name: string | null;
  hiring_manager_name: string | null;
  recruiter_name: string | null;
}

@Injectable()
export class VacanciesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(filters: { status?: string; search?: string }) {
    const where: string[] = [];
    const params: unknown[] = [];

    if (filters.status) {
      params.push(filters.status);
      where.push(`vs.code = $${params.length}`);
    }

    if (filters.search) {
      params.push(`%${filters.search}%`);
      where.push(`(
        v.title ilike $${params.length}
        or v.position ilike $${params.length}
        or d.name ilike $${params.length}
      )`);
    }

    const result = await this.databaseService.query<VacancyRow>(
      `${this.baseQuery()}
       ${where.length ? `where ${where.join(' and ')}` : ''}
       order by v.created_at desc`,
      params,
    );

    return result.rows.map((row) => this.mapVacancy(row));
  }

  async findOne(id: string) {
    const result = await this.databaseService.query<VacancyRow>(
      `${this.baseQuery()} where v.id = $1`,
      [id],
    );

    const vacancy = result.rows[0];
    if (!vacancy) {
      throw new NotFoundException('Vacancy not found');
    }

    return this.mapVacancy(vacancy);
  }

  async create(dto: CreateVacancyDto) {
    this.require(dto.title, 'title');
    this.require(dto.position, 'position');
    this.require(dto.description, 'description');
    this.require(dto.requirements, 'requirements');
    this.require(dto.workingConditions, 'workingConditions');

    const statusId = await this.lookupId(
      'vacancy_statuses',
      dto.statusCode || 'open',
      'Vacancy status not found',
    );
    const employmentTypeId = await this.lookupOptionalId(
      'employment_types',
      dto.employmentTypeCode || 'full_time',
      'Employment type not found',
    );

    const result = await this.databaseService.query<{ id: string }>(
      `insert into vacancies (
        department_id, hiring_manager_id, recruiter_id, status_id, employment_type_id,
        title, position, description, requirements, working_conditions,
        salary_min, salary_max, salary_currency, published_at, closed_at,
        headcount, is_confidential
      )
      values (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17
      )
      returning id`,
      [
        dto.departmentId || null,
        dto.hiringManagerId || null,
        dto.recruiterId || null,
        statusId,
        employmentTypeId,
        dto.title,
        dto.position,
        dto.description,
        dto.requirements,
        dto.workingConditions,
        toNumber(dto.salaryMin) ?? null,
        toNumber(dto.salaryMax) ?? null,
        dto.salaryCurrency || 'KZT',
        dto.publishedAt || null,
        dto.closedAt || null,
        toNumber(dto.headcount) ?? 1,
        dto.isConfidential ?? false,
      ],
    );

    return this.findOne(result.rows[0].id);
  }

  async update(id: string, dto: UpdateVacancyDto) {
    await this.findOne(id);

    const values = compact({
      department_id: dto.departmentId,
      hiring_manager_id: dto.hiringManagerId,
      recruiter_id: dto.recruiterId,
      title: dto.title,
      position: dto.position,
      description: dto.description,
      requirements: dto.requirements,
      working_conditions: dto.workingConditions,
      salary_min: dto.salaryMin === undefined ? undefined : toNumber(dto.salaryMin) ?? null,
      salary_max: dto.salaryMax === undefined ? undefined : toNumber(dto.salaryMax) ?? null,
      salary_currency: dto.salaryCurrency,
      published_at: dto.publishedAt,
      closed_at: dto.closedAt,
      close_reason: dto.closeReason,
      headcount: dto.headcount === undefined ? undefined : toNumber(dto.headcount),
      is_confidential: dto.isConfidential,
    });

    if (dto.statusCode !== undefined) {
      values.status_id = await this.lookupId(
        'vacancy_statuses',
        dto.statusCode,
        'Vacancy status not found',
      );
    }

    if (dto.employmentTypeCode !== undefined) {
      values.employment_type_id = dto.employmentTypeCode
        ? await this.lookupId(
            'employment_types',
            dto.employmentTypeCode,
            'Employment type not found',
          )
        : null;
    }

    const entries = Object.entries(values);
    if (!entries.length) {
      return this.findOne(id);
    }

    const assignments = entries.map(([key], index) => `${key} = $${index + 2}`);
    await this.databaseService.query(
      `update vacancies
       set ${assignments.join(', ')}, updated_at = now()
       where id = $1`,
      [id, ...entries.map(([, value]) => value)],
    );

    return this.findOne(id);
  }

  private baseQuery() {
    return `select
      v.id, v.title, v.position, v.description, v.requirements,
      v.working_conditions, v.salary_min, v.salary_max, v.salary_currency,
      v.published_at, v.closed_at, v.close_reason, v.headcount,
      v.is_confidential, v.created_at, v.updated_at,
      d.id as department_id, d.name as department_name,
      vs.code as status_code, vs.name as status_name,
      et.code as employment_type_code, et.name as employment_type_name,
      hm.full_name as hiring_manager_name,
      r.full_name as recruiter_name
    from vacancies v
    join vacancy_statuses vs on vs.id = v.status_id
    left join departments d on d.id = v.department_id
    left join employment_types et on et.id = v.employment_type_id
    left join users hm on hm.id = v.hiring_manager_id
    left join users r on r.id = v.recruiter_id`;
  }

  private mapVacancy(row: VacancyRow) {
    return {
      id: row.id,
      title: row.title,
      position: row.position,
      description: row.description,
      requirements: row.requirements,
      workingConditions: row.working_conditions,
      status: {
        code: row.status_code,
        name: row.status_name,
      },
      department: row.department_id
        ? { id: row.department_id, name: row.department_name }
        : null,
      employmentType: row.employment_type_code
        ? { code: row.employment_type_code, name: row.employment_type_name }
        : null,
      salary: {
        min: row.salary_min ? Number(row.salary_min) : null,
        max: row.salary_max ? Number(row.salary_max) : null,
        currency: row.salary_currency,
      },
      publishedAt: row.published_at,
      closedAt: row.closed_at,
      closeReason: row.close_reason,
      headcount: row.headcount,
      isConfidential: row.is_confidential,
      hiringManagerName: row.hiring_manager_name,
      recruiterName: row.recruiter_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
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

  private async lookupOptionalId(table: string, code: string, message: string) {
    return code ? this.lookupId(table, code, message) : null;
  }

  private require(value: unknown, field: string) {
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException(`${field} is required`);
    }
  }
}

