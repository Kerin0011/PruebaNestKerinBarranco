import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { SeedService } from './seed.service.js';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const logger = new Logger('SeedCLI');

  try {
    const seedService = app.get(SeedService);
    await seedService.runSeed();
    logger.log('Seed ejecutado con éxito desde línea de comandos');
  } catch (error) {
    logger.error('Error ejecutando el seed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

await bootstrap();
