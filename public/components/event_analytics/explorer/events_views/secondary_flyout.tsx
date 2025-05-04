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
  EuiToolTip,
  EuiIcon,
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
  EuiFormRow,
} from '@elastic/eui';
import { FlyoutContainers } from '../../../common/flyout_containers';
import { NOTEBOOKS_API_PREFIX, CREATE_NOTE_MESSAGE } from '../../../../../common/constants/notebooks';

// Storage key for persisting conversations
const STORAGE_KEY = 'chatAssistant_conversation';

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  isUser: boolean;
}

interface ChatOption {
  id: string;
  label: string;
  description?: string;
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
  
  // State for all messages - initialize with saved data or default
  const [messages, setMessages] = useState<Message[]>([]);
  
  // State for loading indicator
  const [isLoading, setIsLoading] = useState(false);
  
  // State for save success message
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Add state for save notebook modal
  const [isNotebookModalVisible, setIsNotebookModalVisible] = useState(false);
  const [notebookTitle, setNotebookTitle] = useState('Chat Conversation');
  const [isSaving, setIsSaving] = useState(false);

  // State to track if options should be shown
  const [showOptions, setShowOptions] = useState(false);
  
  // Predefined options for log analysis
  const predefinedOptions: ChatOption[] = [
    { id: 'explain', label: 'Explain this log', description: 'Get an explanation of what this log entry means' },
    { id: 'anomaly', label: 'Detect anomalies', description: 'Check if this log contains anomalous patterns' },
    { id: 'related', label: 'Find related logs', description: 'Search for logs related to this event' },
    { id: 'remediation', label: 'Suggest remediation', description: 'Get suggestions on how to fix the issue' },
  ];
  
  // Format doc data for display
  const formatDocData = (document: any) => {
    if (!document) return '';
    const fields = Object.entries(document)
      .filter(([key, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `**${key}**: ${value}`)
      .join('\n');
    return `Selected row data:\n${fields}`;
  };
  
  // Load saved messages on component mount and add row data
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(STORAGE_KEY);
      let initialMessages: Message[] = [];
      
      if (savedMessages) {
        // Need to convert the date strings back to Date objects
        initialMessages = JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      } else {
        // Set default welcome message if no saved messages
        initialMessages = [{
          id: '1',
          content: 'Hello! How can I help you today?',
          timestamp: new Date(),
          isUser: false,
        }];
      }
      
      // Add the row data as a system message if we have document data
      if (doc && Object.keys(doc).length > 0) {
        const docMessage: Message = {
          id: `doc-${Date.now()}`,
          content: formatDocData(doc),
          timestamp: new Date(),
          isUser: false,
        };
        initialMessages.push(docMessage);
        
        // Show options when a log is selected
        setShowOptions(true);
      }
      
      setMessages(initialMessages);
    } catch (error) {
      console.error('Error loading saved messages:', error);
      // Set default if there's an error
      setMessages([{
        id: '1',
        content: 'Hello! How can I help you today?',
        timestamp: new Date(),
        isUser: false,
      }]);
    }
  }, [doc]); // Re-run when doc changes
  
  // Save messages to local storage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);
  
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
  const sendMessage = async () => {
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
    
    try {
      // Send message to dedicated chat endpoint
      const response = await http.post(`/api/observability/chat/message`, {
        body: JSON.stringify({
          message: messageText,
          logData: doc // Include the log data if available
        }),
      });
      
      // Add response to the messages
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        content: response.response || 'Sorry, I could not process this request.',
        timestamp: new Date(),
        isUser: false,
      };
      
      setMessages(prevMessages => [...prevMessages, botMessage]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };
  
  // Reset conversation
  const resetConversation = () => {
    const defaultMessage = {
      id: `reset-${Date.now()}`,
      content: 'Conversation has been reset. How can I help you today?',
      timestamp: new Date(),
      isUser: false,
    };
    
    setMessages([defaultMessage]);
  };
  
  // Updated save to notebook function - shows modal to get title
  const saveToNotebook = () => {
    // Format current date for default title
    const currentDate = new Date().toLocaleDateString();
    setNotebookTitle(`Chat Conversation - ${currentDate}`);
    setIsNotebookModalVisible(true);
  };
  
  // Function to handle actual notebook creation
  const createNotebook = async () => {
    if (!notebookTitle.trim()) {
      return; // Don't create notebook without a title
    }
    
    setIsSaving(true);
    
    try {
      // Format the conversation for the notebook content
      const markdownContent = messages.map(msg => {
        const author = msg.isUser ? '**You**' : '**Assistant**';
        const time = msg.timestamp.toLocaleString();
        return `${author} (${time}):\n\n${msg.content}\n`;
      }).join('\n---\n\n');
      
      // Create a new notebook
      const createResponse = await http.post(`${NOTEBOOKS_API_PREFIX}/note/savedNotebook`, {
        body: JSON.stringify({ name: notebookTitle }),
      });
      
      // Add a paragraph with the conversation content
      if (createResponse) {
        await http.post(`${NOTEBOOKS_API_PREFIX}/savedNotebook/paragraph`, {
          body: JSON.stringify({
            noteId: createResponse,
            paragraphIndex: 0,
            paragraphInput: `%md\n# Chat Conversation\n\n${markdownContent}`,
            inputType: 'MARKDOWN',
          }),
        });
        
        // Show success message
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        
        // Close the modal
        setIsNotebookModalVisible(false);
        
        // Provide a link to the new notebook
        console.log(`Notebook created with ID: ${createResponse}`);
      }
    } catch (error) {
      console.error('Error saving notebook:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Cancel notebook creation
  const cancelNotebookCreation = () => {
    setIsNotebookModalVisible(false);
  };
  
  // Notebook creation modal
  const notebookModal = isNotebookModalVisible ? (
    <EuiModal onClose={cancelNotebookCreation}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>Save Conversation as Notebook</EuiModalHeaderTitle>
      </EuiModalHeader>
      
      <EuiModalBody>
        <EuiText size="s">
          <p>{CREATE_NOTE_MESSAGE || 'Enter a name to describe the purpose of this notebook.'}</p>
        </EuiText>
        <EuiSpacer size="m" />
        <EuiFormRow label="Notebook Title">
          <EuiFieldText
            placeholder="Enter notebook title"
            value={notebookTitle}
            onChange={(e) => setNotebookTitle(e.target.value)}
            fullWidth
            data-test-subj="notebookTitleInput"
            isInvalid={!notebookTitle.trim()}
            disabled={isSaving}
          />
        </EuiFormRow>
      </EuiModalBody>
      
      <EuiModalFooter>
        <EuiButton
          onClick={cancelNotebookCreation}
          disabled={isSaving}
          data-test-subj="cancelNotebookCreationButton"
        >
          Cancel
        </EuiButton>
        <EuiButton
          fill
          onClick={createNotebook}
          isLoading={isSaving}
          disabled={!notebookTitle.trim() || isSaving}
          data-test-subj="createNotebookButton"
        >
          Save
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  ) : null;

  // Render flyout header with action buttons
  const flyoutHeader = (
    <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
      <EuiFlexItem grow={false}>
        <EuiFlexGroup gutterSize="s" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiToolTip content="Reset conversation">
              <EuiButtonIcon
                color="primary"
                onClick={resetConversation}
                iconType="refresh"
                aria-label="Reset conversation"
                data-test-subj="chatFlyout__resetButton"
              />
            </EuiToolTip>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiToolTip content={saveSuccess ? "Saved!" : "Save to notebook"}>
              <EuiButtonIcon
                color={saveSuccess ? "success" : "primary"}
                onClick={saveToNotebook}
                iconType={saveSuccess ? "check" : "save"}
                aria-label="Save to notebook"
                data-test-subj="chatFlyout__saveButton"
              />
            </EuiToolTip>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
      <EuiFlexItem grow={true} className="eui-textCenter">
        <EuiTitle size="m">
          <h3 style={{ 
            fontWeight: '600', 
            fontSize: '18px',
            fontFamily: 'Inter, Helvetica, Arial, sans-serif' 
          }}>
            Chat Assistant
          </h3>
        </EuiTitle>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>{/* Empty space to balance layout */}</EuiFlexItem>
    </EuiFlexGroup>
  );

  // Function to render message content with formatting
  const renderMessageContent = (content: string) => {
    // Check if this is a data message (starts with "Selected row data:")
    if (content.startsWith('Selected row data:')) {
      return (
        <div>
          <p><strong>Selected row data:</strong></p>
          <div style={{ maxHeight: '300px', overflowY: 'auto', background: '#f0f0f0', padding: '8px', borderRadius: '4px' }}>
            {content.replace('Selected row data:\n', '').split('\n').map((line, index) => {
              // Split each line by the first colon to separate key and value
              const [key, ...valueParts] = line.split(':');
              const value = valueParts.join(':'); // Rejoin in case the value itself contains colons
              
              if (key && key.startsWith('**') && key.endsWith('**')) {
                const cleanKey = key.replace(/\*\*/g, '');
                return (
                  <div key={index} style={{ display: 'flex', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 'bold', minWidth: '120px', marginRight: '8px' }}>
                      {cleanKey}:
                    </div>
                    <div style={{ wordBreak: 'break-all' }}>
                      {value.trim()}
                    </div>
                  </div>
                );
              }
              
              return <div key={index}>{line}</div>;
            })}
          </div>
        </div>
      );
    }
    
    // Regular message content
    return <p>{content}</p>;
  };

  // New function to handle option selection
  const handleOptionSelect = async (option: ChatOption) => {
    // Prepare user message that combines log data and option
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: `${option.label} for the selected log data`,
      timestamp: new Date(),
      isUser: true,
    };
    
    setMessages([...messages, userMessage]);
    setIsLoading(true);
    setShowOptions(false); // Hide options after selection
    
    try {
      // Send message with both log data and selected option
      const response = await http.post(`/api/observability/chat/message`, {
        body: JSON.stringify({
          message: option.label,
          optionId: option.id,
          logData: doc // Include the log data
        }),
      });
      
      // Add response to the messages
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        content: response.response || 'Sorry, I could not process this request.',
        timestamp: new Date(),
        isUser: false,
      };
      
      setMessages(prevMessages => [...prevMessages, botMessage]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: 'Sorry, there was an error processing your request.',
        timestamp: new Date(),
        isUser: false,
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
      setIsLoading(false);
    }
  };

  // Create options component
  const renderOptions = () => (
    <div style={{ padding: '12px 8px' }}>
      <EuiText size="s">
        <p>What would you like to do with this log?</p>
      </EuiText>
      <EuiSpacer size="s" />
      <EuiFlexGroup direction="column" gutterSize="s">
        {predefinedOptions.map((option) => (
          <EuiFlexItem key={option.id} grow={false}>
            <EuiButton 
              onClick={() => handleOptionSelect(option)}
              fill
              size="s"
              style={{ 
                borderRadius: '24px',
                width: '100%',
                textAlign: 'left',
                paddingLeft: '16px',
                paddingRight: '16px'
              }}
              data-test-subj={`chatOption__${option.id}`}
            >
              {option.label}
            </EuiButton>
            {option.description && (
              <EuiText size="xs" color="subdued" style={{ marginTop: '4px', marginLeft: '8px', marginBottom: '4px' }}>
                {option.description}
              </EuiText>
            )}
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
    </div>
  );

  // Update the input area in flyoutBody to conditionally show options or text input
  const inputArea = showOptions ? (
    <div style={{ 
      position: 'sticky',
      bottom: 0,
      backgroundColor: 'white',
      padding: '8px 0',
      borderTop: '1px solid #eee',
      zIndex: 100,
      marginTop: 'auto'
    }}>
      {renderOptions()}
    </div>
  ) : (
    <div style={{ 
      position: 'sticky',
      bottom: 0,
      backgroundColor: 'white',
      padding: '8px 0',
      borderTop: '1px solid #eee',
      zIndex: 100,
      marginTop: 'auto'
    }}>
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
  );

  // Render conversation panel
  const flyoutBody = (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      position: 'relative', 
      overflow: 'hidden'
    }}>
      {/* Messages container with scroll */}
      <div 
        style={{ 
          flex: '1 1 auto', 
          overflowY: 'auto',
          padding: '8px',
          marginBottom: '8px',
          background: '#f5f7fa',
          borderRadius: '4px',
          minHeight: '300px',
          maxHeight: 'calc(100% - 60px)',
          paddingBottom: '16px'
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
                  {renderMessageContent(message.content)}
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
      
      {/* Input area with conditional rendering */}
      {inputArea}
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
    <>
      <FlyoutContainers
        closeFlyout={closeFlyout}
        flyoutHeader={flyoutHeader}
        flyoutBody={flyoutBody}
        flyoutFooter={flyoutFooter}
        ariaLabel={'chatFlyout'}
        size={flyoutToggleSize ? 'm' : 'l'}
      />
      {notebookModal}
    </>
  );
};