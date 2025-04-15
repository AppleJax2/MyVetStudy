import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { Prisma, Observation, SymptomDataType, AlertSeverity } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FindAllParams } from '../utils/findAll.params';
import { findSymptomTemplateById } from './symptom.service'; // TODO: Inject SymptomService in the future

// TODO: Add detailed logging
// TODO: Add permission checks (e.g., user role within study allows observation recording?)

@Injectable()
export class ObservationService {
    constructor(private prisma: PrismaService) { }

    /**
     * Validates the observation value against the data type defined in the SymptomTemplate.
     * @param value - The value to validate.
     * @param dataType - The expected data type from the SymptomTemplate.
     * @param options - Optional constraints from the template (e.g., min/max, enum options).
     * @returns True if valid, otherwise throws an exception.
     */
    private validateObservationValue(
        value: any,
        dataType: SymptomDataType,
        options?: { minValue?: number | null; maxValue?: number | null; options?: any | null }
    ): boolean {
        switch (dataType) {
            case SymptomDataType.NUMERIC:
                if (typeof value !== 'number') {
                    throw new BadRequestException('Invalid value: Expected a number');
                }
                if (options?.minValue !== null && options?.minValue !== undefined && value < options.minValue) {
                    throw new BadRequestException(`Invalid value: Must be at least ${options.minValue}`);
                }
                if (options?.maxValue !== null && options?.maxValue !== undefined && value > options.maxValue) {
                    throw new BadRequestException(`Invalid value: Must be at most ${options.maxValue}`);
                }
                break;
            case SymptomDataType.BOOLEAN:
                if (typeof value !== 'boolean') {
                    throw new BadRequestException('Invalid value: Expected true or false');
                }
                break;
            case SymptomDataType.SCALE:
                if (typeof value !== 'number') {
                    throw new BadRequestException('Invalid value: Expected a number for scale');
                }
                if (options?.minValue !== null && options?.minValue !== undefined && value < options.minValue) {
                    throw new BadRequestException(`Invalid value: Scale must be at least ${options.minValue}`);
                }
                if (options?.maxValue !== null && options?.maxValue !== undefined && value > options.maxValue) {
                    throw new BadRequestException(`Invalid value: Scale must be at most ${options.maxValue}`);
                }
                break;
            case SymptomDataType.ENUMERATION:
                if (!options?.options || !Array.isArray(options.options) || !options.options.includes(value)) {
                    throw new BadRequestException(`Invalid value: Must be one of [${(options?.options as any[] || []).join(', ')}]`);
                }
                break;
            case SymptomDataType.TEXT:
                if (typeof value !== 'string') {
                    throw new BadRequestException('Invalid value: Expected text');
                }
                break;
            case SymptomDataType.IMAGE:
                if (typeof value !== 'string' || !value) {
                    throw new BadRequestException('Invalid value: Expected image identifier/URL');
                }
                break;
            default:
                throw new InternalServerErrorException(`Unsupported data type for validation: ${dataType}`);
        }
        return true;
    }

    /**
     * Creates a new Observation for a patient within a study.
     * @param studyId - ID of the study.
     * @param data - Observation creation data with patient and symptom template IDs.
     * @param userId - ID of the user recording the observation.
     * @param practiceId - ID of the practice (for authorization checks).
     * @returns The created Observation.
     * @throws Various exceptions if validation fails or records not found.
     */
    async create(
        studyId: string,
        data: {
            value: any;
            notes?: string;
            patientId: string; 
            symptomTemplateId: string;
        },
        userId: string,
        practiceId: string
    ): Promise<Observation> {
        try {
            // 1. Fetch the SymptomTemplate to validate value and ensure it belongs to the study/practice
            const symptomTemplate = await findSymptomTemplateById(studyId, data.symptomTemplateId, practiceId);
            if (!symptomTemplate) {
                throw new NotFoundException('Symptom template not found or not associated with this study');
            }

            // 2. Validate the provided value against the template's data type
            this.validateObservationValue(data.value, symptomTemplate.dataType, {
                minValue: symptomTemplate.minValue,
                maxValue: symptomTemplate.maxValue,
                options: symptomTemplate.options,
            });

            // 3. Find the specific StudyPatient record for this patient in this study
            const studyPatient = await this.prisma.studyPatient.findUnique({
                where: {
                    studyId_patientId: { studyId, patientId: data.patientId },
                    isActive: true,
                    study: { practiceId: practiceId }
                },
                select: { id: true },
            });
            
            if (!studyPatient) {
                throw new NotFoundException('Patient is not actively enrolled in this study within your practice');
            }

            // 4. Create the Observation record
            const observationData: Prisma.ObservationCreateInput = {
                value: data.value,
                notes: data.notes,
                symptomTemplate: { connect: { id: data.symptomTemplateId } },
                patient: { connect: { id: data.patientId } },
                studyPatient: { connect: { id: studyPatient.id } },
                recordedBy: { connect: { id: userId } },
            };

            return await this.prisma.observation.create({ data: observationData });

        } catch (error) {
            if (error instanceof NotFoundException || 
                error instanceof BadRequestException || 
                error instanceof ForbiddenException) {
                throw error;
            }
            console.error(`Error creating observation for study ${studyId}, patient ${data.patientId}:`, error);
            throw new InternalServerErrorException('Could not create observation due to an internal error');
        }
    }

    /**
     * Retrieves observations based on specified criteria with pagination.
     * @param criteria - Filtering and pagination options.
     * @param practiceId - ID of the practice for authorization.
     * @returns List of observations and pagination metadata.
     * @throws Various exceptions on errors or if required criteria missing.
     */
    async findAll(
        criteria: FindAllParams & { 
            studyId?: string; 
            patientId?: string; 
            symptomTemplateId?: string; 
            startDate?: Date; 
            endDate?: Date;
        },
        practiceId: string
    ) {
        const { 
            studyId, 
            patientId, 
            symptomTemplateId, 
            startDate, 
            endDate, 
            skip = 0, 
            take = 25,
            orderBy = { recordedAt: 'desc' }
        } = criteria;
        
        const page = Math.floor(skip / take) + 1;

        // Authorization: Ensure at least studyId or patientId is provided
        if (!studyId && !patientId) {
            throw new BadRequestException('Must provide at least Study ID or Patient ID to query observations');
        }

        const where: Prisma.ObservationWhereInput = {};

        if (studyId) {
            where.studyPatient = { study: { id: studyId, practiceId } };
        }
        
        if (patientId) {
            if (!studyId) {
                where.patient = { id: patientId, practiceId };
            } else {
                where.patientId = patientId;
            }
        }
        
        if (symptomTemplateId) {
            where.symptomTemplateId = symptomTemplateId;
        }
        
        if (startDate || endDate) {
            where.recordedAt = {};
            if (startDate) where.recordedAt.gte = startDate;
            if (endDate) where.recordedAt.lte = endDate;
        }

        try {
            const [observations, totalObservations] = await this.prisma.$transaction([
                this.prisma.observation.findMany({
                    where,
                    skip,
                    take,
                    orderBy,
                    include: {
                        symptomTemplate: { select: { id: true, name: true, units: true } },
                        recordedBy: { select: { id: true, firstName: true, lastName: true } },
                        patient: { select: { id: true, name: true } },
                    },
                }),
                this.prisma.observation.count({ where })
            ]);

            return {
                observations,
                pagination: {
                    total: totalObservations,
                    page,
                    limit: take,
                    totalPages: Math.ceil(totalObservations / take),
                },
            };
        } catch (error) {
            console.error('Error finding observations:', error);
            throw new InternalServerErrorException('Could not retrieve observations due to an internal error');
        }
    }

    /**
     * Deletes a specific Observation.
     * @param observationId - ID of the observation to delete.
     * @param practiceId - ID of the practice for authorization.
     * @param userId - ID of the user performing the deletion.
     * @returns True if deletion successful.
     * @throws Various exceptions if not found, not authorized, or DB error.
     */
    async remove(observationId: string, practiceId: string, userId: string): Promise<boolean> {
        try {
            const deleteResult = await this.prisma.observation.deleteMany({
                where: {
                    id: observationId,
                    patient: { practiceId: practiceId },
                },
            });

            if (deleteResult.count === 0) {
                throw new NotFoundException('Observation not found or you do not have permission to delete it');
            }

            return true;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error(`Error deleting observation ${observationId}:`, error);
            throw new InternalServerErrorException('Could not delete observation due to an internal error');
        }
    }

    /**
     * Finds a specific observation by ID with authorization check.
     * @param id - The observation ID
     * @param practiceId - The practice ID for authorization
     * @returns The observation or null if not found/authorized
     */
    async findOne(id: string, practiceId: string): Promise<Observation | null> {
        return this.prisma.observation.findFirst({
            where: {
                id,
                patient: { practiceId }
            },
            include: {
                symptomTemplate: true,
                recordedBy: { 
                    select: { 
                        id: true, 
                        firstName: true, 
                        lastName: true 
                    } 
                },
                patient: { 
                    select: { 
                        id: true, 
                        name: true 
                    } 
                }
            }
        });
    }

    /**
     * Finds a specific observation by ID or throws an exception.
     * @param id - The observation ID
     * @param practiceId - The practice ID for authorization
     * @returns The observation
     * @throws NotFoundException if not found or not authorized
     */
    async findOneOrThrow(id: string, practiceId: string): Promise<Observation> {
        const observation = await this.findOne(id, practiceId);
        if (!observation) {
            throw new NotFoundException(`Observation with ID ${id} not found or you don't have access to it`);
        }
        return observation;
    }
} 