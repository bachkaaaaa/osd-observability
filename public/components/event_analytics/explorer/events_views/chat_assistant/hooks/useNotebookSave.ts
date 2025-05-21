import { useState } from 'react';
import { Message } from '../types';
import { NOTEBOOKS_API_PREFIX } from '../../../../../../../common/constants/notebooks';

export const useNotebookSave = (http: any, messages: Message[]) => {
  const [isNotebookModalVisible, setIsNotebookModalVisible] = useState(false);
  const [notebookTitle, setNotebookTitle] = useState('Chat Conversation');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  return {
    isNotebookModalVisible,
    setIsNotebookModalVisible,
    notebookTitle,
    setNotebookTitle,
    isSaving,
    saveSuccess,
    saveToNotebook,
    createNotebook
  };
};