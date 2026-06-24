import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
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
    @Headers('x-peopleflow-user-id') userId?: string,
  ) {
    return this.applicationsService.findAll({
      vacancyId,
      candidateId,
      stage,
      status,
      userId,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Headers('x-peopleflow-user-id') userId?: string) {
    return this.applicationsService.findOne(id, userId);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string, @Headers('x-peopleflow-user-id') userId?: string) {
    return this.applicationsService.getHistory(id, userId);
  }

  @Post()
  create(@Body() dto: CreateApplicationDto, @Headers('x-peopleflow-user-id') userId?: string) {
    return this.applicationsService.create(dto, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateApplicationDto, @Headers('x-peopleflow-user-id') userId?: string) {
    return this.applicationsService.update(id, dto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Headers('x-peopleflow-user-id') userId?: string) {
    return this.applicationsService.remove(id, userId);
  }

  @Post(':id/move')
  move(@Param('id') id: string, @Body() dto: MoveApplicationDto, @Headers('x-peopleflow-user-id') userId?: string) {
    return this.applicationsService.move(id, dto, userId);
  }
}
