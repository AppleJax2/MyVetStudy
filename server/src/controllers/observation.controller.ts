import { Controller, Get, Post, Delete, Body, Param, Query, Req, Res, HttpStatus, HttpCode, UseGuards, BadRequestException, NotFoundException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { ObservationService } from '../services/observation.service';
import { SymptomService } from '../services/symptom.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateObservationDto, CreateObservationParamsDto } from '../observations/dto/create-observation.dto';
import { ListObservationsQueryDto, ListObservationsParamsDto } from '../observations/dto/list-observations-query.dto';
import { ObservationParamsDto } from '../observations/dto/observation-params.dto';
import { CreateHealthNoteDto, HealthNoteParamsDto } from '../observations/dto/health-note.dto';
import { AuthGuard } from '@nestjs/passport'; // Assuming JWT authentication with Passport
import { Observation } from '@prisma/client';

// Interface for authenticated request user
interface AuthUser {
  id: string;
  practiceId: string;
  roles?: string[];
}

@Controller('observations')
export class ObservationController {
  constructor(
    private readonly observationService: ObservationService,
    private readonly symptomService: SymptomService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Create a new observation
   */
  @Post('studies/:studyId')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  async createObservation(
    @Param() params: CreateObservationParamsDto,
    @Body() createObservationDto: CreateObservationDto,
    @Req() req: { user: AuthUser }
  ) {
    const { studyId } = params;
    const userId = req.user?.id;
    const practiceId = req.user?.practiceId;

    if (!userId || !practiceId) {
      throw new ForbiddenException('Authentication details missing');
    }

    const newObservation = await this.observationService.create(
      studyId,
      createObservationDto,
      userId,
      practiceId
    );

    return {
      status: 'success',
      message: 'Observation recorded successfully',
      data: newObservation,
    };
  }

  /**
   * Get observations based on filters
   */
  @Get('studies/:studyId')
  @UseGuards(AuthGuard('jwt'))
  async getObservations(
    @Param() params: ListObservationsParamsDto,
    @Query() query: ListObservationsQueryDto,
    @Req() req: { user: AuthUser }
  ) {
    const practiceId = req.user?.practiceId;

    if (!practiceId) {
      throw new ForbiddenException('Practice ID missing from authenticated user');
    }

    // Combine params and query into criteria for the service
    const criteria = {
      ...params,
      ...query,
      skip: query.page ? (query.page - 1) * (query.limit || 25) : 0,
      take: query.limit || 25,
    };

    const result = await this.observationService.findAll(criteria, practiceId);

    return {
      status: 'success',
      message: 'Observations retrieved successfully',
      results: result.observations.length,
      pagination: result.pagination,
      data: result.observations,
    };
  }

  /**
   * Delete a specific observation
   */
  @Delete(':observationId')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteObservation(
    @Param() params: ObservationParamsDto,
    @Req() req: { user: AuthUser }
  ) {
    const { observationId } = params;
    const practiceId = req.user?.practiceId;
    const userId = req.user?.id;

    if (!practiceId || !userId) {
      throw new ForbiddenException('Authentication details missing');
    }

    await this.observationService.remove(observationId, practiceId, userId);
  }

  /**
   * Create a health note observation
   */
  @Post('health-notes/patients/:patientId/plans/:monitoringPlanPatientId')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  async createHealthNoteObservation(
    @Param() params: HealthNoteParamsDto,
    @Body() createHealthNoteDto: CreateHealthNoteDto,
    @Req() req: { user: AuthUser }
  ) {
    const { patientId, monitoringPlanPatientId } = params;
    const { notes } = createHealthNoteDto;
    const userId = req.user?.id;
    const userPracticeId = req.user?.practiceId;

    if (!userId || !userPracticeId) {
      throw new ForbiddenException('Authentication required');
    }

    try {
      // 1. Verify MonitoringPlanPatient record exists and belongs to the user's practice
      const planPatientRecord = await this.prisma.monitoringPlanPatient.findUnique({
        where: {
          id: monitoringPlanPatientId,
          patientId: patientId,
          monitoringPlan: {
            practiceId: userPracticeId,
          },
        },
        select: { id: true } // Only need to confirm existence
      });

      if (!planPatientRecord) {
        throw new NotFoundException('Monitoring plan enrollment not found or access denied');
      }

      // 2. Find or create the HEALTH_NOTE template (using imported function for now)
      // TODO: Refactor to inject HealthTemplateService
      const healthNoteTemplate = await this.prisma.symptomTemplate.findFirst({
        where: {
          type: 'HEALTH_NOTE',
          practiceId: userPracticeId
        }
      });

      if (!healthNoteTemplate) {
        throw new InternalServerErrorException('Health note template not found');
      }

      // 3. Create the observation
      const newObservation: Observation = await this.prisma.observation.create({
        data: {
          symptomTemplateId: healthNoteTemplate.id,
          patientId: patientId,
          monitoringPlanPatientId: monitoringPlanPatientId,
          recordedById: userId,
          recordedAt: new Date(),
          notes: notes.trim(),
          value: {}, // No specific value for HEALTH_NOTE type
        },
        include: {
          recordedBy: { // Include user info for display
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          },
        }
      });

      return {
        status: 'success',
        message: 'Health note recorded successfully',
        data: newObservation,
      };
    } catch (error) {
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException || 
          error instanceof ForbiddenException ||
          error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create health note');
    }
  }

  /**
   * Get all health note observations for a specific monitoring plan enrollment
   */
  @Get('health-notes/patients/:patientId/plans/:monitoringPlanPatientId')
  @UseGuards(AuthGuard('jwt'))
  async getHealthNoteObservations(
    @Param() params: HealthNoteParamsDto,
    @Req() req: { user: AuthUser }
  ) {
    const { patientId, monitoringPlanPatientId } = params;
    const userPracticeId = req.user?.practiceId;

    if (!userPracticeId) {
      throw new ForbiddenException('Authentication required');
    }

    try {
      // 1. Verify MonitoringPlanPatient record exists and belongs to the user's practice
      const planPatientRecord = await this.prisma.monitoringPlanPatient.count({
        where: {
          id: monitoringPlanPatientId,
          patientId: patientId,
          monitoringPlan: {
            practiceId: userPracticeId,
          },
        },
      });

      if (planPatientRecord === 0) {
        throw new NotFoundException('Monitoring plan enrollment not found or access denied');
      }

      // 2. Find the HEALTH_NOTE template
      const healthNoteTemplate = await this.prisma.symptomTemplate.findFirst({
        where: {
          type: 'HEALTH_NOTE',
          practiceId: userPracticeId
        }
      });

      if (!healthNoteTemplate) {
        throw new InternalServerErrorException('Health note template not found');
      }

      // 3. Find observations
      const observations = await this.prisma.observation.findMany({
        where: {
          patientId: patientId,
          monitoringPlanPatientId: monitoringPlanPatientId,
          symptomTemplateId: healthNoteTemplate.id,
        },
        orderBy: {
          recordedAt: 'desc', // Show newest first
        },
        include: {
          recordedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          },
        }
      });

      return {
        status: 'success',
        message: 'Health notes retrieved successfully',
        results: observations.length,
        data: observations,
      };
    } catch (error) {
      if (error instanceof NotFoundException || 
          error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve health notes');
    }
  }
} 