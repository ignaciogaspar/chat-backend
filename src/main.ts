import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';

  async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    
    // Habilitar CORS para permitir requests desde el frontend
    app.enableCors({
      origin: ['http://localhost:3000'],
      credentials: true,
    });
    
    // Configurar validación global
    app.useGlobalPipes(
      new ValidationPipe({ 
        whitelist: true, 
        forbidNonWhitelisted: true 
      })
    );
    
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`Server running on port ${port}`);
  }
  
  bootstrap();
