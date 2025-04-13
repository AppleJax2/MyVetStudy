import express from 'express';
import authRoutes from './auth.routes';
import studyRoutes from './study.routes'; // Import study routes

const router = express.Router();

router.get('/healthcheck', (_, res) => res.sendStatus(200));

router.use('/auth', authRoutes);
router.use('/studies', studyRoutes); // Mount study routes under /studies

export default router; 