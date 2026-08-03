import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://properly.ge',
  'https://www.properly.ge',
  'https://*.vercel.app',
];

/**
 * Development origins that stay allowed on top of `CORS_ORIGINS`, so a frontend
 * served from localhost or a machine on the LAN can talk to any deployment.
 */
const LOCAL_ORIGIN_MATCHERS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https?:\/\/\[::1\](:\d+)?$/,
  /^https?:\/\/10(\.\d{1,3}){3}(:\d+)?$/,
  /^https?:\/\/192\.168(\.\d{1,3}){2}(:\d+)?$/,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])(\.\d{1,3}){2}(:\d+)?$/,
];

function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Real Estate Investment API')
    .setDescription(
      'API for companies, projects, image uploads and get-in-touch leads. ' +
        'Protected endpoints require a Bearer token from POST /auth/login.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
}

/** Turns an origin entry into a matcher, where `*` stands for one hostname label. */
function toOriginMatcher(origin: string): string | RegExp {
  if (!origin.includes('*')) {
    return origin;
  }
  const pattern = origin
    .split('*')
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('[^.]+');
  return new RegExp(`^${pattern}$`);
}

function getCorsOptions(): CorsOptions {
  const configured = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowed = configured.length ? configured : DEFAULT_ALLOWED_ORIGINS;

  return {
    origin: allowed.includes('*')
      ? true
      : [...allowed.map(toOriginMatcher), ...LOCAL_ORIGIN_MATCHERS],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(getCorsOptions());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  setupSwagger(app);

  // Railway (and most PaaS) inject PORT and require binding on all interfaces.
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
void bootstrap();
