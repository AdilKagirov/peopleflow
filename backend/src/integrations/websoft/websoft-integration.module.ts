import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { WebsoftIntegrationController } from './websoft-integration.controller';
import { WebsoftIntegrationService } from './websoft-integration.service';

@Module({
  imports: [DatabaseModule],
  controllers: [WebsoftIntegrationController],
  providers: [WebsoftIntegrationService],
})
export class WebsoftIntegrationModule {}

