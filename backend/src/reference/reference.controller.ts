import { Controller, Get } from '@nestjs/common';
import { ReferenceService } from './reference.service';

@Controller('reference')
export class ReferenceController {
  constructor(private readonly referenceService: ReferenceService) {}

  @Get()
  getAll() {
    return this.referenceService.getAll();
  }

  @Get('pipeline-stages')
  getPipelineStages() {
    return this.referenceService.getPipelineStages();
  }

  @Get('vacancy-statuses')
  getVacancyStatuses() {
    return this.referenceService.getVacancyStatuses();
  }

  @Get('application-statuses')
  getApplicationStatuses() {
    return this.referenceService.getApplicationStatuses();
  }

  @Get('sources')
  getSources() {
    return this.referenceService.getSources();
  }

  @Get('employment-types')
  getEmploymentTypes() {
    return this.referenceService.getEmploymentTypes();
  }

  @Get('departments')
  getDepartments() {
    return this.referenceService.getDepartments();
  }

  @Get('users')
  getUsers() {
    return this.referenceService.getUsers();
  }

  @Get('branches')
  getBranches() {
    return this.referenceService.getBranches();
  }

  @Get('roles')
  getRoles() {
    return this.referenceService.getRoles();
  }
}
