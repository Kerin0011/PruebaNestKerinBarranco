import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Error interno del servidor';

    // 1. Procesamiento de excepciones HTTP estándar de NestJS
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      message =
        typeof body === 'string'
          ? body
          : ((body as { message?: string | string[] }).message ?? exception.message);
    // 2. Mapeo de errores de base de datos PostgreSQL para no generar códigos 500
    } else if (exception instanceof QueryFailedError) {
      const code = (exception.driverError as { code?: string })?.code;
      if (code === '23505') {
        status = HttpStatus.CONFLICT;
        message = 'El registro ya existe';
      } else if (code === '23503') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Se referencia un registro que no existe';
      }
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) this.logger.error(exception);

    // 3. Estructura uniforme de respuesta de error requerida por la API
    res.status(status).json({
      success: false,
      statusCode: status,
      message,
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }
}
