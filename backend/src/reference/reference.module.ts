import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ReferenceController } from './reference.controller';
import { ReferenceService } from './reference.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ReferenceController],
  providers: [ReferenceService],
})
export class ReferenceModule {}

