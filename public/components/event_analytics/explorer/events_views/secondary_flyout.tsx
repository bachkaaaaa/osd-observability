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
import ReactMarkdown from 'react-markdown';
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

// Add these at the top of your file, outside any component
let activeFlyoutInstance: string | null = null;
let closeActiveFlyoutCallback: (() => void) | null = null;

export const SecondaryFlyout = ({
  http,
  doc,
  timeStampField,
  secondaryFlyoutOpen,
  setSecondaryFlyoutOpen,
  flyoutToggleSize,
  setFlyoutToggleSize,
}: SecondaryFlyoutProps) => {
  // Create a unique ID for this instance
  const instanceId = useRef(`flyout-${Date.now()}`).current;
  
  // Check if we should display this instance when mounting/updating
  useEffect(() => {
    if (secondaryFlyoutOpen) {
      if (activeFlyoutInstance && activeFlyoutInstance !== instanceId) {
        // Another flyout is already active, close it first
        console.log('Closing existing chat flyout to open a new one.');
        if (closeActiveFlyoutCallback) {
          closeActiveFlyoutCallback();
        }
        
        // Register this as the new active flyout
        activeFlyoutInstance = instanceId;
        closeActiveFlyoutCallback = () => {
          // Simple close without saving
          setSecondaryFlyoutOpen(false);
        };
      } else {
        // Register this as the active flyout
        activeFlyoutInstance = instanceId;
        closeActiveFlyoutCallback = () => {
          // Simple close without saving
          setSecondaryFlyoutOpen(false);
        };
      }
    }
    
    // Cleanup when component unmounts
    return () => {
      if (activeFlyoutInstance === instanceId) {
        activeFlyoutInstance = null;
        closeActiveFlyoutCallback = null;
      }
    };
  }, [secondaryFlyoutOpen, instanceId, setSecondaryFlyoutOpen]);

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
  
  // Add state for closing confirmation
  const [isClosingConfirmOpen, setIsClosingConfirmOpen] = useState(false);
  
  // Add state variable near your other state declarations
  const [optionSelected, setOptionSelected] = useState(false);

  // Predefined options for log analysis
  const predefinedOptions: ChatOption[] = [
    { id: 'explain', label: 'Explain this log', description: 'Get an explanation of what this log entry means' },
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
  
  // Load fresh messages when flyout opens and add row data
  useEffect(() => {
    // Only initialize messages when the flyout is opened
    if (secondaryFlyoutOpen) {
      try {
        // Always start with a fresh welcome message
        let initialMessages: Message[] = [{
          id: `welcome-${Date.now()}`,
          content: 'Hello! How can I help you today?',
          timestamp: new Date(),
          isUser: false,
        }];
        
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
        
        // Reset the option selected state
        setOptionSelected(false);
        
        // Set fresh messages
        setMessages(initialMessages);
      } catch (error) {
        console.error('Error initializing messages:', error);
        // Set default if there's an error
        setMessages([{
          id: `error-${Date.now()}`,
          content: 'Hello! How can I help you today?',
          timestamp: new Date(),
          isUser: false,
        }]);
      }
    }
  }, [secondaryFlyoutOpen, doc]); // Re-run when flyout opens or doc changes
  
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
  const closeFlyout = async () => {
    // First clear the active instance reference
    if (activeFlyoutInstance === instanceId) {
      activeFlyoutInstance = null;
      closeActiveFlyoutCallback = null;
    }
    
    // Only prompt to save if there are messages AND an option was selected
    if (messages.length > 1 && optionSelected) {
      // Format current date for title
      const currentDate = new Date().toLocaleDateString();
      const conversationTitle = getConversationTitle();
      const suggestedTitle = `${conversationTitle} - ${currentDate}`;
      
      // Show notebook naming modal instead of auto-saving
      setNotebookTitle(suggestedTitle);
      setIsNotebookModalVisible(true);
    } else {
      // If no meaningful conversation or no option was selected, just close without saving
      setSecondaryFlyoutOpen(false);
    }
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
      // Format the log data into a string if available
      const logDataString = doc ? JSON.stringify(doc, null, 2) : '';
      
      // Combine user message and log data into a single message
      const combinedMessage = logDataString 
        ? `${messageText}\n\nLog Data:\n${logDataString}`
        : messageText;
      // Send message to dedicated chat endpoint with combined message
      const response = await http.post(`/api/observability/chat/message`, {
        body: JSON.stringify({
          message: combinedMessage
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
  
  // Function to get the first three words from user messages
  const getConversationTitle = () => {
    // Find the first user message
    const firstUserMessage = messages.find(msg => msg.isUser);
    
    if (firstUserMessage) {
      // Get first three words
      const words = firstUserMessage.content.split(' ').filter(word => word.trim().length > 0);
      const firstThreeWords = words.slice(0, 3).join(' ');
      
      if (firstThreeWords) {
        return firstThreeWords;
      }
    }
    
    // Default if no user message or not enough words
    return 'Chat Conversation';
  };
  
  // Updated save to notebook function - can skip modal if specified
  const saveToNotebook = (skipModal = false) => {
    // Format current date for default title
    const currentDate = new Date().toLocaleDateString();
    const conversationTitle = getConversationTitle();
    const suggestedTitle = `${conversationTitle} - ${currentDate}`;
    
    setNotebookTitle(suggestedTitle);
    
    if (skipModal) {
      // Save directly without showing the modal
      createNotebook(suggestedTitle);
    } else {
      // Show the modal for user to edit the title
      setIsNotebookModalVisible(true);
    }
  };
  
  // Function to handle actual notebook creation - accepts optional title parameter
  const createNotebook = async (title?: string) => {
    // Use provided title or the one from state
    const finalTitle = title || notebookTitle;
    
    if (!finalTitle.trim()) {
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
        body: JSON.stringify({ name: finalTitle }),
      });
      
      // Add a paragraph with the conversation content
      if (createResponse) {
        await http.post(`${NOTEBOOKS_API_PREFIX}/savedNotebook/paragraph`, {
          body: JSON.stringify({
            noteId: createResponse,
            paragraphIndex: 0,
            paragraphInput: `%md\n# ${finalTitle}\n\n${markdownContent}`,
            inputType: 'MARKDOWN',
          }),
        });
        
        // Show success message
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        
        // Close the modal if it's open
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
    // Don't close the flyout when just canceling the modal
  };
  
  // Notebook creation modal
  const notebookModal = isNotebookModalVisible ? (
    <EuiModal onClose={cancelNotebookCreation}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>Save Conversation as Notebook</EuiModalHeaderTitle>
      </EuiModalHeader>
      
      <EuiModalBody>
        <EuiText size="s">
          <p>Would you like to save this log analysis conversation as a notebook?</p>
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
          onClick={() => {
            setIsNotebookModalVisible(false);
            setSecondaryFlyoutOpen(false);
          }}
          disabled={isSaving}
          data-test-subj="dontSaveButton"
        >
          Don't Save
        </EuiButton>
        <EuiButton
          fill
          onClick={() => {
            createNotebook();
            setIsNotebookModalVisible(false);
            setSecondaryFlyoutOpen(false);
          }}
          isLoading={isSaving}
          disabled={!notebookTitle.trim() || isSaving}
          data-test-subj="saveAndCloseButton"
        >
          Save and Close
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
    // First ensure content is a string
    if (typeof content !== 'string') {
      console.warn('Expected string content but received:', content);
      return <p>Unable to display content (invalid format)</p>;
    }
  
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
              
              if (key && key.includes('**')) {
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
    
    // Render message content as markdown for bot responses
    return (
      <ReactMarkdown
        className="markdown-body"
        components={{
          h1: ({ node, ...props }) => <h1 {...props} style={{ fontSize: '24px', fontWeight: 'bold' }} />,
          h2: ({ node, ...props }) => <h2 {...props} style={{ fontSize: '20px', fontWeight: 'bold' }} />,
          h3: ({ node, ...props }) => <h3 {...props} style={{ fontSize: '18px', fontWeight: 'bold' }} />,
          p: ({ node, ...props }) => <p {...props} style={{ marginBottom: '8px' }} />,
        } as any}
      >
        {content}
      </ReactMarkdown>
    );
  };

  // New function to handle option selection
  const handleOptionSelect = async (option: ChatOption) => {
    // Set the flag to indicate an option was selected
    setOptionSelected(true);
    
    // Prepare user message that combines log data and option
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: `${option.label} for the selected log data`,
      timestamp: new Date(),
      isUser: true,
    };
    
    setMessages([...messages, userMessage]);
    setIsLoading(true);
    
    try {
      // Format the log data into a string if available
     const logDataString = doc ? JSON.stringify(doc, null, 2) : '';
      //console .log('Log data:', logDataString);
      console .log(doc);
      // Combine option label and log data into a single message
      
      
      // Send message to dedicated chat endpoint with combined message  
      const response = await http.post(`/api/observability/chat/message`, {
        body: JSON.stringify({
          log: logDataString,
          query: option.label,
        }),
      });
      
      console.log(response);

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

  // New handler for confirming save to notebook - now directly saves
  const handleCloseWithSave = async () => {
    await saveToNotebook(true); // Pass true to skip the modal and save directly
    setIsClosingConfirmOpen(false);
    setSecondaryFlyoutOpen(false);
  };
  
  // New handler for closing without saving
  const handleCloseWithoutSave = () => {
    setIsClosingConfirmOpen(false);
    setSecondaryFlyoutOpen(false);
  };
  
  // Remove or comment out the closing confirmation modal since we're not using it anymore
  // const closingConfirmModal = isClosingConfirmOpen ? (
  //   ...
  // ) : null;
  
  // Replace the inputArea with only options
  const inputArea = (
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
  );

  // Don't render if we're not supposed to be open
  if (!secondaryFlyoutOpen) {
    return null;
  }

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