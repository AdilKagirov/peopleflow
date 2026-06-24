import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateVacancyDto } from './dto/create-vacancy.dto';
import { UpdateVacancyDto } from './dto/update-vacancy.dto';
import { VacanciesService } from './vacancies.service';

@Controller('vacancies')
export class VacanciesController {
  constructor(private readonly vacanciesService: VacanciesService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('branchId') branchId?: string,
    @Headers('x-peopleflow-user-id') userId?: string,
  ) {
    return this.vacanciesService.findAll({ status, search, branchId, userId });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Headers('x-peopleflow-user-id') userId?: string) {
    return this.vacanciesService.findOne(id, userId);
  }

  @Post()
  create(@Body() dto: CreateVacancyDto, @Headers('x-peopleflow-user-id') userId?: string) {
    return this.vacanciesService.create(dto, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVacancyDto, @Headers('x-peopleflow-user-id') userId?: string) {
    return this.vacanciesService.update(id, dto, userId);
  }
}
