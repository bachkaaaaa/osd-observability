/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiBreadcrumb,
  EuiSmallButton,
  EuiCode,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiLink,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiCompressedSelect,
  EuiSelectOption,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { ApplicationRequestType, ApplicationType } from 'common/types/application_analytics';
import { last } from 'lodash';
import React, { useState } from 'react';

interface ConfigProps {
  appId: string;
  application: ApplicationType;
  parentBreadcrumbs: EuiBreadcrumb[];
  visWithAvailability: EuiSelectOption[];
  switchToAvailability: () => void;
  updateApp: (appId: string, updateAppData: Partial<ApplicationRequestType>, type: string) => void;
}

export const Configuration = (props: ConfigProps) => {
  const { appId, application, visWithAvailability, updateApp, switchToAvailability } = props;
  const [availabilityVisId, setAvailabilityVisId] = useState(
    application.availability.availabilityVisId || ''
  );

  const onAvailabilityVisChange = (event: any) => {
    setAvailabilityVisId(event.target.value);
    updateApp(appId, { availabilityVisId: event.target.value }, 'editAvailability');
  };

  return (
    <div>
      <EuiPage>
        <EuiPageBody component="div">
          <EuiPageContent paddingSize="m">
            <EuiPageContentHeader>
              <EuiPageContentHeaderSection>
                <EuiTitle size="s">
                  <h2>Configuration details</h2>
                </EuiTitle>
              </EuiPageContentHeaderSection>
              <EuiPageContentHeaderSection>
                <EuiFlexGroup gutterSize="s">
                  <EuiFlexItem>
                    <EuiSmallButton
                      fill
                      data-test-subj="editApplicationButton"
                      onClick={() => {
                        window.location.assign(`#/edit/${appId}`);
                      }}
                    >
                      Edit
                    </EuiSmallButton>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiPageContentHeaderSection>
            </EuiPageContentHeader>
            <EuiHorizontalRule margin="m" />
            <EuiPageContentBody>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiText>
                    <h4>Log source</h4>
                  </EuiText>
                  <EuiSpacer size="m" />
                  <p>
                    <EuiCode data-test-subj="configBaseQueryCode">{application.baseQuery}</EuiCode>
                  </p>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiText>
                    <h4>Services & entities</h4>
                  </EuiText>
                  <EuiSpacer size="m" />
                  <EuiText size="m">
                    <ul aria-label="List of services and entities">
                      {application.servicesEntities.map((group) => (
                        <li key={`${decodeURI(group)}-item`}>{decodeURI(group)}</li>
                      ))}
                    </ul>
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiText>
                    <h4>Trace groups</h4>
                  </EuiText>
                  <EuiSpacer size="m" />
                  <EuiText size="m">
                    <ul aria-label="List of trace groups">
                      {application.traceGroups.map((group) => (
                        <li key={`${decodeURI(group)}-item`}>{decodeURI(group)}</li>
                      ))}
                    </ul>
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiText>
                    <h4>Availability</h4>
                  </EuiText>
                  <EuiSpacer size="m" />
                  {visWithAvailability.length > 0 ? (
                    <EuiCompressedSelect
                      options={visWithAvailability}
                      value={availabilityVisId}
                      onChange={onAvailabilityVisChange}
                    />
                  ) : (
                    <EuiLink
                      data-test-subj="setAvailabilityConfigLink"
                      onClick={() => switchToAvailability()}
                    >
                      Set Availability
                    </EuiLink>
                  )}
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPageContentBody>
          </EuiPageContent>
        </EuiPageBody>
      </EuiPage>
    </div>
  );
};
