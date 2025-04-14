import React from 'react';
import { UserRole } from '../../types/auth';

interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status?: string;
  lastActive?: string;
}

interface TeamMemberListProps {
  members: TeamMember[];
  canManageRoles: boolean;
  onRemoveMember: (memberId: string) => void;
  onUpdateRole: (memberId: string, newRole: string) => void;
}

// Map of roles for dropdown selection
const roleOptions = [
  { value: UserRole.VETERINARIAN, label: 'Veterinarian' },
  { value: UserRole.VET_TECHNICIAN, label: 'Vet Technician' },
  { value: UserRole.VET_ASSISTANT, label: 'Vet Assistant' },
  { value: UserRole.RECEPTIONIST, label: 'Receptionist' }
];

// Function to get role label from value
const getRoleLabel = (role: UserRole): string => {
  const option = roleOptions.find(opt => opt.value === role);
  return option ? option.label : role;
};

const TeamMemberList: React.FC<TeamMemberListProps> = ({
  members,
  canManageRoles,
  onRemoveMember,
  onUpdateRole
}) => {
  if (members.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
        <p className="text-gray-600">No team members found</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Active
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {members.map((member) => (
            <tr key={member.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-800 font-medium text-sm">
                      {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {member.firstName} {member.lastName}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {member.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {canManageRoles && member.role !== UserRole.PRACTICE_MANAGER ? (
                  <select
                    value={member.role}
                    onChange={(e) => onUpdateRole(member.id, e.target.value)}
                    className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    {roleOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={`${member.role === UserRole.PRACTICE_MANAGER ? 'text-purple-800' : ''}`}>
                    {getRoleLabel(member.role)}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  {member.status || 'Active'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {member.lastActive ? new Date(member.lastActive).toLocaleDateString() : 'Never'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {member.role !== UserRole.PRACTICE_MANAGER && (
                  <button
                    onClick={() => onRemoveMember(member.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Remove
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TeamMemberList; 