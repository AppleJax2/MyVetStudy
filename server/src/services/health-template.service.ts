import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Observation } from '@prisma/client';

@Injectable()
export class HealthTemplateService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create the HEALTH_NOTE template for a practice
   * @param practiceId - ID of the practice
   * @returns The HEALTH_NOTE template object
   * @throws InternalServerErrorException if template creation fails
   */
  async getOrCreateHealthNoteTemplate(practiceId: string) {
    try {
      // Try to find existing health note template
      let healthNoteTemplate = await this.prisma.symptomTemplate.findFirst({
        where: {
          practiceId,
          AND: [
            { valueType: 'TEXT' },
            { name: 'Health Note' }
          ]
        }
      });

      // If no template exists, create one
      if (!healthNoteTemplate) {
        healthNoteTemplate = await this.prisma.symptomTemplate.create({
          data: {
            name: 'Health Note',
            description: 'General health status notes',
            practiceId,
            isArchived: false,
            valueType: 'TEXT',
            valueOptions: {},
            icon: 'clipboard-notes'
          }
        });
      }

      return healthNoteTemplate;
    } catch (error) {
      console.error(`Error getting/creating health note template for practice ${practiceId}:`, error);
      throw new InternalServerErrorException('Could not retrieve health note template');
    }
  }

  /**
   * Create a health note observation
   * @param data - Health note data
   * @returns The created observation
   * @throws NotFoundException if prerequisites are not found
   * @throws InternalServerErrorException on database error
   */
  async createHealthNote(data: {
    patientId: string;
    monitoringPlanPatientId: string;
    notes: string;
    recordedById: string;
    practiceId: string;
  }): Promise<Observation> {
    const { patientId, monitoringPlanPatientId, notes, recordedById, practiceId } = data;

    try {
      // 1. Verify MonitoringPlanPatient record exists and belongs to the practice
      const planPatientRecord = await this.prisma.monitoringPlanPatient.findFirst({
        where: {
          id: monitoringPlanPatientId,
          patient: {
            id: patientId
          },
          monitoringPlan: {
            practiceId
          }
        },
        select: { id: true } // Only need to confirm existence
      });

      if (!planPatientRecord) {
        throw new NotFoundException('Monitoring plan enrollment not found or access denied');
      }

      // 2. Get or create the HEALTH_NOTE template
      const healthNoteTemplate = await this.getOrCreateHealthNoteTemplate(practiceId);

      // 3. Create the observation
      const newObservation = await this.prisma.observation.create({
        data: {
          symptomTemplate: {
            connect: {
              id: healthNoteTemplate.id
            }
          },
          patient: {
            connect: {
              id: patientId
            }
          },
          monitoringPlanPatient: {
            connect: {
              id: monitoringPlanPatientId
            }
          },
          recordedBy: {
            connect: {
              id: recordedById
            }
          },
          recordedAt: new Date(),
          notes: notes.trim(),
          value: {}
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

      return newObservation;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Failed to create health note:', error);
      throw new InternalServerErrorException('Failed to create health note');
    }
  }

  /**
   * Get health notes for a specific monitoring plan enrollment
   * @param params - Parameters for health note retrieval
   * @returns Array of health note observations
   * @throws NotFoundException if prerequisites are not found
   * @throws InternalServerErrorException on database error
   */
  async getHealthNotes(params: {
    patientId: string;
    monitoringPlanPatientId: string;
    practiceId: string;
  }) {
    const { patientId, monitoringPlanPatientId, practiceId } = params;

    try {
      // 1. Verify MonitoringPlanPatient record exists and belongs to the practice
      const planPatientExists = await this.prisma.monitoringPlanPatient.count({
        where: {
          id: monitoringPlanPatientId,
          patient: {
            id: patientId
          },
          monitoringPlan: {
            practiceId
          }
        }
      });

      if (planPatientExists === 0) {
        throw new NotFoundException('Monitoring plan enrollment not found or access denied');
      }

      // 2. Find the HEALTH_NOTE template
      const healthNoteTemplate = await this.getOrCreateHealthNoteTemplate(practiceId);

      // 3. Find observations
      const observations = await this.prisma.observation.findMany({
        where: {
          patient: {
            id: patientId
          },
          monitoringPlanPatient: {
            id: monitoringPlanPatientId
          },
          symptomTemplate: {
            id: healthNoteTemplate.id
          }
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

      return observations;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Failed to retrieve health notes:', error);
      throw new InternalServerErrorException('Failed to retrieve health notes');
    }
  }
} 