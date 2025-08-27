import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global prefix
  app.setGlobalPrefix('api');
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Cấu hình Swagger
  const config = new DocumentBuilder()
    .setTitle('UTEShop API')
    .setDescription('API cho backend UTEShop')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  
  await app.listen(process.env.PORT ?? 5000);
  
  console.log(`🚀 Application is running on: http://localhost:${process.env.PORT ?? 5000}`);
  console.log(`📚 Swagger documentation: http://localhost:${process.env.PORT ?? 5000}/docs`);
}
bootstrap();
