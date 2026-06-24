import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { InterviewsService } from './interviews.service';

@Controller('interviews')
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Get()
  findAll(
    @Query('applicationId') applicationId?: string,
    @Query('status') status?: string,
  ) {
    return this.interviewsService.findAll({ applicationId, status });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.interviewsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateInterviewDto) {
    return this.interviewsService.create(dto);
  }
}

