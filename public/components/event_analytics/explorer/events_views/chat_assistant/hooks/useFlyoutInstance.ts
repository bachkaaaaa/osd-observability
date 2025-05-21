import { useRef, useEffect } from 'react';

// Global variables for singleton pattern
let activeFlyoutInstance: string | null = null;
let closeActiveFlyoutCallback: (() => void) | null = null;

export const useFlyoutInstance = (
  isOpen: boolean,
  onClose: () => void
) => {
  // Create a unique ID for this instance
  const instanceId = useRef(`flyout-${Date.now()}`).current;
  
  useEffect(() => {
    if (isOpen) {
      if (activeFlyoutInstance && activeFlyoutInstance !== instanceId) {
        // Another flyout is already active, close it first
        console.log('Closing existing chat flyout to open a new one.');
        if (closeActiveFlyoutCallback) {
          closeActiveFlyoutCallback();
        }
        
        // Register this as the new active flyout
        activeFlyoutInstance = instanceId;
        closeActiveFlyoutCallback = onClose;
      } else {
        // Register this as the active flyout
        activeFlyoutInstance = instanceId;
        closeActiveFlyoutCallback = onClose;
      }
    }
    
    // Cleanup when component unmounts
    return () => {
      if (activeFlyoutInstance === instanceId) {
        activeFlyoutInstance = null;
        closeActiveFlyoutCallback = null;
      }
    };
  }, [isOpen, instanceId, onClose]);

  return {
    instanceId,
    isActiveInstance: activeFlyoutInstance === instanceId
  };
};