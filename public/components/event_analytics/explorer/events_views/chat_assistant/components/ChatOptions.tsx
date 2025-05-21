import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiText,
  EuiSpacer
} from '@elastic/eui';
import { ChatOption } from '../types';

interface ChatOptionsProps {
  options: ChatOption[];
  onOptionSelect: (option: ChatOption) => void;
}

export const ChatOptions: React.FC<ChatOptionsProps> = ({
  options,
  onOptionSelect
}) => {
  return (
    <div style={{ padding: '12px 8px' }}>
      <EuiText size="s">
        <p>What would you like to do with this log?</p>
      </EuiText>
      <EuiSpacer size="s" />
      <EuiFlexGroup direction="column" gutterSize="s">
        {options.map((option) => (
          <EuiFlexItem key={option.id} grow={false}>
            <EuiButton 
              onClick={() => onOptionSelect(option)}
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
};