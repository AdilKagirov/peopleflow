import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { MoveApplicationDto } from './dto/move-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  findAll(
    @Query('vacancyId') vacancyId?: string,
    @Query('candidateId') candidateId?: string,
    @Query('stage') stage?: string,
    @Query('status') status?: string,
  ) {
    return this.applicationsService.findAll({
      vacancyId,
      candidateId,
      stage,
      status,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.applicationsService.findOne(id);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string) {
    return this.applicationsService.getHistory(id);
  }

  @Post()
  create(@Body() dto: CreateApplicationDto) {
    return this.applicationsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateApplicationDto) {
    return this.applicationsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.applicationsService.remove(id);
  }

  @Post(':id/move')
  move(@Param('id') id: string, @Body() dto: MoveApplicationDto) {
    return this.applicationsService.move(id, dto);
  }
}
