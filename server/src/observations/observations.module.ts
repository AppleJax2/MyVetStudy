import { Module } from '@nestjs/common';
import { ObservationController } from '../controllers/observation.controller';
import { ObservationService } from '../services/observation.service';
import { SymptomService } from '../services/symptom.service';
import { PrismaModule } from '../prisma/prisma.module';
import { HealthTemplatesModule } from '../health-templates/health-templates.module';

@Module({
  imports: [
    PrismaModule,
    HealthTemplatesModule
  ],
  controllers: [ObservationController],
  providers: [ObservationService, SymptomService],
  exports: [ObservationService, SymptomService]
})
export class ObservationsModule {} 