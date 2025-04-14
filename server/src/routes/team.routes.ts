import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { 
  getTeamMembers, 
  inviteTeamMember, 
  getPendingInvitations, 
  resendInvitation, 
  cancelInvitation, 
  acceptInvitation, 
  updateTeamMemberRole, 
  removeTeamMember 
} from '../controllers/team.controller';
import { roleMiddleware } from '../middleware/role.middleware';
import { UserRole } from '../types/auth';

const router = express.Router();

// Apply auth middleware to all team routes
router.use(authMiddleware);

// Routes for managing team members
router.get('/members', getTeamMembers);
router.delete('/members/:id', roleMiddleware([UserRole.PRACTICE_MANAGER]), removeTeamMember);
router.put('/members/:id/role', roleMiddleware([UserRole.PRACTICE_MANAGER]), updateTeamMemberRole);

// Routes for invitations
router.get('/invitations', roleMiddleware([UserRole.PRACTICE_MANAGER]), getPendingInvitations);
router.post('/invite', roleMiddleware([UserRole.PRACTICE_MANAGER]), inviteTeamMember);
router.post('/invitations/:id/resend', roleMiddleware([UserRole.PRACTICE_MANAGER]), resendInvitation);
router.delete('/invitations/:id', roleMiddleware([UserRole.PRACTICE_MANAGER]), cancelInvitation);

// Public route for accepting an invitation (no auth required)
router.post('/accept-invitation', acceptInvitation);

export default router; 