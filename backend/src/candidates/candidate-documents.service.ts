import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { QueryResultRow } from 'pg';
import { unlink } from 'node:fs/promises';
import { DatabaseService } from '../database/database.service';
import { AccessScopeService } from '../access/access-scope.service';
import {
  CandidateDocumentType,
  candidateDocumentLabels,
  candidateDocumentTypes,
} from './document-types';

interface DocumentRow extends QueryResultRow {
  id: string;
  owner_id: string;
  document_type: CandidateDocumentType;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  file_size: string | null;
  uploaded_by: string | null;
  uploaded_by_name: string | null;
  uploaded_at: string;
}

@Injectable()
export class CandidateDocumentsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly accessScopeService: AccessScopeService,
  ) {}

  async findAll(candidateId: string, userId?: string) {
    await this.ensureCandidate(candidateId, userId);
    const result = await this.databaseService.query<DocumentRow>(
      `${this.baseQuery()}
       where a.owner_type = 'candidate' and a.owner_id = $1
         and a.document_type = any($2::text[])
       order by a.uploaded_at desc`,
      [candidateId, candidateDocumentTypes],
    );
    return result.rows.map((row) => this.mapDocument(row));
  }

  async create(
    candidateId: string,
    documentType: string,
    file: Express.Multer.File,
    uploadedBy?: string,
    userId?: string,
  ) {
    try {
      await this.ensureCandidate(candidateId, userId);
      if (!candidateDocumentTypes.includes(documentType as CandidateDocumentType)) {
        throw new BadRequestException('Unsupported candidate document type');
      }
      const result = await this.databaseService.query<{ id: string }>(
        `insert into attachments (
          owner_type, owner_id, document_type, file_name, file_path,
          mime_type, file_size, uploaded_by
        ) values ('candidate', $1, $2, $3, $4, $5, $6, $7)
        returning id`,
        [
          candidateId,
          documentType,
          file.originalname,
          file.path,
          file.mimetype,
          file.size,
          uploadedBy || null,
        ],
      );
      return this.findOne(candidateId, result.rows[0].id, userId);
    } catch (error) {
      await this.removeLocalFile(file.path);
      throw error;
    }
  }

  async findOne(candidateId: string, documentId: string, userId?: string) {
    await this.ensureCandidate(candidateId, userId);
    const result = await this.databaseService.query<DocumentRow>(
      `${this.baseQuery()}
       where a.id = $1 and a.owner_type = 'candidate' and a.owner_id = $2`,
      [documentId, candidateId],
    );
    if (!result.rows[0]) throw new NotFoundException('Candidate document not found');
    return this.mapDocument(result.rows[0]);
  }

  async getFile(candidateId: string, documentId: string, userId?: string) {
    await this.ensureCandidate(candidateId, userId);
    const result = await this.databaseService.query<DocumentRow>(
      `${this.baseQuery()}
       where a.id = $1 and a.owner_type = 'candidate' and a.owner_id = $2`,
      [documentId, candidateId],
    );
    if (!result.rows[0]) throw new NotFoundException('Candidate document not found');
    return result.rows[0];
  }

  async remove(candidateId: string, documentId: string, userId?: string) {
    const document = await this.getFile(candidateId, documentId, userId);
    await this.databaseService.query('delete from attachments where id = $1', [documentId]);
    await this.removeLocalFile(document.file_path);
    return { deleted: true, documentId };
  }

  private async ensureCandidate(candidateId: string, userId?: string) {
    const result = await this.databaseService.query<{ branch_id: string | null }>(
      'select branch_id from candidates where id = $1',
      [candidateId],
    );
    if (!result.rowCount) throw new NotFoundException('Candidate not found');
    const scope = await this.accessScopeService.getScope(userId);
    if (scope.allBranches || (result.rows[0].branch_id && scope.branchIds.includes(result.rows[0].branch_id))) return;
    const application = await this.databaseService.query(
      `select 1 from applications a join vacancies v on v.id = a.vacancy_id
       where a.candidate_id = $1 and v.branch_id = any($2::uuid[]) limit 1`,
      [candidateId, scope.branchIds],
    );
    if (!application.rowCount) {
      await this.accessScopeService.assertBranchAccess(userId, result.rows[0].branch_id);
    }
  }

  private async removeLocalFile(filePath: string) {
    try {
      await unlink(filePath);
    } catch {
      // A missing local file should not keep stale metadata in the profile.
    }
  }

  private baseQuery() {
    return `select
      a.id, a.owner_id, a.document_type, a.file_name, a.file_path,
      a.mime_type, a.file_size, a.uploaded_by, u.full_name as uploaded_by_name,
      a.uploaded_at
    from attachments a
    left join users u on u.id = a.uploaded_by`;
  }

  private mapDocument(row: DocumentRow) {
    return {
      id: row.id,
      candidateId: row.owner_id,
      type: row.document_type,
      typeName: candidateDocumentLabels[row.document_type],
      fileName: row.file_name,
      mimeType: row.mime_type,
      fileSize: row.file_size ? Number(row.file_size) : null,
      uploadedBy: row.uploaded_by
        ? { id: row.uploaded_by, name: row.uploaded_by_name }
        : null,
      uploadedAt: row.uploaded_at,
      downloadUrl: `/api/candidates/${row.owner_id}/documents/${row.id}/download`,
    };
  }
}
