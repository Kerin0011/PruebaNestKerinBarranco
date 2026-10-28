import { jest } from '@jest/globals';
import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { AllExceptionsFilter } from './all-exceptions.filter.js';

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  const createMockHost = (url: string = '/api/test') => {
    const json = jest.fn<(...args: any[]) => any>();
    const status = jest.fn<(...args: any[]) => any>().mockReturnValue({ json });
    const response = { status };
    const request = { url };

    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    } as unknown as ArgumentsHost;

    return { host, status, json };
  };

  it('formatea correctamente una HttpException con estructura unificada', () => {
    const { host, status, json } = createMockHost('/api/vehicles');
    const exception = new HttpException('Vehículo no encontrado', HttpStatus.NOT_FOUND);

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Vehículo no encontrado',
        path: '/api/vehicles',
      }),
    );
  });

  it('traduce error de llave duplicada PostgreSQL (código 23505) a 409 Conflict', () => {
    const { host, status, json } = createMockHost('/api/vehicles');
    const driverError = Object.assign(new Error('Query failed'), { code: '23505' });
    const queryError = new QueryFailedError('INSERT INTO vehicles', [], driverError);

    filter.catch(queryError, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.CONFLICT,
        message: 'El registro ya existe',
      }),
    );
  });

  it('traduce error de clave foránea inexistente (código 23503) a 400 Bad Request', () => {
    const { host, status, json } = createMockHost('/api/maintenances');
    const driverError = Object.assign(new Error('Query failed'), { code: '23503' });
    const queryError = new QueryFailedError('INSERT INTO maintenances', [], driverError);

    filter.catch(queryError, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Se referencia un registro que no existe',
      }),
    );
  });
});
