import React, { useState } from 'react';
import { FaLink, FaCopy, FaEnvelope, FaQrcode, FaInfoCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import QRCode from 'qrcode.react';

interface ShareableLinkGeneratorProps {
  monitoringPlanId?: string;
  shareableUrl: string;
  isEnabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  onGenerateLink: () => Promise<void>;
}

const ShareableLinkGenerator: React.FC<ShareableLinkGeneratorProps> = ({
  monitoringPlanId,
  shareableUrl,
  isEnabled,
  onToggleEnabled,
  onGenerateLink
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  
  // Generate a new link
  const handleGenerateLink = async () => {
    if (!monitoringPlanId) {
      toast.error('Please save the monitoring plan first to generate a shareable link.');
      return;
    }
    
    try {
      setIsGenerating(true);
      await onGenerateLink();
      toast.success('Shareable link generated successfully!');
    } catch (error) {
      console.error('Error generating link:', error);
      toast.error('Failed to generate shareable link. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Copy link to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareableUrl);
    toast.success('Link copied to clipboard!');
  };
  
  // Send link via email
  const sendViaEmail = () => {
    const subject = encodeURIComponent('Pet Health Monitoring Plan');
    const body = encodeURIComponent(`I've shared a pet health monitoring plan with you. You can access it here: ${shareableUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };
  
  // Toggle QR code visibility
  const toggleQRCode = () => {
    setShowQRCode(!showQRCode);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="shareableLink"
            checked={isEnabled}
            onChange={(e) => onToggleEnabled(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="shareableLink" className="text-sm text-gray-700 font-medium">
            Create shareable link for this monitoring plan
          </label>
        </div>
        
        {isEnabled && !shareableUrl && (
          <button
            type="button"
            onClick={handleGenerateLink}
            disabled={isGenerating || !monitoringPlanId}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <FaLink className="mr-2" />
                Generate Link
              </>
            )}
          </button>
        )}
      </div>
      
      {/* Info about sharing */}
      {isEnabled && (
        <div className="flex items-start space-x-2 text-xs text-gray-500">
          <FaInfoCircle className="flex-shrink-0 mt-0.5 text-gray-400" />
          <p>
            Shareable links allow anyone with the link to view this monitoring plan and its data.
            No login is required to access shared plans. Disable this feature at any time to revoke access.
          </p>
        </div>
      )}
      
      {/* Display shareable link if available */}
      {isEnabled && shareableUrl && (
        <div className="space-y-3">
          <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:items-center">
            <div className="grow">
              <div className="flex items-center w-full">
                <input
                  type="text"
                  readOnly
                  value={shareableUrl}
                  className="w-full rounded-l-md border-gray-300 bg-gray-50 text-sm"
                />
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  <FaCopy />
                </button>
              </div>
            </div>
            
            <div className="flex space-x-2 md:ml-2">
              <button
                type="button"
                onClick={sendViaEmail}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                title="Send via email"
              >
                <FaEnvelope />
              </button>
              <button
                type="button"
                onClick={toggleQRCode}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                title="Show QR code"
              >
                <FaQrcode />
              </button>
              <button
                type="button"
                onClick={handleGenerateLink}
                disabled={isGenerating}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                title="Generate new link"
              >
                <FaLink />
              </button>
            </div>
          </div>
          
          {/* QR Code */}
          {showQRCode && (
            <div className="flex justify-center p-4 bg-white border rounded-md">
              <QRCode value={shareableUrl} size={200} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShareableLinkGenerator; 