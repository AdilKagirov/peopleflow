import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('PeopleFlow API (e2e)', () => {
  let app: INestApplication<App>;
  let candidateId: string | undefined;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('runs customer and security candidate approval workflow', async () => {
    const vacancies = await request(app.getHttpServer())
      .get('/api/vacancies')
      .expect(200);
    expect(vacancies.body.length).toBeGreaterThan(0);

    const candidate = await request(app.getHttpServer())
      .post('/api/candidates')
      .send({
        fullName: 'Approval E2E Candidate',
        email: `approval-e2e-${Date.now()}@example.com`,
        sourceCode: 'manual',
        consentPersonalData: true,
      })
      .expect(201);
    candidateId = candidate.body.id;

    let application = await request(app.getHttpServer())
      .post('/api/applications')
      .send({
        candidateId,
        vacancyId: vacancies.body[0].id,
        sourceCode: 'manual',
      })
      .expect(201);

    const deletedApplication = await request(app.getHttpServer())
      .delete(`/api/applications/${application.body.id}`)
      .expect(200);
    expect(deletedApplication.body).toEqual({
      deleted: true,
      applicationId: application.body.id,
    });

    application = await request(app.getHttpServer())
      .post('/api/applications')
      .send({
        candidateId,
        vacancyId: vacancies.body[0].id,
        sourceCode: 'manual',
      })
      .expect(201);

    const startsAt = new Date(Date.now() + 86_400_000).toISOString();
    const interview = await request(app.getHttpServer())
      .post('/api/interviews')
      .send({
        applicationId: application.body.id,
        interviewTypeCode: 'manager',
        startsAt,
        location: 'E2E meeting room',
      })
      .expect(201);
    expect(interview.body.applicationId).toBe(application.body.id);
    expect(interview.body.candidate.id).toBe(candidateId);

    const interviews = await request(app.getHttpServer())
      .get(`/api/interviews?applicationId=${application.body.id}`)
      .expect(200);
    expect(interviews.body).toHaveLength(1);
    expect(interviews.body[0].vacancy.id).toBe(vacancies.body[0].id);

    const customerApproval = await request(app.getHttpServer())
      .post(`/api/approvals/applications/${application.body.id}`)
      .send({ type: 'customer', comment: 'E2E customer review' })
      .expect(201);
    expect(customerApproval.body.status).toBe('pending');

    const customerDecision = await request(app.getHttpServer())
      .post(`/api/approvals/${customerApproval.body.id}/decision`)
      .send({ decision: 'approved', comment: 'Customer approved' })
      .expect(201);
    expect(customerDecision.body.currentStage.code).toBe('customer_interview');

    const securityApproval = await request(app.getHttpServer())
      .post(`/api/approvals/applications/${application.body.id}`)
      .send({ type: 'security', comment: 'E2E security check' })
      .expect(201);
    expect(securityApproval.body.status).toBe('pending');

    const securityDecision = await request(app.getHttpServer())
      .post(`/api/approvals/${securityApproval.body.id}/decision`)
      .send({ decision: 'approved', comment: 'Security approved' })
      .expect(201);
    expect(securityDecision.body.currentStage.code).toBe('recruiter_followup');

    await request(app.getHttpServer())
      .delete(`/api/applications/${application.body.id}`)
      .expect(409);

    const candidateWithApprovalHistory = await request(app.getHttpServer())
      .get(`/api/candidates/${candidateId}`)
      .expect(200);
    expect(candidateWithApprovalHistory.body.applicationsCount).toBe(1);
  });

  afterAll(async () => {
    if (candidateId) {
      await request(app.getHttpServer()).delete(`/api/candidates/${candidateId}`);
    }
    if (app) await app.close();
  });
});
