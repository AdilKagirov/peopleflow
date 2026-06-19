import { Controller, Get, Post } from '@nestjs/common';
import { HhIntegrationService } from './hh-integration.service';

@Controller('integrations/hh')
export class HhIntegrationController {
  constructor(private readonly hhIntegrationService: HhIntegrationService) {}

  @Get('status')
  getStatus() {
    return this.hhIntegrationService.getStatus();
  }

  @Get('connect')
  getConnectUrl() {
    return this.hhIntegrationService.getConnectUrl();
  }

  @Post('sync')
  sync() {
    return this.hhIntegrationService.sync();
  }
}

