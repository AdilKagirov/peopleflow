import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { mkdirSync } from 'node:fs';
import { extname } from 'node:path';
import { ImportsService } from './imports.service';

const uploadDir = process.env.FILES_DIR || './storage';

@Controller('imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post('resumes')
  @UseInterceptors(
    FileInterceptor('resume', {
      storage: diskStorage({
        destination: (_request, _file, callback) => {
          const destination = `${uploadDir}/resumes`;
          mkdirSync(destination, { recursive: true });
          callback(null, destination);
        },
        filename: (_request, file, callback) => {
          const safeOriginal = Buffer.from(file.originalname, 'latin1')
            .toString('utf8')
            .replace(/[^\p{L}\p{N}._-]+/gu, '_');
          callback(null, `${Date.now()}-${safeOriginal}`);
        },
      }),
      limits: { fileSize: 15 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        const allowed = ['.pdf', '.doc', '.docx', '.txt'];
        const extension = extname(file.originalname).toLowerCase();
        callback(null, allowed.includes(extension));
      },
    }),
  )
  importResume(
    @UploadedFile() file: Express.Multer.File,
    @Body('vacancyId') vacancyId?: string,
    @Headers('x-peopleflow-user-id') userId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Resume file is required');
    }

    return this.importsService.importResumeFile(file, { vacancyId, userId });
  }
}
