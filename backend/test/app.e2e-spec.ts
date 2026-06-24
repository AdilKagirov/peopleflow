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

    const application = await request(app.getHttpServer())
      .post('/api/applications')
      .send({
        candidateId,
        vacancyId: vacancies.body[0].id,
        sourceCode: 'manual',
      })
      .expect(201);

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

    const deletedApplication = await request(app.getHttpServer())
      .delete(`/api/applications/${application.body.id}`)
      .expect(200);
    expect(deletedApplication.body).toEqual({
      deleted: true,
      applicationId: application.body.id,
    });

    const candidateAfterUnlink = await request(app.getHttpServer())
      .get(`/api/candidates/${candidateId}`)
      .expect(200);
    expect(candidateAfterUnlink.body.applicationsCount).toBe(0);
  });

  afterAll(async () => {
    if (candidateId) {
      await request(app.getHttpServer()).delete(`/api/candidates/${candidateId}`);
    }
    await app.close();
  });
});
