import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';

// Crear instancia de Express que Vercel utilizará
const server = express();

// Bootstrap de la aplicación NestJS
async function bootstrap() {
  // Crear aplicación NestJS usando el adaptador de Express
  const app = await NestFactory.create(
    AppModule, 
    new ExpressAdapter(server)
  );
  
  // Habilitar CORS
  app.enableCors();
  
  // Configurar validación global
  app.useGlobalPipes(
    new ValidationPipe({ 
      whitelist: true, 
      forbidNonWhitelisted: true 
    })
  );
  
  // Inicializar la aplicación (sin listen)
  await app.init();
}

// Ejecutar el bootstrap inmediatamente
bootstrap();

// Exportar el servidor Express para que Vercel lo use
export default server;
