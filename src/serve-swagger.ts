import fs from 'node:fs';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { AppModule } from './app.module.js';
import { configureApp, setupSwagger } from './app.setup.js';
import { SeedService } from './database/seed.service.js';

async function bootstrap() {
  const logger = new Logger('SwaggerServer');

  const mockDataSource = {
    isInitialized: true,
    options: { type: 'postgres' },
    entityMetadatas: [],
    getRepository: () => ({
      metadata: { columns: [], relations: [] },
      findOne: () => Promise.resolve(null),
      find: () => Promise.resolve([]),
      save: (x: unknown) => Promise.resolve(x),
    }),
    destroy: () => Promise.resolve(),
  };

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(getDataSourceToken())
    .useValue(mockDataSource)
    .overrideProvider(SeedService)
    .useValue({ onApplicationBootstrap: () => {} })
    .compile();

  const app = moduleRef.createNestApplication();
  configureApp(app);
  setupSwagger(app);

  // Generar y guardar la especificación OpenAPI (Swagger JSON)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('FleetCore API — Gestión de Mantenimiento de Flota')
    .setDescription(
      'API REST para la gestión del ciclo de vida de mantenimientos, vehículos, mecánicos y talleres de FleetCore.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  fs.writeFileSync('swagger.json', JSON.stringify(document, null, 2), 'utf-8');

  await app.listen(3000);

  logger.log('===============================================================');
  logger.log('🚀 Swagger UI activo y disponible en: http://localhost:3000/docs');
  logger.log('📄 Especificación OpenAPI exportada en: ./swagger.json');
  logger.log('===============================================================');
}

bootstrap();
