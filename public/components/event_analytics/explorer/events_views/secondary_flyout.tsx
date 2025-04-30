import React, { useState, useRef, useEffect } from 'react';
import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
  EuiTitle,
  EuiFieldText,
  EuiPanel,
  EuiAvatar,
  EuiComment,
  EuiCommentList,
  EuiButtonIcon,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { FlyoutContainers } from '../../../common/flyout_containers';

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  isUser: boolean;
}

interface SecondaryFlyoutProps {
  http: any;
  doc: any;
  timeStampField: string;
  secondaryFlyoutOpen: boolean;
  setSecondaryFlyoutOpen: (isOpen: boolean) => void;
  flyoutToggleSize: boolean;
  setFlyoutToggleSize: (isLarge: boolean) => void;
}

export const SecondaryFlyout = ({
  http,
  doc,
  timeStampField,
  secondaryFlyoutOpen,
  setSecondaryFlyoutOpen,
  flyoutToggleSize,
  setFlyoutToggleSize,
}: SecondaryFlyoutProps) => {
  // State for message input
  const [messageText, setMessageText] = useState('');
  // State for all messages
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! How can I help you today?',
      timestamp: new Date(),
      isUser: false,
    },
  ]);
  // State for loading indicator
  const [isLoading, setIsLoading] = useState(false);
  
  // Reference to message container for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close function
  const closeFlyout = () => {
    setSecondaryFlyoutOpen(false);
  };

  // Toggle size
  const toggleSize = () => {
    setFlyoutToggleSize(!flyoutToggleSize);
  };

  // Handle message input change
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
  };

  // Send message function
  const sendMessage = () => {
    if (!messageText.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: messageText,
      timestamp: new Date(),
      isUser: true,
    };
    
    setMessages([...messages, userMessage]);
    setMessageText(''); // Clear input
    setIsLoading(true);
    
    // Simulate response after a short delay
    setTimeout(() => {
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        content: `I received: "${messageText}"`,
        timestamp: new Date(),
        isUser: false,
      };
      
      setMessages(prevMessages => [...prevMessages, botMessage]);
      setIsLoading(false);
    }, 1000);
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  // Render flyout header
  const flyoutHeader = (
    <EuiTitle size="s">
      <h3>Chat Assistant</h3>
    </EuiTitle>
  );

  // Render conversation panel
  const flyoutBody = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Messages container with scroll */}
      <div 
        style={{ 
          flex: '1 1 auto', 
          overflowY: 'auto',
          padding: '8px',
          marginBottom: '8px',
          background: '#f5f7fa',
          borderRadius: '4px',
          minHeight: '300px'
        }}
      >
        <EuiCommentList>
          {messages.map((message) => (
            <EuiComment
              key={message.id}
              username={message.isUser ? 'You' : 'Assistant'}
              event="said"
              timestamp={message.timestamp.toLocaleTimeString()}
              timelineIcon={
                <EuiAvatar
                  name={message.isUser ? 'You' : 'AI'}
                  size="l"
                  color={message.isUser ? '#006BB4' : '#00BFB3'}
                />
              }
              timelineAvatarAriaLabel={message.isUser ? 'You' : 'Assistant'}
              style={{
                textAlign: message.isUser ? 'right' : 'left',
                marginLeft: message.isUser ? 'auto' : '0',
                maxWidth: '80%',
              }}
            >
              <EuiPanel 
                paddingSize="s" 
                style={{ 
                  backgroundColor: message.isUser ? '#e6f7ff' : 'white',
                  border: message.isUser ? '1px solid #b3e0ff' : '1px solid #eee',
                }}
              >
                <EuiText size="s">
                  <p>{message.content}</p>
                </EuiText>
              </EuiPanel>
            </EuiComment>
          ))}
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '8px' }}>
              <EuiLoadingSpinner size="m" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </EuiCommentList>
      </div>
      
      {/* Input area */}
      <div style={{ marginTop: 'auto' }}>
        <EuiFlexGroup gutterSize="s">
          <EuiFlexItem>
            <EuiFieldText
              placeholder="Type your message here..."
              value={messageText}
              onChange={handleMessageChange}
              onKeyPress={handleKeyPress}
              fullWidth
              data-test-subj="chatFlyout__messageInput"
              aria-label="Type your message"
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonIcon
              size="m"
              color="primary"
              onClick={sendMessage}
              iconType="paperClip"
              aria-label="Send message"
              isDisabled={!messageText.trim()}
              data-test-subj="chatFlyout__sendButton"
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    </div>
  );

  // Render flyout footer
  const flyoutFooter = (
    <EuiFlexGroup justifyContent="spaceBetween">
      <EuiFlexItem grow={false}>
        <EuiButton 
          onClick={toggleSize} 
          data-test-subj="chatFlyout__resizeButton"
        >
          {flyoutToggleSize ? 'Expand' : 'Collapse'}
        </EuiButton>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButton 
          onClick={closeFlyout} 
          data-test-subj="chatFlyout__closeButton"
        >
          Close
        </EuiButton>
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  return (
    <FlyoutContainers
      closeFlyout={closeFlyout}
      flyoutHeader={flyoutHeader}
      flyoutBody={flyoutBody}
      flyoutFooter={flyoutFooter}
      ariaLabel={'chatFlyout'}
      size={flyoutToggleSize ? 'm' : 'l'}
    />
  );
};


