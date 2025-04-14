import { PrismaClient, SymptomDataType, SymptomTemplate } from '../../generated/prisma';
import AppError from '../utils/appError';

const prisma = new PrismaClient();

/**
 * Ensures that a practice has a default HEALTH_NOTE template.
 * If one doesn't exist, it creates one.
 * 
 * @param practiceId The ID of the practice
 * @returns The ID of the health note template
 */
export const ensureHealthNoteTemplate = async (practiceId: string): Promise<string> => {
  try {
    // Check if the practice exists
    const practice = await prisma.practice.findUnique({
      where: { id: practiceId },
      select: { id: true }
    });

    if (!practice) {
      throw new AppError(`Practice with id ${practiceId} not found`, 404);
    }

    // Look for an existing HEALTH_NOTE template
    const existingTemplate = await prisma.symptomTemplate.findFirst({
      where: {
        monitoringPlan: {
          practiceId
        },
        dataType: SymptomDataType.HEALTH_NOTE,
      },
      select: { id: true },
    });

    // If one exists, return its ID
    if (existingTemplate) {
      return existingTemplate.id;
    }

    // Otherwise, create a default one
    // First, get a monitoringPlan for this practice to link the template to
    const monitoringPlan = await prisma.monitoringPlan.findFirst({
      where: { practiceId },
      select: { id: true },
    });

    if (!monitoringPlan) {
      throw new AppError(
        'Cannot create health note template: No monitoring plan exists for this practice',
        404
      );
    }

    // Create the default health note template
    const newTemplate = await prisma.symptomTemplate.create({
      data: {
        name: 'General Health Notes',
        description: 'For recording general health observations and notes',
        dataType: SymptomDataType.HEALTH_NOTE,
        monitoringPlan: {
          connect: { id: monitoringPlan.id }
        }
      },
    });

    return newTemplate.id;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error ensuring health note template:', error);
    throw new AppError('Failed to setup health note template', 500);
  }
};

/**
 * Finds or creates the HEALTH_NOTE template for a practice.
 * This is a wrapper function for findHealthNoteTemplate in observation.controller.ts
 */
export const findHealthNoteTemplate = async (practiceId: string): Promise<string> => {
  const healthNoteTemplates = await prisma.symptomTemplate.findMany({
    where: {
      monitoringPlan: {
        practiceId,
      },
      dataType: SymptomDataType.HEALTH_NOTE,
    },
    select: { id: true },
  });

  if (healthNoteTemplates.length === 0) {
    return ensureHealthNoteTemplate(practiceId);
  }
  
  if (healthNoteTemplates.length > 1) {
    console.warn(
      `Multiple HEALTH_NOTE templates found for practice ${practiceId}. Using the first one.`
    );
  }
  
  return healthNoteTemplates[0].id;
}; 