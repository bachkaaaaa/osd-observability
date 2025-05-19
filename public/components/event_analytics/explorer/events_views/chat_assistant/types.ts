import { HttpStart } from '../../../../../../../src/core/public';

export interface Message {
  id: string;
  content: string;
  timestamp: Date;
  isUser: boolean;
}

export interface ChatOption {
  id: string;
  label: string;
  description?: string;
}

export interface SecondaryFlyoutProps {
  http: HttpStart;
  doc: any;
  timeStampField: string;
  secondaryFlyoutOpen: boolean;
  setSecondaryFlyoutOpen: (isOpen: boolean) => void;
  flyoutToggleSize: boolean;
  setFlyoutToggleSize: (isLarge: boolean) => void;
}