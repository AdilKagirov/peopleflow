import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getApiInfo() {
    return {
      name: 'KMF PeopleFlow API',
      version: '0.1.0',
      modules: [
        'vacancies',
        'candidates',
        'applications',
        'pipeline',
        'interviews',
        'communications',
        'reports',
      ],
    };
  }
}
