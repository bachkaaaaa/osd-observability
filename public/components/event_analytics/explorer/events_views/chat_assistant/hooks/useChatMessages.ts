import { useState, useEffect, useRef } from 'react';
import { Message } from '../types';

// Storage key for persisting conversations
const STORAGE_KEY = 'chatAssistant_conversation';

export const useChatMessages = (
  http: any, 
  doc: any,
  isOpen: boolean
) => {
  // State for all messages
  const [messages, setMessages] = useState<Message[]>([]);
  // State for loading indicator
  const [isLoading, setIsLoading] = useState(false);
  // State for message input
  const [messageText, setMessageText] = useState('');
  // State variable to track if options were selected
  const [optionSelected, setOptionSelected] = useState(false);
  // Reference to message container for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    if (isOpen) {
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
  }, [isOpen, doc]);

  // Save messages to local storage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message function
  const sendMessage = async (message = messageText, isUserOption = false) => {
    if (!message.trim() && !isUserOption) return;
    
    const textToSend = isUserOption ? message : messageText;
    
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: textToSend,
      timestamp: new Date(),
      isUser: true,
    };
    
    setMessages([...messages, userMessage]);
    if (!isUserOption) setMessageText(''); // Clear input only if it's not an option
    setIsLoading(true);
    
    try {
      // Format the log data into a string if available
      const logDataString = doc ? JSON.stringify(doc, null, 2) : '';
      
      

      // Send message to dedicated chat endpoint with combined message
      const response = await http.post(`/api/observability/chat/message`, {
        body: JSON.stringify({
          log: logDataString,
          query: textToSend
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
      
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: 'Sorry, there was an error processing your request.',
        timestamp: new Date(),
        isUser: false,
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
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

  return {
    messages,
    setMessages,
    messageText,
    setMessageText,
    isLoading,
    sendMessage,
    resetConversation,
    messagesEndRef,
    optionSelected,
    setOptionSelected
  };
};