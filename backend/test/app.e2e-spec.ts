import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DatabaseService } from './../src/database/database.service';

describe('PeopleFlow API (e2e)', () => {
  let app: INestApplication<App>;
  let candidateId: string | undefined;
  let branchCandidateId: string | undefined;
  let websoftVacancyId: string | undefined;
  let managedUserId: string | undefined;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    databaseService = moduleFixture.get(DatabaseService);
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('authenticates active users with local credentials', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin.peopleflow@kmf.kz',
        password: 'PeopleFlow2026!',
      })
      .expect(201);

    expect(login.body.user.email).toBe('admin.peopleflow@kmf.kz');
    expect(login.body.user.role.code).toBe('admin');

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin.peopleflow@kmf.kz',
        password: 'wrong-password',
      })
      .expect(401);
  });

  it('isolates branch data and imports approved Websoft vacancies idempotently', async () => {
    const reference = await request(app.getHttpServer()).get('/api/reference').expect(200);
    const astana = reference.body.branches.find((item: { code: string }) => item.code === 'AST');
    const almaty = reference.body.branches.find((item: { code: string }) => item.code === 'ALA');
    const astanaRecruiter = reference.body.users.find(
      (item: { branch?: { code: string }; role?: { code: string } }) =>
        item.branch?.code === 'AST' && item.role?.code === 'recruiter',
    );
    const almatyRecruiter = reference.body.users.find(
      (item: { branch?: { code: string }; role?: { code: string } }) =>
        item.branch?.code === 'ALA' && item.role?.code === 'recruiter',
    );
    const headOfficeRecruiter = reference.body.users.find(
      (item: { accessAllBranches: boolean; role?: { code: string } }) =>
        item.accessAllBranches && item.role?.code === 'recruiter',
    );
    expect(astanaRecruiter).toBeDefined();
    expect(almatyRecruiter).toBeDefined();
    expect(headOfficeRecruiter).toBeDefined();
    const administrator = reference.body.users.find(
      (item: { role?: { code: string } }) => item.role?.code === 'admin',
    );
    expect(administrator).toBeDefined();

    const managedUser = await request(app.getHttpServer())
      .post('/api/users')
      .set('X-PeopleFlow-User-Id', administrator.id)
      .send({
        fullName: 'E2E Branch Recruiter',
        email: `e2e.branch.recruiter.${Date.now()}@kmf.kz`,
        password: 'PeopleFlow2026!',
        roleCode: 'recruiter',
        branchIds: [astana.id, almaty.id],
        primaryBranchId: astana.id,
        accessAllBranches: false,
      })
      .expect(201);
    managedUserId = managedUser.body.id;
    expect(managedUser.body.branches).toHaveLength(2);
    expect(managedUser.body.primaryBranch.code).toBe('AST');

    await request(app.getHttpServer())
      .post('/api/users')
      .set('X-PeopleFlow-User-Id', astanaRecruiter.id)
      .send({
        fullName: 'Forbidden User',
        email: `forbidden.${Date.now()}@kmf.kz`,
        roleCode: 'recruiter',
      })
      .expect(403);

    const externalRequestId = `WS-E2E-${Date.now()}`;
    const payload = {
      externalRequestId,
      approvalStatus: 'approved',
      branchCode: 'AST',
      title: 'Websoft E2E Vacancy',
      position: 'E2E Specialist',
      departmentName: 'E2E Department',
      description: 'Approved request from Websoft',
      requirements: 'E2E requirements',
      workingConditions: 'E2E conditions',
    };
    const imported = await request(app.getHttpServer())
      .post('/api/integrations/websoft/vacancies')
      .send(payload)
      .expect(201);
    websoftVacancyId = imported.body.vacancyId;
    expect(imported.body.assignmentStatus).toBe('assigned');

    const repeated = await request(app.getHttpServer())
      .post('/api/integrations/websoft/vacancies')
      .send({ ...payload, description: 'Updated Websoft request' })
      .expect(201);
    expect(repeated.body.vacancyId).toBe(websoftVacancyId);
    expect(repeated.body.created).toBe(false);

    const astanaVacancies = await request(app.getHttpServer())
      .get('/api/vacancies')
      .set('X-PeopleFlow-User-Id', astanaRecruiter.id)
      .expect(200);
    expect(astanaVacancies.body.some((item: { id: string }) => item.id === websoftVacancyId)).toBe(true);

    await request(app.getHttpServer())
      .get(`/api/vacancies/${websoftVacancyId}`)
      .set('X-PeopleFlow-User-Id', almatyRecruiter.id)
      .expect(403);

    const headOfficeVacancies = await request(app.getHttpServer())
      .get('/api/vacancies')
      .set('X-PeopleFlow-User-Id', headOfficeRecruiter.id)
      .expect(200);
    expect(headOfficeVacancies.body.some((item: { id: string }) => item.id === websoftVacancyId)).toBe(true);

    const branchCandidate = await request(app.getHttpServer())
      .post('/api/candidates')
      .set('X-PeopleFlow-User-Id', astanaRecruiter.id)
      .send({ fullName: 'Astana Scoped Candidate', branchId: astana.id, sourceCode: 'manual' })
      .expect(201);
    branchCandidateId = branchCandidate.body.id;

    await request(app.getHttpServer())
      .get(`/api/candidates/${branchCandidateId}`)
      .set('X-PeopleFlow-User-Id', almatyRecruiter.id)
      .expect(403);
    expect(almaty.id).toBeDefined();
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

    await request(app.getHttpServer())
      .post(`/api/approvals/applications/${application.body.id}`)
      .send({ type: 'customer', comment: 'Missing resume' })
      .expect(400);

    await request(app.getHttpServer())
      .post(`/api/candidates/${candidateId}/documents`)
      .field('documentType', 'resume')
      .attach('file', Buffer.from('E2E resume'), {
        filename: 'resume.pdf',
        contentType: 'application/pdf',
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

    await request(app.getHttpServer())
      .post(`/api/approvals/applications/${application.body.id}`)
      .send({ type: 'security', comment: 'Missing security documents' })
      .expect(400);

    for (const documentType of [
      'candidate_questionnaire',
      'security_questionnaire',
      'credit_bureau_report',
    ]) {
      await request(app.getHttpServer())
        .post(`/api/candidates/${candidateId}/documents`)
        .field('documentType', documentType)
        .attach('file', Buffer.from(`E2E ${documentType}`), {
          filename: `${documentType}.pdf`,
          contentType: 'application/pdf',
        })
        .expect(201);
    }

    const documents = await request(app.getHttpServer())
      .get(`/api/candidates/${candidateId}/documents`)
      .expect(200);
    expect(documents.body).toHaveLength(4);

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
    if (branchCandidateId) {
      await request(app.getHttpServer()).delete(`/api/candidates/${branchCandidateId}`);
    }
    if (websoftVacancyId) {
      await databaseService.query('delete from vacancies where id = $1', [websoftVacancyId]);
    }
    if (managedUserId) {
      await databaseService.query('delete from users where id = $1', [managedUserId]);
    }
    if (app) await app.close();
  });
});
