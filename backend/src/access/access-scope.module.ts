import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AccessScopeService } from './access-scope.service';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [AccessScopeService],
  exports: [AccessScopeService],
})
export class AccessScopeModule {}

