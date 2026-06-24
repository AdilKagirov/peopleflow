import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApplicationsModule } from './applications/applications.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { CandidatesModule } from './candidates/candidates.module';
import { DatabaseModule } from './database/database.module';
import { HhIntegrationModule } from './integrations/hh/hh-integration.module';
import { ImportsModule } from './imports/imports.module';
import { ReferenceModule } from './reference/reference.module';
import { VacanciesModule } from './vacancies/vacancies.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    VacanciesModule,
    CandidatesModule,
    ApplicationsModule,
    ApprovalsModule,
    ReferenceModule,
    ImportsModule,
    HhIntegrationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
