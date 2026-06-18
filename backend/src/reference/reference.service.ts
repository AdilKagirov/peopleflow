import { Injectable } from '@nestjs/common';
import { QueryResultRow } from 'pg';
import { DatabaseService } from '../database/database.service';

interface PipelineStageRow extends QueryResultRow {
  id: string;
  code: string;
  name: string;
  sort_order: number;
  is_terminal: boolean;
  template_id: string | null;
  template_name: string | null;
}

interface DepartmentRow extends QueryResultRow {
  id: string;
  name: string;
  branch_id: string | null;
  branch_name: string | null;
}

interface UserRow extends QueryResultRow {
  id: string;
  full_name: string;
  email: string;
  role_code: string | null;
  role_name: string | null;
  department_id: string | null;
  department_name: string | null;
}

@Injectable()
export class ReferenceService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getAll() {
    const [
      pipelineStages,
      vacancyStatuses,
      applicationStatuses,
      sources,
      employmentTypes,
      departments,
      users,
    ] = await Promise.all([
      this.getPipelineStages(),
      this.getVacancyStatuses(),
      this.getApplicationStatuses(),
      this.getSources(),
      this.getEmploymentTypes(),
      this.getDepartments(),
      this.getUsers(),
    ]);

    return {
      pipelineStages,
      vacancyStatuses,
      applicationStatuses,
      sources,
      employmentTypes,
      departments,
      users,
    };
  }

  async getPipelineStages() {
    const result = await this.databaseService.query<PipelineStageRow>(
      `select
        ps.id, ps.code, ps.name, ps.sort_order, ps.is_terminal,
        pt.id as template_id, pt.name as template_name
      from pipeline_stages ps
      left join pipeline_templates pt on pt.id = ps.template_id
      order by pt.is_default desc, ps.sort_order`,
    );

    return result.rows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      sortOrder: row.sort_order,
      isTerminal: row.is_terminal,
      template: row.template_id
        ? { id: row.template_id, name: row.template_name }
        : null,
    }));
  }

  async getVacancyStatuses() {
    return this.getCodeNameRows(
      'select code, name from vacancy_statuses order by sort_order, name',
    );
  }

  async getApplicationStatuses() {
    return this.getCodeNameRows(
      'select code, name from application_statuses order by name',
    );
  }

  async getSources() {
    const result = await this.databaseService.query<{
      code: string;
      name: string;
      is_external: boolean;
    }>('select code, name, is_external from sources order by name');

    return result.rows.map((row) => ({
      code: row.code,
      name: row.name,
      isExternal: row.is_external,
    }));
  }

  async getEmploymentTypes() {
    return this.getCodeNameRows(
      'select code, name from employment_types order by name',
    );
  }

  async getDepartments() {
    const result = await this.databaseService.query<DepartmentRow>(
      `select d.id, d.name, b.id as branch_id, b.name as branch_name
       from departments d
       left join branches b on b.id = d.branch_id
       order by b.name, d.name`,
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      branch: row.branch_id ? { id: row.branch_id, name: row.branch_name } : null,
    }));
  }

  async getUsers() {
    const result = await this.databaseService.query<UserRow>(
      `select
        u.id, u.full_name, u.email,
        r.code as role_code, r.name as role_name,
        d.id as department_id, d.name as department_name
      from users u
      left join roles r on r.id = u.role_id
      left join departments d on d.id = u.department_id
      where u.is_active = true
      order by u.full_name`,
    );

    return result.rows.map((row) => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      role: row.role_code ? { code: row.role_code, name: row.role_name } : null,
      department: row.department_id
        ? { id: row.department_id, name: row.department_name }
        : null,
    }));
  }

  private async getCodeNameRows(sql: string) {
    const result = await this.databaseService.query<{
      code: string;
      name: string;
    }>(sql);

    return result.rows.map((row) => ({ code: row.code, name: row.name }));
  }
}

