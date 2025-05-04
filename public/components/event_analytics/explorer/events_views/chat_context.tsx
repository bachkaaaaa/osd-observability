import React, { createContext, useState, useContext, useRef } from 'react';

interface ChatContextType {
  isSecondaryFlyoutOpen: boolean;
  openSecondaryFlyout: () => void;
  closeSecondaryFlyout: () => void;
  addRowDataMessage: (doc: any) => void;
  flyoutToggleSize: boolean;
  setFlyoutToggleSize: (isLarge: boolean) => void;
  chatRef: React.RefObject<any>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isSecondaryFlyoutOpen, setIsSecondaryFlyoutOpen] = useState(false);
  const [flyoutToggleSize, setFlyoutToggleSize] = useState(true);
  
  // Reference to the chat component
  const chatRef = useRef<any>(null);
  
  const openSecondaryFlyout = () => {
    setIsSecondaryFlyoutOpen(true);
  };
  
  const closeSecondaryFlyout = () => {
    setIsSecondaryFlyoutOpen(false);
  };
  
  const addRowDataMessage = (doc: any) => {
    if (chatRef.current) {
      chatRef.current.addRowDataMessage(doc);
    }
  };
  
  return (
    <ChatContext.Provider 
      value={{ 
        isSecondaryFlyoutOpen, 
        openSecondaryFlyout, 
        closeSecondaryFlyout,
        addRowDataMessage,
        flyoutToggleSize,
        setFlyoutToggleSize,
        chatRef
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};