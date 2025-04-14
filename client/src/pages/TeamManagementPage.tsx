import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Permission } from '../utils/rolePermissions';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import TeamMemberInvite from '../components/team/TeamMemberInvite';
import TeamMemberList from '../components/team/TeamMemberList';

const TeamManagementPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState<boolean>(false);
  const [activePage, setActivePage] = useState<'team' | 'invitations'>('team');
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);

  // Check if user has permission to manage team members
  const canInviteMembers = hasPermission(Permission.INVITE_TEAM_MEMBERS);
  const canManageRoles = hasPermission(Permission.MANAGE_TEAM_ROLES);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch team members
        const response = await api.get('/team/members');
        setTeamMembers(response.data.members || []);
        
        // Fetch pending invitations if user has permission
        if (canInviteMembers) {
          const invitationsResponse = await api.get('/team/invitations');
          setPendingInvitations(invitationsResponse.data.invitations || []);
        }
      } catch (err: any) {
        console.error('Error fetching team data:', err);
        setError(err.response?.data?.message || 'Failed to load team data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeamData();
  }, [canInviteMembers]);

  const handleInviteSent = async () => {
    // Refresh invitations list after new invitation is sent
    try {
      const response = await api.get('/team/invitations');
      setPendingInvitations(response.data.invitations || []);
      setShowInviteForm(false);
    } catch (err) {
      console.error('Error refreshing invitations:', err);
    }
  };

  const handleInviteCancel = () => {
    setShowInviteForm(false);
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await api.delete(`/team/invitations/${invitationId}`);
      // Remove the canceled invitation from state
      setPendingInvitations(pendingInvitations.filter(inv => inv.id !== invitationId));
    } catch (err: any) {
      console.error('Error canceling invitation:', err);
      setError(err.response?.data?.message || 'Failed to cancel invitation. Please try again.');
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      await api.post(`/team/invitations/${invitationId}/resend`);
      // Update the invitation's "resent" timestamp
      const updatedInvitations = pendingInvitations.map(inv => {
        if (inv.id === invitationId) {
          return { ...inv, lastResent: new Date().toISOString() };
        }
        return inv;
      });
      setPendingInvitations(updatedInvitations);
    } catch (err: any) {
      console.error('Error resending invitation:', err);
      setError(err.response?.data?.message || 'Failed to resend invitation. Please try again.');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) return;
    
    try {
      await api.delete(`/team/members/${memberId}`);
      // Remove the member from state
      setTeamMembers(teamMembers.filter(member => member.id !== memberId));
    } catch (err: any) {
      console.error('Error removing team member:', err);
      setError(err.response?.data?.message || 'Failed to remove team member. Please try again.');
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      await api.put(`/team/members/${memberId}/role`, { role: newRole });
      // Update the member's role in state
      const updatedMembers = teamMembers.map(member => {
        if (member.id === memberId) {
          return { ...member, role: newRole };
        }
        return member;
      });
      setTeamMembers(updatedMembers);
    } catch (err: any) {
      console.error('Error updating team member role:', err);
      setError(err.response?.data?.message || 'Failed to update role. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Team Management</h1>
        <p className="text-gray-600">Manage your veterinary practice team members and invitations</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActivePage('team')}
            className={`mr-8 py-4 px-1 ${
              activePage === 'team'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } font-medium text-sm focus:outline-none`}
          >
            Team Members
          </button>
          {canInviteMembers && (
            <button
              onClick={() => setActivePage('invitations')}
              className={`mr-8 py-4 px-1 ${
                activePage === 'invitations'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } font-medium text-sm focus:outline-none flex items-center`}
            >
              Pending Invitations
              {pendingInvitations.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {pendingInvitations.length}
                </span>
              )}
            </button>
          )}
        </nav>
      </div>

      {/* Action buttons */}
      {canInviteMembers && activePage === 'team' && !showInviteForm && (
        <div className="mb-6">
          <button
            onClick={() => setShowInviteForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            + Invite Team Member
          </button>
        </div>
      )}

      {/* Invite form */}
      {showInviteForm && (
        <div className="mb-6">
          <TeamMemberInvite 
            onInviteSent={handleInviteSent}
            onCancel={handleInviteCancel}
          />
        </div>
      )}

      {/* Team members content */}
      {activePage === 'team' && (
        <TeamMemberList 
          members={teamMembers}
          canManageRoles={canManageRoles}
          onRemoveMember={handleRemoveMember}
          onUpdateRole={handleUpdateRole}
        />
      )}

      {/* Pending invitations content */}
      {activePage === 'invitations' && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Pending Invitations</h2>
          
          {pendingInvitations.length === 0 ? (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
              <p className="text-gray-600">No pending invitations</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invited On
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingInvitations.map((invitation) => (
                    <tr key={invitation.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invitation.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invitation.role}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invitation.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleResendInvitation(invitation.id)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Resend
                        </button>
                        <button
                          onClick={() => handleCancelInvitation(invitation.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamManagementPage; 