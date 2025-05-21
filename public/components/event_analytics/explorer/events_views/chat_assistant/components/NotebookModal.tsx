import React from 'react';
import {
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
  EuiButton,
  EuiFormRow,
  EuiFieldText,
  EuiText,
  EuiSpacer
} from '@elastic/eui';

interface NotebookModalProps {
  isVisible: boolean;
  notebookTitle: string;
  setNotebookTitle: (title: string) => void;
  isSaving: boolean;
  onCancel: () => void;
  onSave: () => void;
  onDontSave: () => void;
}

export const NotebookModal: React.FC<NotebookModalProps> = ({
  isVisible,
  notebookTitle,
  setNotebookTitle,
  isSaving,
  onCancel,
  onSave,
  onDontSave
}) => {
  if (!isVisible) return null;

  return (
    <EuiModal onClose={onCancel}>
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
          onClick={onDontSave}
          disabled={isSaving}
          data-test-subj="dontSaveButton"
        >
          Don't Save
        </EuiButton>
        <EuiButton
          fill
          onClick={onSave}
          isLoading={isSaving}
          disabled={!notebookTitle.trim() || isSaving}
          data-test-subj="saveAndCloseButton"
        >
          Save and Close
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};