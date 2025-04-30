import React, { useState } from 'react';
import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
  EuiTitle,
  EuiFieldText,
  EuiFormRow,
} from '@elastic/eui';
import { FlyoutContainers } from '../../../common/flyout_containers';

interface SecondaryFlyoutProps {
  http: any;
  doc: any;
  timeStampField: string;
  secondaryFlyoutOpen: boolean;
  setSecondaryFlyoutOpen: (isOpen: boolean) => void;
  flyoutToggleSize: boolean;
  setFlyoutToggleSize: (isLarge: boolean) => void;
  // Add other props as needed
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
  // State for query text field
  const [queryText, setQueryText] = useState('');

  // Close function
  const closeFlyout = () => {
    setSecondaryFlyoutOpen(false);
  };

  // Toggle size
  const toggleSize = () => {
    setFlyoutToggleSize(!flyoutToggleSize);
  };

  // Handle query change
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQueryText(e.target.value);
  };

  // Submit query function
  const submitQuery = () => {
    // Here you can implement what happens when the query is submitted
    console.log('Query submitted:', queryText);
    // For example: make an API call, process the data, etc.
  };

  // Render flyout header
  const flyoutHeader = (
    <EuiTitle size="s">
      <h3>Enter Query</h3>
    </EuiTitle>
  );

  // Render simplified flyout body with text field
  const flyoutBody = (
    <>
      <EuiText>
        <h2>Hello World</h2>
        <p>Enter your query below:</p>
      </EuiText>
      <EuiSpacer size="m" />
      <EuiFormRow label="Query" fullWidth>
        <EuiFieldText
          placeholder="Type your query here..."
          value={queryText}
          onChange={handleQueryChange}
          fullWidth
          data-test-subj="secondaryFlyout__queryInput"
        />
      </EuiFormRow>
      <EuiSpacer size="m" />
      <EuiButton 
        fill 
        onClick={submitQuery} 
        data-test-subj="secondaryFlyout__submitButton"
      >
        Submit Query
      </EuiButton>
    </>
  );

  // Render flyout footer
  const flyoutFooter = (
    <EuiFlexGroup justifyContent="spaceBetween">
      <EuiFlexItem grow={false}>
        <EuiButton 
          onClick={toggleSize} 
          data-test-subj="secondaryFlyout__resizeButton"
        >
          {flyoutToggleSize ? 'Expand' : 'Collapse'}
        </EuiButton>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButton 
          onClick={closeFlyout} 
          data-test-subj="secondaryFlyout__closeButton"
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
      ariaLabel={'secondaryFlyout'}
      size={flyoutToggleSize ? 'm' : 'l'}
    />
  );
};


