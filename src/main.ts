import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Increase request timeout to 60 minutes (3600000 ms)
    bodyParser: true,
  });

  // Set server timeout to 60 minutes
  app.use((req, res, next) => {
    req.setTimeout(3600000); // 60 minutes in milliseconds
    res.setTimeout(3600000); // 60 minutes in milliseconds
    next();
  });

  // Cấu hình CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'https://front-ecru-gamma.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Total-Count'],
    credentials: true,
  });

  // Cấu hình Swagger
  const config = new DocumentBuilder()
    .setTitle('UTEShop API')
    .setDescription('API cho backend UTEShop')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3001);
  console.log(`🚀 Server running on http://localhost:${process.env.PORT ?? 3001}`);
}
bootstrap();
