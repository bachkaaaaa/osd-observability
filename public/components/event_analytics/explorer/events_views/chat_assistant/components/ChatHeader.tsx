import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiButtonIcon,
  EuiToolTip
} from '@elastic/eui';

interface ChatHeaderProps {
  resetConversation: () => void;
  saveToNotebook: () => void;
  saveSuccess: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  resetConversation,
  saveToNotebook,
  saveSuccess
}) => {
  return (
    <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
      <EuiFlexItem grow={false}>
        <EuiFlexGroup gutterSize="s" responsive={false}>
          <EuiFlexItem grow={false}>
            
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
           
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
};