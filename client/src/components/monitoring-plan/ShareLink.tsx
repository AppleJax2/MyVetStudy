import React, { useState } from 'react';
import { FaShareAlt, FaCheck, FaCopy, FaTimes, FaSync } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface ShareLinkProps {
  monitoringPlanId: string;
  shareableUrl: string | null;
  onLinkGenerated: (url: string) => void;
}

const ShareLink: React.FC<ShareLinkProps> = ({ 
  monitoringPlanId, 
  shareableUrl, 
  onLinkGenerated 
}) => {
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLinkSettings, setShowLinkSettings] = useState(false);
  const [expirationDays, setExpirationDays] = useState(30);
  const [isPublic, setIsPublic] = useState(true);

  const generateShareableLink = async () => {
    if (!monitoringPlanId) {
      toast.error('Monitoring plan ID is required to generate a shareable link.');
      return;
    }
    
    try {
      setGenerating(true);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/monitoring-plans/${monitoringPlanId}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          expirationDays,
          isPublic
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate shareable link');
      }
      
      const data = await response.json();
      onLinkGenerated(data.shareableLink);
      toast.success('Shareable link generated successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to generate shareable link');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (shareableUrl) {
      navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      
      // Reset copied state after 3 seconds
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const revokeShareableLink = async () => {
    if (!monitoringPlanId) return;
    
    if (!confirm('Are you sure you want to revoke this shareable link? Anyone using the current link will no longer be able to access this monitoring plan.')) {
      return;
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/monitoring-plans/${monitoringPlanId}/share`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to revoke shareable link');
      }
      
      onLinkGenerated('');
      toast.success('Shareable link revoked successfully');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to revoke shareable link');
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <FaShareAlt className="mr-2 text-blue-500" /> Share Monitoring Plan
          </h3>
          {!shareableUrl && (
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-800"
              onClick={() => setShowLinkSettings(!showLinkSettings)}
            >
              {showLinkSettings ? 'Hide Settings' : 'Show Settings'}
            </button>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Generate a link to share this monitoring plan with others.
        </p>
      </div>
      
      <div className="px-4 py-5 sm:p-6">
        {!shareableUrl ? (
          <div>
            {showLinkSettings && (
              <div className="mb-4 space-y-4">
                <div>
                  <label htmlFor="expiration-days" className="block text-sm font-medium text-gray-700">
                    Link Expiration
                  </label>
                  <select
                    id="expiration-days"
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(parseInt(e.target.value))}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value={7}>7 days</option>
                    <option value={30}>30 days</option>
                    <option value={90}>90 days</option>
                    <option value={365}>1 year</option>
                    <option value={0}>Never expires</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is-public"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is-public" className="ml-2 block text-sm text-gray-700">
                    Allow access without authentication
                  </label>
                </div>
                
                <p className="text-xs text-gray-500">
                  When enabled, anyone with the link can view this monitoring plan without logging in.
                  Disable this option if the plan contains sensitive information.
                </p>
              </div>
            )}
            
            <button
              type="button"
              onClick={generateShareableLink}
              disabled={generating}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {generating ? (
                <>
                  <FaSync className="animate-spin mr-2" /> Generating...
                </>
              ) : (
                <>
                  <FaShareAlt className="mr-2" /> Generate Shareable Link
                </>
              )}
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center mb-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={shareableUrl}
                  readOnly
                  className="block w-full pr-12 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {copied ? <FaCheck className="text-green-500" /> : <FaCopy />}
                </button>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={copyToClipboard}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {copied ? (
                  <>
                    <FaCheck className="mr-2 text-green-500" /> Copied!
                  </>
                ) : (
                  <>
                    <FaCopy className="mr-2" /> Copy Link
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={generateShareableLink}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaSync className={`mr-2 ${generating ? 'animate-spin' : ''}`} /> Regenerate
              </button>
              
              <button
                type="button"
                onClick={revokeShareableLink}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FaTimes className="mr-2" /> Revoke Link
              </button>
            </div>
            
            <p className="mt-3 text-sm text-gray-500">
              Share this link with anyone who needs access to this monitoring plan.
              {expirationDays > 0 && ` This link will expire in ${expirationDays} days.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareLink; 