import { Response, NextFunction } from 'express';
import * as symptomService from '../services/symptom.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import {
    CreateSymptomTemplateInput,
    UpdateSymptomTemplateInput,
    SymptomTemplateParamsInput,
    ListSymptomTemplatesInput
} from '../schemas/symptom.schema';
import AppError from '../utils/appError';

// TODO: Add detailed logging

// Controller to create a new SymptomTemplate for a Study
export const createSymptomTemplate = async (
    req: AuthenticatedRequest<CreateSymptomTemplateInput['params'], {}, CreateSymptomTemplateInput['body']>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { studyId } = req.params;
        const data = req.body;
        const practiceId = req.user?.practiceId;

        if (!practiceId) {
            return next(new AppError('Practice ID missing from authenticated user', 401));
        }

        const newTemplate = await symptomService.createSymptomTemplate(studyId, data, practiceId);

        res.status(201).json({
            status: 'success',
            message: 'Symptom template created successfully',
            data: newTemplate,
        });
    } catch (error) {
        next(error);
    }
};

// Controller to get all SymptomTemplates for a Study
export const getSymptomTemplates = async (
    req: AuthenticatedRequest<ListSymptomTemplatesInput['params']>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { studyId } = req.params;
        const practiceId = req.user?.practiceId;

        if (!practiceId) {
            return next(new AppError('Practice ID missing from authenticated user', 401));
        }

        const templates = await symptomService.findSymptomTemplatesByStudy(studyId, practiceId);

        res.status(200).json({
            status: 'success',
            message: 'Symptom templates retrieved successfully',
            results: templates.length,
            data: templates,
        });
    } catch (error) {
        next(error);
    }
};

// Controller to get a specific SymptomTemplate by ID
export const getSymptomTemplateById = async (
    req: AuthenticatedRequest<SymptomTemplateParamsInput['params']>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { studyId, symptomId } = req.params;
        const practiceId = req.user?.practiceId;

        if (!practiceId) {
            return next(new AppError('Practice ID missing from authenticated user', 401));
        }

        const template = await symptomService.findSymptomTemplateById(studyId, symptomId, practiceId);

        if (!template) {
            return next(new AppError('Symptom template not found', 404));
        }

        res.status(200).json({
            status: 'success',
            data: template,
        });
    } catch (error) {
        next(error);
    }
};

// Controller to update a SymptomTemplate
export const updateSymptomTemplate = async (
    req: AuthenticatedRequest<UpdateSymptomTemplateInput['params'], {}, UpdateSymptomTemplateInput['body']>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { studyId, symptomId } = req.params;
        const data = req.body;
        const practiceId = req.user?.practiceId;

        if (!practiceId) {
            return next(new AppError('Practice ID missing from authenticated user', 401));
        }

        if (Object.keys(data).length === 0) {
            return res.status(400).json({ status: 'fail', message: 'No update data provided' });
        }

        const updatedTemplate = await symptomService.updateSymptomTemplate(studyId, symptomId, data, practiceId);

        res.status(200).json({
            status: 'success',
            message: 'Symptom template updated successfully',
            data: updatedTemplate,
        });
    } catch (error) {
        next(error);
    }
};

// Controller to delete a SymptomTemplate
export const deleteSymptomTemplate = async (
    req: AuthenticatedRequest<SymptomTemplateParamsInput['params']>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { studyId, symptomId } = req.params;
        const practiceId = req.user?.practiceId;

        if (!practiceId) {
            return next(new AppError('Practice ID missing from authenticated user', 401));
        }

        await symptomService.deleteSymptomTemplate(studyId, symptomId, practiceId);

        res.status(204).send(); // No content on successful deletion

    } catch (error) {
        next(error);
    }
}; 