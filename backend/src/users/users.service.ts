import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryResultRow } from 'pg';
import { compact } from '../common/sql';
import { DatabaseService } from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

interface UserRow extends QueryResultRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  access_all_branches: boolean;
  created_at: string;
  updated_at: string;
  role_code: string | null;
  role_name: string | null;
  primary_branch_id: string | null;
  primary_branch_code: string | null;
  primary_branch_name: string | null;
  branches: Array<{ id: string; code: string; name: string; isPrimary: boolean }>;
}

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(actorId?: string) {
    await this.assertAdmin(actorId);
    const result = await this.databaseService.query<UserRow>(
      `${this.baseQuery()} group by u.id, r.id, pb.id order by u.is_active desc, u.full_name`,
    );
    return result.rows.map((row) => this.mapUser(row));
  }

  async findOne(id: string, actorId?: string) {
    await this.assertAdmin(actorId);
    const result = await this.databaseService.query<UserRow>(
      `${this.baseQuery()} where u.id = $1 group by u.id, r.id, pb.id`,
      [id],
    );
    if (!result.rows[0]) throw new NotFoundException('User not found');
    return this.mapUser(result.rows[0]);
  }

  async create(dto: CreateUserDto, actorId?: string) {
    await this.assertAdmin(actorId);
    this.require(dto.fullName, 'fullName');
    this.require(dto.email, 'email');
    this.require(dto.roleCode, 'roleCode');
    const roleId = await this.lookupRoleId(dto.roleCode);
    const branchIds = this.normalizeBranches(dto.branchIds, dto.primaryBranchId);
    await this.ensureBranches(branchIds);

    try {
      const result = await this.databaseService.query<{ id: string }>(
        `insert into users (
          branch_id, role_id, full_name, email, phone,
          access_all_branches, is_active
        ) values ($1, $2, $3, lower($4), $5, $6, $7)
        returning id`,
        [
          dto.primaryBranchId || branchIds[0] || null,
          roleId,
          dto.fullName,
          dto.email,
          dto.phone || null,
          dto.accessAllBranches ?? false,
          dto.isActive ?? true,
        ],
      );
      await this.replaceBranchAccess(result.rows[0].id, branchIds, dto.primaryBranchId);
      return this.findOne(result.rows[0].id, actorId);
    } catch (error) {
      if (this.isUniqueViolation(error)) throw new ConflictException('Email already exists');
      throw error;
    }
  }

  async update(id: string, dto: UpdateUserDto, actorId?: string) {
    await this.assertAdmin(actorId);
    await this.ensureUser(id);
    if (actorId === id && (dto.isActive === false || (dto.roleCode && dto.roleCode !== 'admin'))) {
      throw new BadRequestException('Нельзя заблокировать себя или снять собственную роль администратора');
    }
    const values = compact({
      full_name: dto.fullName,
      email: dto.email?.toLowerCase(),
      phone: dto.phone,
      access_all_branches: dto.accessAllBranches,
      is_active: dto.isActive,
      branch_id: dto.primaryBranchId,
    });
    if (dto.roleCode !== undefined) values.role_id = await this.lookupRoleId(dto.roleCode);
    let branchAssignment: { branchIds: string[]; primaryBranchId?: string } | null = null;
    if (dto.branchIds !== undefined) {
      const branchIds = this.normalizeBranches(dto.branchIds, dto.primaryBranchId || undefined);
      await this.ensureBranches(branchIds);
      values.branch_id = dto.primaryBranchId || branchIds[0] || null;
      branchAssignment = { branchIds, primaryBranchId: dto.primaryBranchId || undefined };
    }

    const entries = Object.entries(values);
    if (entries.length) {
      const assignments = entries.map(([key], index) => `${key} = $${index + 2}`);
      try {
        await this.databaseService.query(
          `update users set ${assignments.join(', ')}, updated_at = now() where id = $1`,
          [id, ...entries.map(([, value]) => value)],
        );
      } catch (error) {
        if (this.isUniqueViolation(error)) throw new ConflictException('Email already exists');
        throw error;
      }
    }
    if (branchAssignment) {
      await this.replaceBranchAccess(
        id,
        branchAssignment.branchIds,
        branchAssignment.primaryBranchId,
      );
    }
    return this.findOne(id, actorId);
  }

  private baseQuery() {
    return `select
      u.id, u.full_name, u.email, u.phone, u.is_active,
      u.access_all_branches, u.created_at, u.updated_at,
      r.code as role_code, r.name as role_name,
      pb.id as primary_branch_id, pb.code as primary_branch_code,
      pb.name as primary_branch_name,
      coalesce(
        jsonb_agg(distinct jsonb_build_object(
          'id', b.id, 'code', b.code, 'name', b.name, 'isPrimary', uba.is_primary
        )) filter (where b.id is not null),
        '[]'::jsonb
      ) as branches
    from users u
    left join roles r on r.id = u.role_id
    left join branches pb on pb.id = u.branch_id
    left join user_branch_access uba on uba.user_id = u.id
    left join branches b on b.id = uba.branch_id`;
  }

  private mapUser(row: UserRow) {
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      role: row.role_code ? { code: row.role_code, name: row.role_name } : null,
      primaryBranch: row.primary_branch_id
        ? {
            id: row.primary_branch_id,
            code: row.primary_branch_code,
            name: row.primary_branch_name,
          }
        : null,
      branches: row.branches,
      accessAllBranches: row.access_all_branches,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private async replaceBranchAccess(
    userId: string,
    branchIds: string[],
    primaryBranchId?: string,
  ) {
    await this.databaseService.query('delete from user_branch_access where user_id = $1', [userId]);
    if (!branchIds.length) return;
    await this.databaseService.query(
      `insert into user_branch_access (user_id, branch_id, is_primary)
       select $1, branch_id, branch_id = $3
       from unnest($2::uuid[]) branch_id`,
      [userId, branchIds, primaryBranchId || branchIds[0]],
    );
  }

  private normalizeBranches(branchIds: string[] = [], primaryBranchId?: string) {
    return [...new Set([...branchIds, ...(primaryBranchId ? [primaryBranchId] : [])])];
  }

  private async ensureBranches(branchIds: string[]) {
    if (!branchIds.length) return;
    const result = await this.databaseService.query<{ count: number }>(
      'select count(*)::int as count from branches where id = any($1::uuid[]) and is_active = true',
      [branchIds],
    );
    if (result.rows[0].count !== branchIds.length) {
      throw new BadRequestException('One or more branches are invalid');
    }
  }

  private async lookupRoleId(code: string) {
    const result = await this.databaseService.query<{ id: string }>(
      'select id from roles where code = $1',
      [code],
    );
    if (!result.rows[0]) throw new BadRequestException('Role not found');
    return result.rows[0].id;
  }

  private async ensureUser(id: string) {
    const result = await this.databaseService.query('select 1 from users where id = $1', [id]);
    if (!result.rowCount) throw new NotFoundException('User not found');
  }

  private async assertAdmin(actorId?: string) {
    if (!actorId) return;
    const result = await this.databaseService.query<{ role_code: string }>(
      `select r.code as role_code from users u join roles r on r.id = u.role_id
       where u.id = $1 and u.is_active = true`,
      [actorId],
    );
    if (result.rows[0]?.role_code !== 'admin') {
      throw new ForbiddenException('Только администратор может управлять пользователями');
    }
  }

  private require(value: unknown, field: string) {
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException(`${field} is required`);
    }
  }

  private isUniqueViolation(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
  }
}
