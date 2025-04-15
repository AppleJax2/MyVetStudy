import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ObservationsModule } from './observations/observations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthTemplatesModule } from './health-templates/health-templates.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // Global configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Database module
    PrismaModule,
    // Feature modules
    AuthModule,
    UsersModule,
    ObservationsModule,
    NotificationsModule,
    HealthTemplatesModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {} 