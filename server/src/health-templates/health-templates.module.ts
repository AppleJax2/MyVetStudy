import { Module } from '@nestjs/common';
import { HealthTemplateService } from '../services/health-template.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [HealthTemplateService],
  exports: [HealthTemplateService]
})
export class HealthTemplatesModule {} 