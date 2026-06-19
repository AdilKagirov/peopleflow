import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HhIntegrationController } from './hh-integration.controller';
import { HhIntegrationService } from './hh-integration.service';

@Module({
  imports: [ConfigModule],
  controllers: [HhIntegrationController],
  providers: [HhIntegrationService],
})
export class HhIntegrationModule {}

