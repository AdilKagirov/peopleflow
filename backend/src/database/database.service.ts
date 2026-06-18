import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.get<string>('DATABASE_URL'),
    });
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ) {
    return this.pool.query<T>(text, params);
  }

  async health() {
    try {
      const result = await this.query<{ ok: number; database: string }>(
        'select 1 as ok, current_database() as database',
      );
      return {
        ok: true,
        database: result.rows[0]?.database,
      };
    } catch (error) {
      return {
        ok: false,
        error: this.formatError(error),
      };
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  private formatError(error: unknown): string {
    if (error instanceof AggregateError) {
      return error.errors
        .map((item) => this.formatError(item))
        .filter(Boolean)
        .join('; ');
    }

    if (error instanceof Error) {
      return error.message || error.name;
    }

    return String(error || 'Unknown database error');
  }
}
