import { Injectable } from '@nestjs/common';
import { QueryResultRow } from 'pg';
import { readFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { DatabaseService } from '../database/database.service';

interface ImportOptions {
  vacancyId?: string;
}

interface CandidateRecord extends QueryResultRow {
  id: string;
}

@Injectable()
export class ImportsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async importResumeFile(file: Express.Multer.File, options: ImportOptions) {
    const rawText = await this.extractText(file);
    const parsed = this.parseResume(rawText, file.originalname);
    const sourceId = await this.ensureSource('file_import', 'Импорт файла');
    const candidateId = await this.upsertCandidate(parsed, sourceId);
    const attachmentId = await this.createAttachment(file, candidateId);
    const resumeId = await this.createResume(candidateId, attachmentId, rawText, parsed);
    const applicationId = options.vacancyId
      ? await this.createApplication(candidateId, options.vacancyId, sourceId)
      : null;

    return {
      candidateId,
      attachmentId,
      resumeId,
      applicationId,
      parsed,
    };
  }

  private async extractText(file: Express.Multer.File) {
    if (extname(file.originalname).toLowerCase() !== '.txt') {
      return '';
    }

    return readFile(file.path, 'utf8');
  }

  private parseResume(rawText: string, fileName: string) {
    const lines = rawText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const email = rawText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || null;
    const phone =
      rawText.match(/(?:\+?\d[\s()-]*){10,}/)?.[0]?.replace(/\s+/g, ' ').trim() || null;
    const skillsLine = lines.find((line) => /skills|навыки/i.test(line));
    const fallbackName = basename(fileName, extname(fileName)).replace(/[_-]+/g, ' ');

    return {
      fullName: lines[0] && !lines[0].includes('@') ? lines[0] : fallbackName,
      email,
      phone,
      skills: skillsLine?.replace(/skills|навыки|:/gi, '').trim() || null,
      parserStatus: rawText ? 'parsed_text' : 'file_saved',
    };
  }

  private async ensureSource(code: string, name: string) {
    const result = await this.databaseService.query<{ id: string }>(
      `insert into sources (code, name, is_external)
       values ($1, $2, false)
       on conflict (code) do update set name = excluded.name
       returning id`,
      [code, name],
    );

    return result.rows[0].id;
  }

  private async upsertCandidate(
    parsed: {
      fullName: string;
      email: string | null;
      phone: string | null;
      skills: string | null;
    },
    sourceId: string,
  ) {
    if (parsed.email) {
      const existing = await this.databaseService.query<CandidateRecord>(
        'select id from candidates where lower(email) = lower($1)',
        [parsed.email],
      );

      if (existing.rows[0]) {
        await this.databaseService.query(
          `update candidates
           set full_name = coalesce(nullif($2, ''), full_name),
               phone = coalesce($3, phone),
               skills = coalesce($4, skills),
               source_id = coalesce(source_id, $5),
               updated_at = now()
           where id = $1`,
          [existing.rows[0].id, parsed.fullName, parsed.phone, parsed.skills, sourceId],
        );
        return existing.rows[0].id;
      }
    }

    const created = await this.databaseService.query<CandidateRecord>(
      `insert into candidates (
        full_name, email, phone, skills, source_id, consent_personal_data
      )
      values ($1, $2, $3, $4, $5, true)
      returning id`,
      [parsed.fullName, parsed.email, parsed.phone, parsed.skills, sourceId],
    );

    return created.rows[0].id;
  }

  private async createAttachment(file: Express.Multer.File, candidateId: string) {
    const result = await this.databaseService.query<{ id: string }>(
      `insert into attachments (
        owner_type, owner_id, file_name, file_path, mime_type, file_size
      )
      values ('candidate', $1, $2, $3, $4, $5)
      returning id`,
      [candidateId, file.originalname, file.path, file.mimetype, file.size],
    );

    return result.rows[0].id;
  }

  private async createResume(
    candidateId: string,
    attachmentId: string,
    rawText: string,
    parsed: Record<string, unknown>,
  ) {
    const result = await this.databaseService.query<{ id: string }>(
      `insert into resumes (candidate_id, attachment_id, raw_text, parsed_data, parser_status)
       values ($1, $2, $3, $4, $5)
       returning id`,
      [candidateId, attachmentId, rawText, JSON.stringify(parsed), parsed.parserStatus],
    );

    return result.rows[0].id;
  }

  private async createApplication(candidateId: string, vacancyId: string, sourceId: string) {
    const statusId = await this.lookupId('application_statuses', 'active');
    const stageId = await this.lookupPipelineStageId('resume_review');
    const result = await this.databaseService.query<{ id: string }>(
      `insert into applications (
        vacancy_id, candidate_id, status_id, current_stage_id, source_id, summary
      )
      values ($1, $2, $3, $4, $5, 'Создано при импорте резюме')
      on conflict (vacancy_id, candidate_id) do update
        set source_id = excluded.source_id, updated_at = now()
      returning id`,
      [vacancyId, candidateId, statusId, stageId, sourceId],
    );

    return result.rows[0].id;
  }

  private async lookupId(table: string, code: string) {
    const result = await this.databaseService.query<{ id: string }>(
      `select id from ${table} where code = $1`,
      [code],
    );
    return result.rows[0].id;
  }

  private async lookupPipelineStageId(code: string) {
    const result = await this.databaseService.query<{ id: string }>(
      `select ps.id
       from pipeline_stages ps
       join pipeline_templates pt on pt.id = ps.template_id
       where ps.code = $1
       order by pt.is_default desc, ps.sort_order
       limit 1`,
      [code],
    );
    return result.rows[0].id;
  }
}

