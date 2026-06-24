import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { WebsoftVacancyDto } from './dto/websoft-vacancy.dto';

@Injectable()
export class WebsoftIntegrationService {
  constructor(private readonly databaseService: DatabaseService) {}

  async importApprovedVacancy(dto: WebsoftVacancyDto) {
    for (const field of ['externalRequestId', 'branchCode', 'title', 'position'] as const) {
      if (!dto[field]) throw new BadRequestException(`${field} is required`);
    }
    if (dto.approvalStatus !== 'approved') {
      throw new BadRequestException('Websoft request must be fully approved');
    }

    const branch = await this.databaseService.query<{ id: string; name: string }>(
      'select id, name from branches where code = $1 and is_active = true',
      [dto.branchCode],
    );
    if (!branch.rows[0]) throw new NotFoundException('Websoft branch code is not mapped');
    const branchId = branch.rows[0].id;

    let departmentId: string | null = null;
    if (dto.departmentName) {
      const department = await this.databaseService.query<{ id: string }>(
        `insert into departments (branch_id, name)
         values ($1, $2)
         on conflict (branch_id, name) do update set name = excluded.name
         returning id`,
        [branchId, dto.departmentName],
      );
      departmentId = department.rows[0].id;
    }

    const recruiter = await this.databaseService.query<{ id: string; full_name: string }>(
      `select u.id, u.full_name
       from users u
       join roles r on r.id = u.role_id and r.code in ('recruiter', 'branch_hr')
       join user_branch_access uba on uba.user_id = u.id and uba.branch_id = $1
       where u.is_active = true
       order by uba.is_primary desc, u.created_at
       limit 1`,
      [branchId],
    );
    const manager = dto.hiringManagerEmail
      ? await this.databaseService.query<{ id: string }>(
          'select id from users where lower(email) = lower($1) and is_active = true',
          [dto.hiringManagerEmail],
        )
      : null;
    const status = await this.lookupId('vacancy_statuses', 'open');
    const employment = await this.lookupId(
      'employment_types',
      dto.employmentTypeCode || 'full_time',
    );

    const result = await this.databaseService.query<{
      id: string;
      created: boolean;
    }>(
      `insert into vacancies (
        branch_id, department_id, hiring_manager_id, recruiter_id,
        status_id, employment_type_id, title, position, description,
        requirements, working_conditions, headcount, published_at,
        external_request_id, source_system
      ) values (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        current_date, $13, 'websoft'
      )
      on conflict (external_request_id) where external_request_id is not null do update set
        branch_id = excluded.branch_id,
        department_id = excluded.department_id,
        hiring_manager_id = excluded.hiring_manager_id,
        recruiter_id = excluded.recruiter_id,
        title = excluded.title,
        position = excluded.position,
        description = excluded.description,
        requirements = excluded.requirements,
        working_conditions = excluded.working_conditions,
        headcount = excluded.headcount,
        updated_at = now()
      returning id, (xmax = 0) as created`,
      [
        branchId,
        departmentId,
        manager?.rows[0]?.id || null,
        recruiter.rows[0]?.id || null,
        status,
        employment,
        dto.title,
        dto.position,
        dto.description || `Заявка импортирована из Websoft: ${dto.externalRequestId}`,
        dto.requirements || 'Требования будут уточнены заказчиком',
        dto.workingConditions || 'Условия будут уточнены заказчиком',
        dto.headcount || 1,
        dto.externalRequestId,
      ],
    );

    return {
      vacancyId: result.rows[0].id,
      created: result.rows[0].created,
      externalRequestId: dto.externalRequestId,
      branch: { id: branchId, code: dto.branchCode, name: branch.rows[0].name },
      recruiter: recruiter.rows[0]
        ? { id: recruiter.rows[0].id, name: recruiter.rows[0].full_name }
        : null,
      assignmentStatus: recruiter.rows[0] ? 'assigned' : 'unassigned',
    };
  }

  getStatus() {
    return {
      provider: 'Websoft',
      mode: 'approved_vacancy_import',
      endpoint: '/api/integrations/websoft/vacancies',
    };
  }

  private async lookupId(table: string, code: string) {
    const result = await this.databaseService.query<{ id: string }>(
      `select id from ${table} where code = $1`,
      [code],
    );
    if (!result.rows[0]) throw new BadRequestException(`${table} code not found: ${code}`);
    return result.rows[0].id;
  }
}
