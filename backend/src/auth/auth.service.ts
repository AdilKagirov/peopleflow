import { Injectable, UnauthorizedException } from '@nestjs/common';
import { QueryResultRow } from 'pg';
import { DatabaseService } from '../database/database.service';
import { verifyPassword } from './password';

interface AuthUserRow extends QueryResultRow {
  id: string;
  full_name: string;
  email: string;
  password_hash: string | null;
  role_code: string | null;
  role_name: string | null;
  branch_id: string | null;
  branch_code: string | null;
  branch_name: string | null;
  access_all_branches: boolean;
  branches: Array<{ id: string; code: string; name: string; isPrimary: boolean }>;
}

@Injectable()
export class AuthService {
  constructor(private readonly databaseService: DatabaseService) {}

  async login(email?: string, password?: string) {
    if (!email || !password) throw new UnauthorizedException('Неверный email или пароль');

    const result = await this.databaseService.query<AuthUserRow>(
      `select
        u.id, u.full_name, u.email, u.password_hash,
        r.code as role_code, r.name as role_name,
        b.id as branch_id, b.code as branch_code, b.name as branch_name,
        u.access_all_branches,
        coalesce(
          jsonb_agg(distinct jsonb_build_object(
            'id', ab.id, 'code', ab.code, 'name', ab.name, 'isPrimary', uba.is_primary
          )) filter (where ab.id is not null),
          '[]'::jsonb
        ) as branches
      from users u
      left join roles r on r.id = u.role_id
      left join branches b on b.id = u.branch_id
      left join user_branch_access uba on uba.user_id = u.id
      left join branches ab on ab.id = uba.branch_id
      where lower(u.email) = lower($1) and u.is_active = true
      group by u.id, r.code, r.name, b.id, b.code, b.name`,
      [email.trim()],
    );

    const user = result.rows[0];
    if (!user?.password_hash || !verifyPassword(password, user.password_hash)) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    return {
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role_code ? { code: user.role_code, name: user.role_name } : null,
        branch: user.branch_id
          ? { id: user.branch_id, code: user.branch_code, name: user.branch_name }
          : null,
        branches: user.branches,
        accessAllBranches: user.access_all_branches,
      },
    };
  }

}
