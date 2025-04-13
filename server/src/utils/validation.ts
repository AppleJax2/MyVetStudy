import { PrismaClient } from '@prisma/client';
import prisma from './prisma';

/**
 * Validation utilities for enforcing business rules and constraints
 */
export class ValidationService {
  /**
   * Checks if a practice has reached its study limit based on subscription tier
   * @param practiceId The practice ID to check
   * @returns True if limit reached, false otherwise
   */
  static async hasReachedStudyLimit(practiceId: string): Promise<boolean> {
    // Get the practice with its subscription tier
    const practice = await prisma.practice.findUnique({
      where: { id: practiceId },
      select: { subscriptionTier: true }
    });

    if (!practice) {
      throw new Error('Practice not found');
    }

    // Count active studies for this practice
    const activeStudyCount = await prisma.study.count({
      where: {
        practiceId,
        status: { in: ['ACTIVE', 'PAUSED'] }
      }
    });

    // Check against tier limits
    switch (practice.subscriptionTier) {
      case 'BASIC':
        return activeStudyCount >= 5;
      case 'STANDARD':
        return activeStudyCount >= 20;
      case 'PREMIUM':
      case 'TRIAL':
        return false; // Unlimited studies
      default:
        return true; // Unknown tier, prevent creation
    }
  }

  /**
   * Checks if a practice has reached its storage limit
   * @param practiceId The practice ID to check
   * @param additionalBytes Additional bytes that would be added
   * @returns True if limit reached, false otherwise
   */
  static async hasReachedStorageLimit(practiceId: string, additionalBytes: number = 0): Promise<boolean> {
    const practice = await prisma.practice.findUnique({
      where: { id: practiceId },
      select: { subscriptionTier: true, currentStorage: true, maxStorage: true }
    });

    if (!practice) {
      throw new Error('Practice not found');
    }

    // Convert bytes to MB for comparison
    const additionalMB = additionalBytes / (1024 * 1024);
    const projectedUsage = practice.currentStorage + additionalMB;

    return projectedUsage > practice.maxStorage;
  }

  /**
   * Validates a symptom observation against defined thresholds
   * @param symptomTemplateId The template ID for the symptom
   * @param value The observed value
   * @returns True if valid, false otherwise
   */
  static async validateSymptomObservation(
    symptomTemplateId: string, 
    value: any
  ): Promise<{ valid: boolean; error?: string }> {
    const template = await prisma.symptomTemplate.findUnique({
      where: { id: symptomTemplateId }
    });

    if (!template) {
      return { valid: false, error: 'Symptom template not found' };
    }

    // Check based on data type
    switch (template.dataType) {
      case 'NUMERIC':
        if (typeof value !== 'number') {
          return { valid: false, error: 'Value must be a number' };
        }
        if (template.minValue !== null && value < template.minValue) {
          return { valid: false, error: `Value cannot be less than ${template.minValue}` };
        }
        if (template.maxValue !== null && value > template.maxValue) {
          return { valid: false, error: `Value cannot be greater than ${template.maxValue}` };
        }
        break;

      case 'BOOLEAN':
        if (typeof value !== 'boolean') {
          return { valid: false, error: 'Value must be a boolean' };
        }
        break;

      case 'SCALE':
        if (typeof value !== 'number') {
          return { valid: false, error: 'Value must be a number' };
        }
        if (template.minValue !== null && value < template.minValue) {
          return { valid: false, error: `Scale value cannot be less than ${template.minValue}` };
        }
        if (template.maxValue !== null && value > template.maxValue) {
          return { valid: false, error: `Scale value cannot be greater than ${template.maxValue}` };
        }
        break;

      case 'ENUMERATION':
        const options = template.options as string[];
        if (!options || !options.includes(value)) {
          return { valid: false, error: `Value must be one of: ${options?.join(', ')}` };
        }
        break;

      case 'TEXT':
        if (typeof value !== 'string') {
          return { valid: false, error: 'Value must be a string' };
        }
        break;

      case 'IMAGE':
        // For image type, we expect a file reference or URL
        if (typeof value !== 'string') {
          return { valid: false, error: 'Value must be a file reference' };
        }
        break;

      default:
        return { valid: false, error: 'Unknown data type' };
    }

    return { valid: true };
  }

  /**
   * Checks if a subscription is active and valid
   * @param practiceId The practice ID to check
   * @returns True if subscription is active, false otherwise
   */
  static async isSubscriptionActive(practiceId: string): Promise<boolean> {
    const practice = await prisma.practice.findUnique({
      where: { id: practiceId },
      select: { 
        subscriptionStatus: true,
        subscriptionEndDate: true
      }
    });

    if (!practice) {
      throw new Error('Practice not found');
    }

    // Check subscription status
    if (practice.subscriptionStatus !== 'ACTIVE' && practice.subscriptionStatus !== 'TRIAL') {
      return false;
    }

    // Check if subscription has expired
    if (practice.subscriptionEndDate && practice.subscriptionEndDate < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Validates that a user has the required role for an operation
   * @param userId User ID to check
   * @param requiredRoles Array of roles that are allowed
   * @returns True if authorized, false otherwise
   */
  static async validateUserRole(
    userId: string, 
    requiredRoles: string[]
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      return false;
    }

    return requiredRoles.includes(user.role);
  }

  /**
   * Validates that a user is assigned to a specific study
   * @param userId User ID to check
   * @param studyId Study ID to check
   * @returns True if assigned, false otherwise
   */
  static async isUserAssignedToStudy(userId: string, studyId: string): Promise<boolean> {
    const assignment = await prisma.studyAssignment.findUnique({
      where: {
        studyId_userId: {
          studyId,
          userId
        }
      }
    });

    return !!assignment;
  }
} 