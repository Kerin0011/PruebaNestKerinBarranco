import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { Env } from '../../config/env.schema.js';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService<Env, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKeyHeader = request.headers['x-api-key'];

    const configuredApiKey = this.config.get('API_KEY', { infer: true });

    if (!apiKeyHeader || apiKeyHeader !== configuredApiKey) {
      throw new UnauthorizedException('API Key inválida o no proporcionada en la cabecera x-api-key');
    }

    return true;
  }
}
