import { Request, Response, NextFunction } from 'express';
import * as monitoringPlanService from '../services/monitoring-plan.service';
import { CreateMonitoringPlanInput, UpdateMonitoringPlanInput, MonitoringPlanAssignmentInput } from '../schemas/monitoring-plan.schema';
import { SymptomTemplateInput, UpdateSymptomTemplateInput, DeleteSymptomTemplateInput } from '../schemas/symptom-template.schema';
import AppError from '../utils/appError';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { MonitoringPlanStatus } from '../generated/prisma';
import prisma from '../utils/prisma.client';
import crypto from 'crypto';
import { createNotification } from '../services/notification.service';

export const createMonitoringPlan = async (req: AuthenticatedRequest<{}, {}, CreateMonitoringPlanInput['body']>, res: Response, next: NextFunction) => {
    try {
        // User information should be attached by the authenticate middleware
        if (!req.user?.id || !req.user?.practiceId) {
            // This should ideally be caught by the authenticate middleware itself
            return next(new AppError('Authentication details missing', 401));
        }

        const monitoringPlanData = req.body;
        const userId = req.user.id;
        const practiceId = req.user.practiceId;

        // Call the service function to create the monitoring plan
        const newMonitoringPlan = await monitoringPlanService.createMonitoringPlan(monitoringPlanData, userId, practiceId);

        res.status(201).json({
            status: 'success',
            message: 'Monitoring Plan created successfully',
            data: {
                monitoringPlan: newMonitoringPlan,
            },
        });
    } catch (error) {
        // Pass errors to the global error handler
        next(error);
    }
};

export const getMonitoringPlans = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user?.practiceId) {
            return next(new AppError('Practice ID missing from authenticated user', 401));
        }

        // Extract query parameters for filtering and pagination
        // Basic parsing, consider using a validation schema for query params for more robustness
        const { status, search } = req.query;
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
        const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;

        // Validate status if provided
        let validatedStatus: MonitoringPlanStatus | undefined;
        if (status && typeof status === 'string') {
            if (Object.values(MonitoringPlanStatus).includes(status as MonitoringPlanStatus)) {
                validatedStatus = status as MonitoringPlanStatus;
            } else {
                return next(new AppError(`Invalid status filter: ${status}`, 400));
            }
        }

        const options = {
            status: validatedStatus,
            search: search as string | undefined,
            limit: isNaN(limit) || limit <= 0 ? 10 : limit,
            page: isNaN(page) || page <= 0 ? 1 : page,
        };

        const result = await monitoringPlanService.findMonitoringPlansByPractice(req.user.practiceId, options);

        res.status(200).json({
            status: 'success',
            message: 'Monitoring Plans retrieved successfully',
            data: result.monitoringPlans,
            pagination: result.pagination,
        });

    } catch (error) {
        next(error);
    }
};

export const getMonitoringPlanById = async (req: AuthenticatedRequest<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const monitoringPlanId = req.params.id;
        if (!req.user?.practiceId) {
            return next(new AppError('Practice ID missing from authenticated user', 401));
        }

        // Basic validation for UUID can be done here or rely on schema validation if applied route-level
        // Example basic check (consider Zod for robustness):
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (!uuidRegex.test(monitoringPlanId)) {
             return next(new AppError('Invalid monitoring plan ID format', 400));
        }

        const monitoringPlan = await monitoringPlanService.findMonitoringPlanById(monitoringPlanId, req.user.practiceId);

        if (!monitoringPlan) {
            // Use 404 Not Found if the monitoring plan doesn't exist or doesn't belong to the user's practice
            return next(new AppError('Monitoring Plan not found or you do not have permission to view it', 404));
        }

        res.status(200).json({
            status: 'success',
            message: 'Monitoring Plan details retrieved successfully',
            data: {
                monitoringPlan,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const updateMonitoringPlan = async (req: AuthenticatedRequest<{ id: string }, {}, UpdateMonitoringPlanInput['body']>, res: Response, next: NextFunction) => {
    try {
        const monitoringPlanId = req.params.id;
        const updateData = req.body;

        if (!req.user?.practiceId) {
            return next(new AppError('Practice ID missing from authenticated user', 401));
        }

        // The monitoringPlanId format is already validated by the route middleware
        // The body format is also validated by the route middleware

        // Check if there's any data to update
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ status: 'fail', message: 'No update data provided' });
        }

        const updatedMonitoringPlan = await monitoringPlanService.updateMonitoringPlan(monitoringPlanId, updateData, req.user.practiceId);

        // The service now throws an error if not found/authorized, so no need to check for null here

        res.status(200).json({
            status: 'success',
            message: 'Monitoring Plan updated successfully',
            data: {
                monitoringPlan: updatedMonitoringPlan,
            },
        });

    } catch (error) {
        next(error);
    }
};

export const deleteMonitoringPlan = async (req: AuthenticatedRequest<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const monitoringPlanId = req.params.id;

        if (!req.user?.practiceId) {
            return next(new AppError('Practice ID missing from authenticated user', 401));
        }

        // monitoringPlanId format is validated by route middleware

        await monitoringPlanService.deleteMonitoringPlan(monitoringPlanId, req.user.practiceId);

        // Service throws error if not found/authorized/fails

        // Send 204 No Content on successful deletion
        res.status(204).send();

    } catch (error) {
        next(error);
    }
};

// --- Additional Monitoring Plan Management Functions ---

// Add patient to monitoring plan
export const addPatientToMonitoringPlan = async (req: AuthenticatedRequest<{ id: string; patientId: string }>, res: Response, next: NextFunction) => {
    try {
        const { id, patientId } = req.params;

        if (!req.user?.practiceId) {
            return next(new AppError('Practice ID missing from authenticated user', 401));
        }

        // id and patientId format validated by route middleware

        const enrollment = await monitoringPlanService.addPatientToMonitoringPlanService(id, patientId, req.user.practiceId);

        res.status(201).json({
            status: 'success',
            message: 'Patient successfully enrolled in monitoring plan',
            data: {
                enrollment,
            },
        });

    } catch (error) {
        next(error);
    }
};

// Remove patient from monitoring plan
export const removePatientFromMonitoringPlan = async (req: AuthenticatedRequest<{ id: string; patientId: string }>, res: Response, next: NextFunction) => {
     try {
        const { id, patientId } = req.params;

        if (!req.user?.practiceId) {
            return next(new AppError('Practice ID missing from authenticated user', 401));
        }

        // Params validated by route middleware

        await monitoringPlanService.removePatientFromMonitoringPlanService(id, patientId, req.user.practiceId);

        // Service throws error if not found or fails

        res.status(204).send(); // No content on successful removal

    } catch (error) {
        next(error);
    }
};

// Assign user to monitoring plan
export const assignUserToMonitoringPlan = async (req: AuthenticatedRequest<{ id: string; userId: string }, {}, MonitoringPlanAssignmentInput['body']>, res: Response, next: NextFunction) => {
     try {
        const { id, userId } = req.params;
        const { role } = req.body; // Role comes from the validated request body

        if (!req.user?.id || !req.user?.practiceId) {
            return next(new AppError('Authentication details missing', 401));
        }

        // Params and body (role) validated by route middleware
        if (!role) {
             // This should be caught by validation, but double-check
            return next(new AppError('Role is required to assign a user', 400));
        }

        const assignment = await monitoringPlanService.assignUserToMonitoringPlanService(
            id,
            userId, // The user being assigned
            role,   // The role from the request body
            req.user.practiceId,
            req.user.id // The user performing the assignment
        );

        res.status(200).json({ // Use 200 OK for both creation and update
            status: 'success',
            message: 'User successfully assigned to monitoring plan',
            data: {
                assignment,
            },
        });

    } catch (error) {
        next(error);
    }
};

// Unassign user from monitoring plan
export const unassignUserFromMonitoringPlan = async (req: AuthenticatedRequest<{ id: string; userId: string }>, res: Response, next: NextFunction) => {
    try {
        const { id, userId } = req.params;

        if (!req.user?.id || !req.user?.practiceId) {
            return next(new AppError('Authentication details missing', 401));
        }

        // Params validated by route middleware

        await monitoringPlanService.unassignUserFromMonitoringPlanService(
            id,
            userId, // User being unassigned
            req.user.practiceId,
            req.user.id // User performing the action
        );

        // Service throws error if not found or fails

        res.status(204).send(); // No content on successful unassignment

    } catch (error) {
        next(error);
    }
};

/**
 * Generate a shareable link for a monitoring plan
 */
export const generateShareableLink = async (req: AuthenticatedRequest<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const { expirationDays = 30, isPublic = true } = req.body || {};
        
        if (!userId) {
            return next(new AppError('Authentication required', 401));
        }
        
        // Generate a secure token for sharing
        const randomBytes = crypto.randomBytes(32).toString('hex');
        const timestamp = Date.now().toString(36);
        const shareToken = Buffer.from(`${id}-${timestamp}-${randomBytes}`).toString('base64url');
        
        // Calculate expiration date if applicable
        let expirationDate = null;
        if (expirationDays > 0) {
            expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + expirationDays);
        }
        
        // Save the shareable link settings
        const updateData = {
            shareToken,
            protocol: {
                shareableLink: true,
                shareLinkSettings: {
                    isPublic,
                    expirationDate: expirationDate ? expirationDate.toISOString() : null,
                    createdAt: new Date().toISOString(),
                    createdBy: userId
                }
            }
        };
        
        // Update the monitoring plan with the share token
        const updatedPlan = await monitoringPlanService.updateMonitoringPlan(
            id,
            updateData,
            userId
        );
        
        // Create the full shareable link
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const shareableLink = `${baseUrl}/shared/monitoring-plan/${shareToken}`;
        
        res.status(200).json({
            status: 'success',
            message: 'Shareable link generated successfully',
            data: {
                shareableLink,
                shareToken,
                expiresAt: expirationDate
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Revoke a shareable link for a monitoring plan
 */
export const revokeShareableLink = async (req: AuthenticatedRequest<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        
        if (!userId) {
            return next(new AppError('Authentication required', 401));
        }
        
        // Update the monitoring plan to remove the share token
        const updatedPlan = await monitoringPlanService.updateMonitoringPlan(
            id,
            { 
                shareToken: null,
                protocol: {
                    shareableLink: false
                }
            },
            userId
        );
        
        res.status(200).json({
            status: 'success',
            message: 'Shareable link revoked successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get a monitoring plan by its share token (public access)
 */
export const getMonitoringPlanByShareToken = async (req: AuthenticatedRequest<{ token: string }>, res: Response, next: NextFunction) => {
    try {
        const { token } = req.params;
        
        // Get the monitoring plan by its share token
        const monitoringPlan = await monitoringPlanService.getMonitoringPlanByShareToken(token);
        
        if (!monitoringPlan) {
            return next(new AppError('Monitoring plan not found or link has expired', 404));
        }
        
        // Check if the link has expired
        const shareLinkSettings = monitoringPlan.protocol?.shareLinkSettings;
        if (shareLinkSettings?.expirationDate) {
            const expirationDate = new Date(shareLinkSettings.expirationDate);
            if (expirationDate < new Date()) {
                return next(new AppError('This shareable link has expired', 410));
            }
        }
        
        // Check if the link requires authentication
        if (!shareLinkSettings?.isPublic && !req.user) {
            return next(new AppError('Authentication required to access this monitoring plan', 401));
        }
        
        res.status(200).json({
            status: 'success',
            data: monitoringPlan
        });
    } catch (error) {
        next(error);
    }
};

// Symptom template controllers
export const getSymptomTemplates = async (req: AuthenticatedRequest<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const practiceId = req.user?.practiceId;
        
        if (!userId || !practiceId) {
            return next(new AppError('Authentication required', 401));
        }
        
        const symptoms = await prisma.symptomTemplate.findMany({
            where: {
                monitoringPlanId: id,
                monitoringPlan: {
                    practiceId: practiceId
                }
            }
        });
        
        res.status(200).json({
            status: 'success',
            data: symptoms
        });
    } catch (error) {
        next(error);
    }
};

export const createSymptomTemplate = async (req: AuthenticatedRequest<{ id: string }, {}, SymptomTemplateInput['body']>, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const symptomData = req.body;
        const userId = req.user?.id;
        const practiceId = req.user?.practiceId;
        
        if (!userId || !practiceId) {
            return next(new AppError('Authentication required', 401));
        }
        
        // Verify the monitoring plan exists and user has access
        const monitoringPlan = await prisma.monitoringPlan.findFirst({
            where: {
                id,
                practiceId
            }
        });
        
        if (!monitoringPlan) {
            return next(new AppError('Monitoring plan not found or access denied', 404));
        }
        
        // Create the symptom template
        const symptomTemplate = await prisma.symptomTemplate.create({
            data: {
                ...symptomData,
                monitoringPlan: {
                    connect: { id }
                }
            }
        });
        
        res.status(201).json({
            status: 'success',
            message: 'Symptom template created successfully',
            data: {
                symptomTemplate
            }
        });
    } catch (error) {
        next(error);
    }
};

export const updateSymptomTemplate = async (req: AuthenticatedRequest<UpdateSymptomTemplateInput['params'], {}, UpdateSymptomTemplateInput['body']>, res: Response, next: NextFunction) => {
    try {
        const { id, symptomId } = req.params;
        const symptomData = req.body;
        const userId = req.user?.id;
        const practiceId = req.user?.practiceId;
        
        if (!userId || !practiceId) {
            return next(new AppError('Authentication required', 401));
        }
        
        // Verify the symptom template exists and belongs to the monitoring plan
        const existingSymptom = await prisma.symptomTemplate.findFirst({
            where: {
                id: symptomId,
                monitoringPlanId: id,
                monitoringPlan: {
                    practiceId
                }
            }
        });
        
        if (!existingSymptom) {
            return next(new AppError('Symptom template not found or access denied', 404));
        }
        
        // Update the symptom template
        const updatedSymptom = await prisma.symptomTemplate.update({
            where: {
                id: symptomId
            },
            data: symptomData
        });
        
        res.status(200).json({
            status: 'success',
            message: 'Symptom template updated successfully',
            data: {
                symptomTemplate: updatedSymptom
            }
        });
    } catch (error) {
        next(error);
    }
};

export const deleteSymptomTemplate = async (req: AuthenticatedRequest<DeleteSymptomTemplateInput['params']>, res: Response, next: NextFunction) => {
    try {
        const { id, symptomId } = req.params;
        const userId = req.user?.id;
        const practiceId = req.user?.practiceId;
        
        if (!userId || !practiceId) {
            return next(new AppError('Authentication required', 401));
        }
        
        // Verify the symptom template exists and belongs to the monitoring plan
        const existingSymptom = await prisma.symptomTemplate.findFirst({
            where: {
                id: symptomId,
                monitoringPlanId: id,
                monitoringPlan: {
                    practiceId
                }
            }
        });
        
        if (!existingSymptom) {
            return next(new AppError('Symptom template not found or access denied', 404));
        }
        
        // Check if the symptom template has observations (prevent deletion if it does)
        const observationCount = await prisma.observation.count({
            where: {
                symptomTemplateId: symptomId
            }
        });
        
        if (observationCount > 0) {
            return next(new AppError('Cannot delete symptom template with existing observations', 400));
        }
        
        // Delete the symptom template
        await prisma.symptomTemplate.delete({
            where: {
                id: symptomId
            }
        });
        
        res.status(200).json({
            status: 'success',
            message: 'Symptom template deleted successfully'
        });
    } catch (error) {
        next(error);
    }
}; 