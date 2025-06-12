import React, { useState } from 'react';
import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { FlyoutContainers } from '../../../../common/flyout_containers';
import { useFlyoutInstance } from './hooks/useFlyoutInstance';
import { useChatMessages } from './hooks/useChatMessages';
import { useNotebookSave } from './hooks/useNotebookSave';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessages } from './components/ChatMessages';
import { ChatOptions } from './components/ChatOptions';
import { NotebookModal } from './components/NotebookModal';
import { ChatOption, SecondaryFlyoutProps } from './types';

export const SecondaryFlyout = ({
  http,
  doc,
  timeStampField,
  secondaryFlyoutOpen,
  setSecondaryFlyoutOpen,
  flyoutToggleSize,
  setFlyoutToggleSize,
}: SecondaryFlyoutProps) => {
  // State to track if options should be shown
  const [showOptions, setShowOptions] = useState(doc && Object.keys(doc).length > 0);

  // Initialize flyout instance management
  const { instanceId } = useFlyoutInstance(
    secondaryFlyoutOpen,
    () => setSecondaryFlyoutOpen(false)
  );

  // Initialize chat messages
  const {
    messages,
    messageText,
    setMessageText,
    isLoading,
    sendMessage,
    resetConversation,
    messagesEndRef,
    optionSelected,
    setOptionSelected
  } = useChatMessages(http, doc, secondaryFlyoutOpen);

  // Initialize notebook saving functionality
  const {
    isNotebookModalVisible,
    setIsNotebookModalVisible,
    notebookTitle,
    setNotebookTitle,
    isSaving,
    saveSuccess,
    saveToNotebook,
    createNotebook
  } = useNotebookSave(http, messages);

  // Predefined options for log analysis
  const predefinedOptions: ChatOption[] = [
    { id: 'explain', label: 'Explain this log', description: 'Get an explanation of what this log entry means' },
    { id: 'related', label: 'Find related logs', description: 'Search for logs related to this event' },
    { id: 'remediation', label: 'Suggest remediation', description: 'Get suggestions on how to fix the issue' },
  ];

  // Close function
  const closeFlyout = async () => {
    // Only prompt to save if there are messages AND an option was selected
    if (messages.length > 1 && optionSelected) {
      // Format current date for title
      const currentDate = new Date().toLocaleDateString();
      const suggestedTitle = `${notebookTitle} - ${currentDate}`;
      
      // Show notebook naming modal
      setNotebookTitle(suggestedTitle);
      setIsNotebookModalVisible(true);
    } else {
      // If no meaningful conversation or no option was selected, just close
      setSecondaryFlyoutOpen(false);
    }
  };

  // Toggle size
  const toggleSize = () => {
    setFlyoutToggleSize(!flyoutToggleSize);
  };

  // Handler for option selection
  const handleOptionSelect = (option: ChatOption) => {
    setOptionSelected(true);
    sendMessage(`${option.label} for the selected log data`, true);
  };

  // Don't render if we're not supposed to be open
  if (!secondaryFlyoutOpen) {
    return null;
  }

  // Render flyout header with title only (no buttons)
  const flyoutHeader = (
    <ChatHeader
      resetConversation={null}  // Pass null to hide reset button
      saveToNotebook={null}     // Pass null to hide save button
      saveSuccess={saveSuccess}
      hideButtons={true}        // Add explicit flag to hide buttons
    />
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
      <ChatMessages
        messages={messages}
        isLoading={isLoading}
        messagesEndRef={messagesEndRef}
      />
      
      {/* Options area */}
      <div style={{ 
        position: 'sticky',
        bottom: 0,
        backgroundColor: 'white',
        padding: '8px 0',
        borderTop: '1px solid #eee',
        zIndex: 100,
        marginTop: 'auto'
      }}>
        <ChatOptions
          options={predefinedOptions}
          onOptionSelect={handleOptionSelect}
        />
      </div>
    </div>
  );

  // Render flyout footer
  const flyoutFooter = (
    <EuiFlexGroup justifyContent="spaceBetween" gutterSize="m" style={{ padding: '8px 16px' }}>
      <EuiFlexItem grow={false}>
        <EuiButton 
          onClick={toggleSize} 
          data-test-subj="chatFlyout__resizeButton"
          size="s"
          style={{ minWidth: '100px' }}
        >
          {flyoutToggleSize ? 'Expand' : 'Collapse'}
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
      <NotebookModal
        isVisible={isNotebookModalVisible}
        notebookTitle={notebookTitle}
        setNotebookTitle={setNotebookTitle}
        isSaving={isSaving}
        onCancel={() => setIsNotebookModalVisible(false)}
        onSave={() => {
          createNotebook();
          setIsNotebookModalVisible(false);
          setSecondaryFlyoutOpen(false);
        }}
        onDontSave={() => {
          setIsNotebookModalVisible(false);
          setSecondaryFlyoutOpen(false);
        }}
      />
    </>
  );
};