import { Controller, Get, Post, Delete, Body, Param, Query, Req, Res, HttpStatus, HttpCode, UseGuards, BadRequestException, NotFoundException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { ObservationService } from '../services/observation.service';
import { SymptomService } from '../services/symptom.service';
import { HealthTemplateService } from '../services/health-template.service';
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
    private readonly healthTemplateService: HealthTemplateService,
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
      // Create the health note using the dedicated service
      const newObservation = await this.healthTemplateService.createHealthNote({
        patientId,
        monitoringPlanPatientId,
        notes,
        recordedById: userId,
        practiceId: userPracticeId
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
      // Get health notes using the dedicated service
      const observations = await this.healthTemplateService.getHealthNotes({
        patientId,
        monitoringPlanPatientId,
        practiceId: userPracticeId
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

// Add aliases for the route handler functions
export const createObservation = (req, res, next) => {
  const controller = new ObservationController(
    req.app.get('observationService'),
    req.app.get('symptomService'),
    req.app.get('healthTemplateService'),
    req.app.get('prisma')
  );
  return controller.createObservation(req.params, req.body, { user: req.user });
};

export const getObservations = (req, res, next) => {
  const controller = new ObservationController(
    req.app.get('observationService'),
    req.app.get('symptomService'),
    req.app.get('healthTemplateService'),
    req.app.get('prisma')
  );
  return controller.getObservations(req.params, req.query, { user: req.user });
};

export const deleteObservation = (req, res, next) => {
  const controller = new ObservationController(
    req.app.get('observationService'),
    req.app.get('symptomService'),
    req.app.get('healthTemplateService'),
    req.app.get('prisma')
  );
  return controller.deleteObservation(req.params, { user: req.user });
}; 