import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Prisma, SymptomTemplate, SymptomDataType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// TODO: Add detailed logging
// TODO: Add permission checks (e.g., only certain study roles can manage templates)

@Injectable()
export class SymptomService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Checks if a study exists and belongs to the given practice.
   * Throws NotFoundException if not found or not authorized.
   * @param studyId - ID of the study.
   * @param practiceId - ID of the practice.
   */
  private async checkStudyAccess(studyId: string, practiceId: string): Promise<void> {
    const study = await this.prisma.study.findFirst({
      where: { id: studyId, practiceId },
      select: { id: true },
    });
    if (!study) {
      throw new NotFoundException('Study not found or you do not have access to it');
    }
  }

  /**
   * Creates a new symptom template associated with a Monitoring Plan.
   * @param monitoringPlanId - ID of the Monitoring Plan.
   * @param data - Symptom template data (Validated Zod input body).
   * @param practiceId - ID of the practice (for authorization).
   * @returns The created SymptomTemplate.
   * @throws NotFoundException if Monitoring Plan not found.
   * @throws InternalServerErrorException on DB error.
   */
  async createSymptomTemplate(
    monitoringPlanId: string,
    data: Omit<Prisma.SymptomTemplateCreateInput, 'monitoringPlan' | 'monitoringPlanId'>,
    practiceId: string
  ): Promise<SymptomTemplate> {
    try {
      // Verify the monitoring plan exists and belongs to the practice
      const planCheck = await this.prisma.monitoringPlan.count({
        where: { id: monitoringPlanId, practiceId }
      });
      if (planCheck === 0) {
        throw new NotFoundException('Monitoring Plan not found or not associated with this practice');
      }

      // Prepare data for Prisma create
      const createData: Prisma.SymptomTemplateCreateInput = {
        ...data,
        monitoringPlan: { connect: { id: monitoringPlanId } },
      };

      const symptomTemplate = await this.prisma.symptomTemplate.create({ data: createData });
      return symptomTemplate;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error creating symptom template:', error);
      throw new InternalServerErrorException('Could not create symptom template due to an internal error');
    }
  }

  /**
   * Finds all symptom templates for a specific Monitoring Plan.
   * @param monitoringPlanId - ID of the Monitoring Plan.
   * @param practiceId - ID of the practice (for authorization).
   * @returns Array of SymptomTemplates.
   * @throws NotFoundException if Monitoring Plan not found.
   * @throws InternalServerErrorException on DB error.
   */
  async findSymptomTemplatesByMonitoringPlan(monitoringPlanId: string, practiceId: string): Promise<SymptomTemplate[]> {
    try {
      // Verify the monitoring plan exists and belongs to the practice
      const planCheck = await this.prisma.monitoringPlan.count({
        where: { id: monitoringPlanId, practiceId }
      });
      if (planCheck === 0) {
        throw new NotFoundException('Monitoring Plan not found or not associated with this practice');
      }

      const symptomTemplates = await this.prisma.symptomTemplate.findMany({
        where: { monitoringPlanId },
        orderBy: { name: 'asc' },
      });
      return symptomTemplates;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error finding symptom templates:', error);
      throw new InternalServerErrorException('Could not retrieve symptom templates due to an internal error');
    }
  }

  /**
   * Finds a specific symptom template by its ID.
   * @param monitoringPlanId - ID of the Monitoring Plan (optional, for context/auth).
   * @param symptomTemplateId - ID of the Symptom Template.
   * @param practiceId - ID of the practice (for authorization).
   * @returns The SymptomTemplate or null if not found.
   * @throws InternalServerErrorException on DB error.
   */
  async findSymptomTemplateById(monitoringPlanId: string | undefined, symptomTemplateId: string, practiceId: string): Promise<SymptomTemplate | null> {
    try {
      const where: Prisma.SymptomTemplateWhereInput = {
        id: symptomTemplateId,
        monitoringPlan: { practiceId } // Ensure it belongs to the correct practice
      };

      // If monitoringPlanId is provided, ensure it matches
      if (monitoringPlanId) {
        where.monitoringPlanId = monitoringPlanId;
      }

      const symptomTemplate = await this.prisma.symptomTemplate.findFirst({ where });
      return symptomTemplate;
    } catch (error) {
      console.error('Error finding symptom template by ID:', error);
      throw new InternalServerErrorException('Could not retrieve symptom template due to an internal error');
    }
  }

  /**
   * Updates an existing symptom template.
   * @param symptomTemplateId - ID of the Symptom Template to update.
   * @param data - Update data (Validated Zod input body).
   * @param practiceId - ID of the practice (for authorization).
   * @returns The updated SymptomTemplate.
   * @throws NotFoundException if template not found.
   * @throws InternalServerErrorException on DB error.
   */
  async updateSymptomTemplate(
    symptomTemplateId: string,
    data: Partial<Omit<Prisma.SymptomTemplateUpdateInput, 'monitoringPlan'>>,
    practiceId: string
  ): Promise<SymptomTemplate> {
    try {
      // Verify the template exists and belongs to the practice
      const existingTemplate = await this.prisma.symptomTemplate.findFirst({
        where: {
          id: symptomTemplateId,
          monitoringPlan: { practiceId }
        }
      });

      if (!existingTemplate) {
        throw new NotFoundException('Symptom template not found or you do not have permission to update it');
      }

      // Perform the update
      const updatedSymptomTemplate = await this.prisma.symptomTemplate.update({
        where: { id: symptomTemplateId },
        data,
      });
      return updatedSymptomTemplate;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error updating symptom template:', error);
      throw new InternalServerErrorException('Could not update symptom template due to an internal error');
    }
  }

  /**
   * Deletes a symptom template.
   * @param symptomTemplateId - ID of the Symptom Template to delete.
   * @param practiceId - ID of the practice (for authorization).
   * @returns True if deletion was successful.
   * @throws NotFoundException if template not found.
   * @throws BadRequestException if template has associated observations.
   * @throws InternalServerErrorException on DB error.
   */
  async deleteSymptomTemplate(symptomTemplateId: string, practiceId: string): Promise<boolean> {
    try {
      // Verify the template exists and belongs to the practice
      const templateCheck = await this.prisma.symptomTemplate.count({
        where: {
          id: symptomTemplateId,
          monitoringPlan: { practiceId }
        }
      });

      if (templateCheck === 0) {
        throw new NotFoundException('Symptom template not found or you do not have permission to delete it');
      }

      // Perform the delete
      await this.prisma.symptomTemplate.delete({
        where: { id: symptomTemplateId },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2014') {
        // Handle case where observations exist and deletion is restricted
        throw new BadRequestException('Cannot delete symptom template with associated observations');
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error deleting symptom template:', error);
      throw new InternalServerErrorException('Could not delete symptom template due to an internal error');
    }
  }
} 