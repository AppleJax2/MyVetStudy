import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import { AppModule } from './app.module';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';

// Allow environment variables to be set from .env
dotenv.config();

// Express instance that can be shared with non-NestJS routes
export const expressApp = express();

// CORS configuration - Read allowed origins from environment variables or use defaults
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',')
    : ['https://myvetstudy.netlify.app', 'https://myvetstudyapp.netlify.app']
  : ['http://localhost:5173', 'http://localhost:3000'];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || 
        (process.env.NODE_ENV === 'production' && origin.endsWith('.netlify.app'))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply common Express middleware
expressApp.set('trust proxy', 1); // Trust the first hop (Render load balancer)
expressApp.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
}));
expressApp.use(cors(corsOptions));
expressApp.use(express.json());

// Legacy Express health check endpoint (can be removed once converted to NestJS)
expressApp.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start a NestJS application
async function bootstrap() {
  // Create NestJS app using the Express instance
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    {
      logger: ['error', 'warn', 'log'],
    }
  );

  // Set global validation pipe for all controllers
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true,           // Transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Auto-convert primitive types
      },
    }),
  );

  // Set global prefix for NestJS controllers (important to not conflict with legacy routes)
  app.setGlobalPrefix('api/v1');

  // Start the application
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`NestJS application started on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

// Bootstrap the NestJS application
bootstrap().catch(err => {
  console.error('Failed to start NestJS application:', err);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  process.exit(0);
});

process.on('SIGTERM', async () => {
  process.exit(0);
}); 