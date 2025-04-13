import React from 'react';
import useInstallPrompt from '../hooks/useInstallPrompt';

const InstallPWAButton: React.FC = () => {
  const { installPromptEvent, triggerInstallPrompt } = useInstallPrompt();

  if (!installPromptEvent) {
    // Don't render the button if the event hasn't been captured
    // or if the app is already installed.
    return null;
  }

  return (
    <button
      onClick={triggerInstallPrompt}
      style={{
        padding: '10px 15px',
        fontSize: '1rem',
        backgroundColor: '#5cb85c', // Green color
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        marginTop: '10px' // Example spacing
      }}
    >
      Install MyVetStudy App
    </button>
  );
};

export default InstallPWAButton; 