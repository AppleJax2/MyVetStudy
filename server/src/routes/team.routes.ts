import express from 'express';
import {
    getTeamMembers,
    sendInvitation,
    cancelInvitation,
    getInvitations,
    getInvitationByToken,
    acceptInvitation,
    updateTeamMemberRole,
    removeTeamMember,
} from '../controllers/team.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import { validate } from '../middleware/validate.middleware';
import { sendInvitationSchema, cancelInvitationSchema, acceptInvitationSchema, updateTeamMemberSchema, removeTeamMemberSchema } from '../schemas/team.schema';
import { roleMiddleware } from '../middleware/role.middleware';

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