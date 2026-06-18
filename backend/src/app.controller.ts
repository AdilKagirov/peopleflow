import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { DatabaseService } from './database/database.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Get()
  getApiInfo() {
    return this.appService.getApiInfo();
  }

  @Get('health')
  async getHealth() {
    const database = await this.databaseService.health();
    return {
      service: 'KMF PeopleFlow API',
      status: database.ok ? 'ok' : 'degraded',
      database,
      checkedAt: new Date().toISOString(),
    };
  }
}
