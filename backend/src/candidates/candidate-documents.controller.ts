import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { diskStorage } from 'multer';
import { createReadStream, mkdirSync } from 'node:fs';
import { extname } from 'node:path';
import { CandidateDocumentsService } from './candidate-documents.service';

const uploadDir = process.env.FILES_DIR || './storage';

@Controller('candidates/:candidateId/documents')
export class CandidateDocumentsController {
  constructor(private readonly documentsService: CandidateDocumentsService) {}

  @Get()
  findAll(@Param('candidateId') candidateId: string, @Headers('x-peopleflow-user-id') userId?: string) {
    return this.documentsService.findAll(candidateId, userId);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_request, _file, callback) => {
          const destination = `${uploadDir}/candidate-documents`;
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
      limits: { fileSize: 25 * 1024 * 1024, fields: 10 },
      fileFilter: (_request, file, callback) => {
        const allowed = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'];
        callback(null, allowed.includes(extname(file.originalname).toLowerCase()));
      },
    }),
  )
  create(
    @Param('candidateId') candidateId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: string,
    @Body('uploadedBy') uploadedBy?: string,
    @Headers('x-peopleflow-user-id') userId?: string,
  ) {
    if (!file) throw new BadRequestException('Document file is required');
    return this.documentsService.create(candidateId, documentType, file, uploadedBy, userId);
  }

  @Get(':documentId/download')
  async download(
    @Param('candidateId') candidateId: string,
    @Param('documentId') documentId: string,
    @Res({ passthrough: true }) response: Response,
    @Headers('x-peopleflow-user-id') userId?: string,
  ) {
    const document = await this.documentsService.getFile(candidateId, documentId, userId);
    response.setHeader('Content-Type', document.mime_type || 'application/octet-stream');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(document.file_name)}`,
    );
    return new StreamableFile(createReadStream(document.file_path));
  }

  @Delete(':documentId')
  remove(
    @Param('candidateId') candidateId: string,
    @Param('documentId') documentId: string,
    @Headers('x-peopleflow-user-id') userId?: string,
  ) {
    return this.documentsService.remove(candidateId, documentId, userId);
  }
}
