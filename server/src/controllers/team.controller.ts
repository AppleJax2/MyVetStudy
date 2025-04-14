import { Request, Response } from 'express';
import prisma from '../utils/prisma'; 
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '../utils/auth.utils';
import { sendEmail } from '../utils/email.utils'; // Assuming this utility exists or will be created

/**
 * Get all team members for the current practice
 */
export const getTeamMembers = async (req: Request, res: Response) => {
  try {
    const practiceId = req.user?.practiceId;
    
    if (!practiceId) {
      return res.status(403).json({ message: 'Not authorized to view team members' });
    }
    
    // Get all users for this practice
    const members = await prisma.user.findMany({
      where: {
        practiceId,
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        lastActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        role: 'asc'
      }
    });
    
    res.status(200).json({ members });
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ message: 'Error retrieving team members' });
  }
};

/**
 * Invite a new team member to join the practice
 */
export const inviteTeamMember = async (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, role, message } = req.body;
    const practiceId = req.user?.practiceId;
    const inviterId = req.user?.userId;
    
    // Validate required fields
    if (!email || !firstName || !lastName || !role || !practiceId || !inviterId) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(409).json({ message: 'A user with this email already exists' });
    }
    
    // Check if there's a pending invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        practiceId,
        status: 'PENDING'
      }
    });
    
    if (existingInvitation) {
      return res.status(409).json({ message: 'An invitation for this email already exists' });
    }
    
    // Generate invitation token
    const token = uuidv4();
    
    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        email,
        firstName,
        lastName,
        role,
        token,
        message,
        status: 'PENDING',
        practiceId,
        inviterId
      }
    });
    
    // Send invitation email
    const invitationLink = `${process.env.CLIENT_URL}/invitation/${token}`;
    
    // Get practice name
    const practice = await prisma.practice.findUnique({
      where: { id: practiceId }
    });
    
    const practiceName = practice?.name || 'a veterinary practice';
    const inviter = await prisma.user.findUnique({
      where: { id: inviterId },
      select: { firstName: true, lastName: true }
    });
    
    const inviterName = inviter 
      ? `${inviter.firstName} ${inviter.lastName}`
      : 'A practice manager';
    
    await sendEmail({
      to: email,
      subject: `Invitation to join ${practiceName} on MyVetStudy`,
      html: `
        <h1>You've been invited to join ${practiceName} on MyVetStudy!</h1>
        <p>${inviterName} has invited you to join their veterinary practice as a ${role.replace('_', ' ').toLowerCase()}.</p>
        <p>${message || ''}</p>
        <p>Click the link below to accept this invitation and create your account:</p>
        <p><a href="${invitationLink}" style="padding: 10px 15px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Accept Invitation</a></p>
        <p>Or copy and paste this link: ${invitationLink}</p>
        <p>This invitation will expire in 7 days.</p>
      `
    });
    
    res.status(201).json({ 
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        createdAt: invitation.createdAt
      }
    });
  } catch (error) {
    console.error('Error inviting team member:', error);
    res.status(500).json({ message: 'Error sending invitation' });
  }
};

/**
 * Get all pending invitations for the practice
 */
export const getPendingInvitations = async (req: Request, res: Response) => {
  try {
    const practiceId = req.user?.practiceId;
    
    if (!practiceId) {
      return res.status(403).json({ message: 'Not authorized to view invitations' });
    }
    
    const invitations = await prisma.invitation.findMany({
      where: {
        practiceId,
        status: 'PENDING'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.status(200).json({ invitations });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ message: 'Error retrieving invitations' });
  }
};

/**
 * Resend an invitation
 */
export const resendInvitation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const practiceId = req.user?.practiceId;
    
    if (!practiceId) {
      return res.status(403).json({ message: 'Not authorized to resend invitations' });
    }
    
    // Find the invitation
    const invitation = await prisma.invitation.findFirst({
      where: {
        id,
        practiceId,
        status: 'PENDING'
      }
    });
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }
    
    // Update invitation (reset expiration by updating timestamps)
    await prisma.invitation.update({
      where: { id },
      data: { 
        updatedAt: new Date()
      }
    });
    
    // Get practice name
    const practice = await prisma.practice.findUnique({
      where: { id: practiceId }
    });
    
    const practiceName = practice?.name || 'a veterinary practice';
    
    // Send invitation email
    const invitationLink = `${process.env.CLIENT_URL}/invitation/${invitation.token}`;
    
    await sendEmail({
      to: invitation.email,
      subject: `Reminder: Invitation to join ${practiceName} on MyVetStudy`,
      html: `
        <h1>Reminder: You've been invited to join ${practiceName} on MyVetStudy!</h1>
        <p>You were recently invited to join a veterinary practice as a ${invitation.role.replace('_', ' ').toLowerCase()}.</p>
        <p>${invitation.message || ''}</p>
        <p>Click the link below to accept this invitation and create your account:</p>
        <p><a href="${invitationLink}" style="padding: 10px 15px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Accept Invitation</a></p>
        <p>Or copy and paste this link: ${invitationLink}</p>
        <p>This invitation will expire in 7 days.</p>
      `
    });
    
    res.status(200).json({ message: 'Invitation resent successfully' });
  } catch (error) {
    console.error('Error resending invitation:', error);
    res.status(500).json({ message: 'Error resending invitation' });
  }
};

/**
 * Cancel an invitation
 */
export const cancelInvitation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const practiceId = req.user?.practiceId;
    
    if (!practiceId) {
      return res.status(403).json({ message: 'Not authorized to cancel invitations' });
    }
    
    // Find and delete the invitation
    const invitation = await prisma.invitation.findFirst({
      where: {
        id,
        practiceId,
        status: 'PENDING'
      }
    });
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }
    
    await prisma.invitation.update({
      where: { id },
      data: { status: 'CANCELED' }
    });
    
    res.status(200).json({ message: 'Invitation canceled successfully' });
  } catch (error) {
    console.error('Error canceling invitation:', error);
    res.status(500).json({ message: 'Error canceling invitation' });
  }
};

/**
 * Accept an invitation (used by invited users)
 */
export const acceptInvitation = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }
    
    // Find invitation by token
    const invitation = await prisma.invitation.findFirst({
      where: {
        token,
        status: 'PENDING'
      }
    });
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invalid or expired invitation' });
    }
    
    // Check if token is expired (7 days)
    const now = new Date();
    const expirationDate = new Date(invitation.updatedAt);
    expirationDate.setDate(expirationDate.getDate() + 7);
    
    if (now > expirationDate) {
      return res.status(410).json({ message: 'Invitation has expired' });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: invitation.email,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        password: hashedPassword,
        role: invitation.role,
        practiceId: invitation.practiceId,
        isActive: true
      }
    });
    
    // Mark invitation as accepted
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { 
        status: 'ACCEPTED',
        acceptedAt: now,
        acceptedByUserId: newUser.id
      }
    });
    
    res.status(201).json({ 
      message: 'Invitation accepted successfully',
      email: newUser.email
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ message: 'Error accepting invitation' });
  }
};

/**
 * Update a team member's role
 */
export const updateTeamMemberRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const practiceId = req.user?.practiceId;
    const userId = req.user?.userId;
    
    if (!practiceId) {
      return res.status(403).json({ message: 'Not authorized to update team members' });
    }
    
    // Check that the user exists and belongs to the practice
    const user = await prisma.user.findFirst({
      where: {
        id,
        practiceId
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Team member not found' });
    }
    
    // Cannot update own role
    if (id === userId) {
      return res.status(403).json({ message: 'Cannot update your own role' });
    }
    
    // Cannot update practice manager role
    if (user.role === 'PRACTICE_MANAGER') {
      return res.status(403).json({ message: 'Cannot update practice manager role' });
    }
    
    // Update user role
    await prisma.user.update({
      where: { id },
      data: { role }
    });
    
    res.status(200).json({ message: 'Team member role updated successfully' });
  } catch (error) {
    console.error('Error updating team member role:', error);
    res.status(500).json({ message: 'Error updating team member role' });
  }
};

/**
 * Remove a team member
 */
export const removeTeamMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const practiceId = req.user?.practiceId;
    const userId = req.user?.userId;
    
    if (!practiceId) {
      return res.status(403).json({ message: 'Not authorized to remove team members' });
    }
    
    // Check that the user exists and belongs to the practice
    const user = await prisma.user.findFirst({
      where: {
        id,
        practiceId
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Team member not found' });
    }
    
    // Cannot remove self
    if (id === userId) {
      return res.status(403).json({ message: 'Cannot remove yourself' });
    }
    
    // Cannot remove practice manager
    if (user.role === 'PRACTICE_MANAGER') {
      return res.status(403).json({ message: 'Cannot remove practice manager' });
    }
    
    // Soft delete the user (mark as inactive)
    await prisma.user.update({
      where: { id },
      data: { 
        isActive: false
      }
    });
    
    res.status(200).json({ message: 'Team member removed successfully' });
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({ message: 'Error removing team member' });
  }
}; 