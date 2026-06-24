import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CandidateDocumentsController } from './candidate-documents.controller';
import { CandidateDocumentsService } from './candidate-documents.service';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CandidatesController, CandidateDocumentsController],
  providers: [CandidatesService, CandidateDocumentsService],
})
export class CandidatesModule {}
