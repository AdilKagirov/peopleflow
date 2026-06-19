import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HhIntegrationService {
  constructor(private readonly configService: ConfigService) {}

  getStatus() {
    const clientId = this.configService.get<string>('HH_CLIENT_ID');
    const clientSecret = this.configService.get<string>('HH_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('HH_REDIRECT_URI');

    return {
      provider: 'hh.kz / HeadHunter',
      configured: Boolean(clientId && clientSecret && redirectUri),
      hasClientId: Boolean(clientId),
      hasClientSecret: Boolean(clientSecret),
      redirectUri: redirectUri || null,
      mode: 'oauth_required',
    };
  }

  getConnectUrl() {
    const clientId = this.configService.get<string>('HH_CLIENT_ID');
    const redirectUri = this.configService.get<string>('HH_REDIRECT_URI');

    if (!clientId || !redirectUri) {
      return {
        configured: false,
        message: 'Set HH_CLIENT_ID and HH_REDIRECT_URI before connecting hh.kz.',
      };
    }

    const url = new URL('https://hh.ru/oauth/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);

    return {
      configured: true,
      url: url.toString(),
    };
  }

  sync() {
    return {
      status: 'not_configured',
      message:
        'HH sync requires OAuth tokens. Next step: add token storage and call HeadHunter negotiations/resume APIs.',
    };
  }
}

