import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('source') source?: string,
    @Query('branchId') branchId?: string,
    @Headers('x-peopleflow-user-id') userId?: string,
  ) {
    return this.candidatesService.findAll({ search, source, branchId, userId });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Headers('x-peopleflow-user-id') userId?: string) {
    return this.candidatesService.findOne(id, userId);
  }

  @Post()
  create(@Body() dto: CreateCandidateDto, @Headers('x-peopleflow-user-id') userId?: string) {
    return this.candidatesService.create(dto, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCandidateDto, @Headers('x-peopleflow-user-id') userId?: string) {
    return this.candidatesService.update(id, dto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Headers('x-peopleflow-user-id') userId?: string) {
    return this.candidatesService.remove(id, userId);
  }
}
