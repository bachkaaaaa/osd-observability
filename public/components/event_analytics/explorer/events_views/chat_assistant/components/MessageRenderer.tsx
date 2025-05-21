import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MessageRendererProps {
  content: string;
}

export const MessageRenderer: React.FC<MessageRendererProps> = ({ content }) => {
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