import { Body, Controller, Get, Post } from '@nestjs/common';
import { WebsoftVacancyDto } from './dto/websoft-vacancy.dto';
import { WebsoftIntegrationService } from './websoft-integration.service';

@Controller('integrations/websoft')
export class WebsoftIntegrationController {
  constructor(private readonly websoftService: WebsoftIntegrationService) {}

  @Get('status')
  getStatus() {
    return this.websoftService.getStatus();
  }

  @Post('vacancies')
  importVacancy(@Body() dto: WebsoftVacancyDto) {
    return this.websoftService.importApprovedVacancy(dto);
  }
}

