import express from 'express';
import { 
  getPracticeDetails, 
  updatePractice, 
  uploadLogo, 
  getDashboardStatistics, 
  getStaffMembers, 
  getSubscriptionInfo, 
  upload 
} from '../controllers/practice.controller';
import { authenticate } from '../middleware/auth.middleware';
import { restrictTo } from '../middleware/role.middleware';
import { Permission } from '../utils/rolePermissions';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Practice details
router.get('/details', getPracticeDetails);

// Practice settings (restricted to practice manager)
router.put('/settings', restrictTo(Permission.MANAGE_PRACTICE_SETTINGS), updatePractice);

// Upload logo (restricted to practice manager)
router.post('/logo', restrictTo(Permission.MANAGE_PRACTICE_SETTINGS), upload.single('logo'), uploadLogo);

// Dashboard statistics (accessible to practice manager and veterinarians)
router.get('/statistics', restrictTo(Permission.VIEW_PRACTICE_STATISTICS), getDashboardStatistics);

// Staff members list
router.get('/staff', restrictTo(Permission.VIEW_TEAM_MEMBERS), getStaffMembers);

// Subscription info (restricted to practice manager)
router.get('/subscription', restrictTo(Permission.MANAGE_SUBSCRIPTIONS), getSubscriptionInfo);

export default router; 