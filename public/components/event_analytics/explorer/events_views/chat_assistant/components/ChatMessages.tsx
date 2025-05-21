import React from 'react';
import {
  EuiCommentList,
  EuiComment,
  EuiAvatar,
  EuiPanel,
  EuiText,
  EuiLoadingSpinner
} from '@elastic/eui';
import { Message } from '../types';
import { MessageRenderer } from './MessageRenderer';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isLoading,
  messagesEndRef
}) => {
  return (
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
                <MessageRenderer content={message.content} />
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
  );
};