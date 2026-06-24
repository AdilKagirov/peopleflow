import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { ApprovalDecisionDto } from './dto/approval-decision.dto';
import { RequestApprovalDto } from './dto/request-approval.dto';
import { ApprovalsService } from './approvals.service';

@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('assignedRole') assignedRole?: string,
    @Query('applicationId') applicationId?: string,
    @Headers('x-peopleflow-user-id') userId?: string,
  ) {
    return this.approvalsService.findAll({ status, type, assignedRole, applicationId, userId });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Headers('x-peopleflow-user-id') userId?: string) {
    return this.approvalsService.findOne(id, userId);
  }

  @Post('applications/:applicationId')
  request(
    @Param('applicationId') applicationId: string,
    @Body() dto: RequestApprovalDto,
    @Headers('x-peopleflow-user-id') userId?: string,
  ) {
    return this.approvalsService.request(applicationId, dto, userId);
  }

  @Post(':id/decision')
  decide(@Param('id') id: string, @Body() dto: ApprovalDecisionDto, @Headers('x-peopleflow-user-id') userId?: string) {
    return this.approvalsService.decide(id, dto, userId);
  }
}
