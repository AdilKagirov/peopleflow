import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseService } from './database/database.service';

describe('AppController', () => {
  let appController: AppController;
  const databaseService = {
    health: jest.fn().mockResolvedValue({ ok: true, database: 'kmf_peopleflow' }),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, { provide: DatabaseService, useValue: databaseService }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API metadata', () => {
      expect(appController.getApiInfo()).toMatchObject({
        name: 'KMF PeopleFlow API',
        version: '0.1.0',
      });
    });
  });
});
