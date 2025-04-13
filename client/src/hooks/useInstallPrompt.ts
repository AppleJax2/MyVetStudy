import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>;
  prompt(): Promise<void>;
}

/**
 * Hook to manage the PWA installation prompt event.
 * @returns {{ installPromptEvent: BeforeInstallPromptEvent | null, triggerInstallPrompt: () => void }}
 */
const useInstallPrompt = () => {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault(); // Prevent the default browser prompt
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
      console.log('beforeinstallprompt event fired and captured.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Handle app installed event
    const handleAppInstalled = () => {
      console.log('PWA installed successfully!');
      setInstallPromptEvent(null); // Clear the event after installation
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstallPrompt = () => {
    if (!installPromptEvent) {
      console.log('Install prompt event not available.');
      return;
    }
    installPromptEvent.prompt();
    // Logic to handle user choice (accepted/dismissed) can be added here if needed
    installPromptEvent.userChoice.then((choiceResult) => {
      console.log(`User choice: ${choiceResult.outcome}`);
      setInstallPromptEvent(null); // Clear the event after prompt is shown
    });
  };

  return { installPromptEvent, triggerInstallPrompt };
};

export default useInstallPrompt; 