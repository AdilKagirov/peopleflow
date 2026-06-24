import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccessScopeModule } from './access/access-scope.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApplicationsModule } from './applications/applications.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { CandidatesModule } from './candidates/candidates.module';
import { DatabaseModule } from './database/database.module';
import { HhIntegrationModule } from './integrations/hh/hh-integration.module';
import { WebsoftIntegrationModule } from './integrations/websoft/websoft-integration.module';
import { ImportsModule } from './imports/imports.module';
import { InterviewsModule } from './interviews/interviews.module';
import { ReferenceModule } from './reference/reference.module';
import { VacanciesModule } from './vacancies/vacancies.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AccessScopeModule,
    DatabaseModule,
    VacanciesModule,
    CandidatesModule,
    ApplicationsModule,
    ApprovalsModule,
    ReferenceModule,
    ImportsModule,
    InterviewsModule,
    HhIntegrationModule,
    WebsoftIntegrationModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
