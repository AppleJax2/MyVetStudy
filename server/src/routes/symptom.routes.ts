import express from 'express';
import {
    createSymptomTemplate,
    getSymptomTemplates,
    getSymptomTemplateById,
    updateSymptomTemplate,
    deleteSymptomTemplate,
} from '../controllers/symptom.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
    createSymptomTemplateSchema,
    updateSymptomTemplateSchema,
    symptomTemplateParamsSchema,
    listSymptomTemplatesSchema,
} from '../schemas/symptom.schema';

// Create a router that preserves params from the parent router (study.routes)
const router = express.Router({ mergeParams: true });

// All symptom routes require authentication (already applied in study.routes)
// router.use(authenticate); // No need to re-apply here due to mergeParams

// Route: /studies/:studyId/symptoms/

router.post(
    '/',
    validate(createSymptomTemplateSchema),
    createSymptomTemplate
);

router.get(
    '/',
    validate(listSymptomTemplatesSchema), // Validate studyId param
    getSymptomTemplates
);

// Route: /studies/:studyId/symptoms/:symptomId

router.get(
    '/:symptomId',
    validate(symptomTemplateParamsSchema),
    getSymptomTemplateById
);

router.put(
    '/:symptomId',
    validate(updateSymptomTemplateSchema),
    updateSymptomTemplate
);

router.delete(
    '/:symptomId',
    validate(symptomTemplateParamsSchema),
    deleteSymptomTemplate
);

export default router; 