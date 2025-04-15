import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ObservationsModule } from './observations/observations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthTemplatesModule } from './health-templates/health-templates.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [
    // Global configuration module
    ConfigModule,
    // Database module
    PrismaModule,
    // Feature modules
    AuthModule,
    ObservationsModule,
    NotificationsModule,
    HealthTemplatesModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {} 