import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { QueryResultRow } from 'pg';
import { DatabaseService } from '../database/database.service';

interface UserScopeRow extends QueryResultRow {
  id: string;
  role_code: string | null;
  branch_id: string | null;
  access_all_branches: boolean;
}

@Injectable()
export class AccessScopeService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getScope(userId?: string) {
    if (!userId) return { allBranches: true, branchIds: [] as string[], userId: null };
    const user = await this.databaseService.query<UserScopeRow>(
      `select u.id, u.branch_id, u.access_all_branches, r.code as role_code
       from users u left join roles r on r.id = u.role_id
       where u.id = $1 and u.is_active = true`,
      [userId],
    );
    if (!user.rows[0]) throw new NotFoundException('Active user not found');
    const row = user.rows[0];
    if (row.access_all_branches || row.role_code === 'admin') {
      return { allBranches: true, branchIds: [] as string[], userId };
    }
    const branches = await this.databaseService.query<{ branch_id: string }>(
      `select branch_id from user_branch_access where user_id = $1
       union select branch_id from users where id = $1 and branch_id is not null`,
      [userId],
    );
    return {
      allBranches: false,
      branchIds: branches.rows.map((item) => item.branch_id),
      userId,
    };
  }

  async assertBranchAccess(userId: string | undefined, branchId: string | null) {
    const scope = await this.getScope(userId);
    if (!scope.allBranches && (!branchId || !scope.branchIds.includes(branchId))) {
      throw new ForbiddenException('Нет доступа к данным этого филиала');
    }
  }

  async getPrimaryBranchId(userId?: string) {
    if (!userId) return null;
    const result = await this.databaseService.query<{ branch_id: string }>(
      `select branch_id from user_branch_access
       where user_id = $1 order by is_primary desc limit 1`,
      [userId],
    );
    return result.rows[0]?.branch_id || null;
  }
}

