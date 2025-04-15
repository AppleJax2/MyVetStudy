import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ObservationsModule } from './observations/observations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthTemplatesModule } from './health-templates/health-templates.module';

@Module({
  imports: [
    PrismaModule,
    ObservationsModule,
    NotificationsModule,
    HealthTemplatesModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {} 