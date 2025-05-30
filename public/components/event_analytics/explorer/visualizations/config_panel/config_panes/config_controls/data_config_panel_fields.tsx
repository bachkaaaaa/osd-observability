/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { Fragment } from 'react';
import {
  EuiSmallButtonIcon,
  EuiIcon,
  EuiLink,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
  EuiToolTip,
  EuiCompressedFormRow,
  EuiFormLabel,
} from '@elastic/eui';
import { isArray, isEmpty, lowerCase } from 'lodash';
import {
  AGGREGATIONS,
  CUSTOM_LABEL,
  GROUPBY,
  SPAN,
  DATA_CONFIG_HINTS_INFO,
} from '../../../../../../../../common/constants/explorer';
import { VIS_CHART_TYPES } from '../../../../../../../../common/constants/shared';
import {
  ConfigListEntry,
  DataConfigPanelFieldProps,
} from '../../../../../../../../common/types/explorer';
import { removeBacktick } from '../../../../../../../../common/utils';

const HIDE_ADD_BUTTON_VIZ_TYPES = [
  VIS_CHART_TYPES.HeatMap,
  VIS_CHART_TYPES.Line,
  VIS_CHART_TYPES.Scatter,
  VIS_CHART_TYPES.Pie,
];

export const DataConfigPanelFields = ({
  list,
  dimensionSpan,
  sectionName,
  visType,
  addButtonText,
  handleServiceAdd,
  handleServiceRemove,
  handleServiceEdit,
}: DataConfigPanelFieldProps) => {
  const isAggregation = sectionName === AGGREGATIONS;

  // The function hides the click to add button for visualizations included in the const HIDE_ADD_BUTTON_VIZ_TYPES
  const hideClickToAddButton = (name: string) => {
    // returns false when HIDE_ADD_BUTTON_VIZ_TYPES visualizations are not matching with visType.
    if (!isArray(list) || !HIDE_ADD_BUTTON_VIZ_TYPES.includes(visType)) return false;
    // condition for heatmap on the basis of section name
    if (visType === VIS_CHART_TYPES.HeatMap)
      return name === AGGREGATIONS ? list.length >= 1 : list.length >= 2;
    // condition for line and scatter for dimensions section.
    return name === GROUPBY && (list.length >= 1 || !isEmpty(timeField));
  };

  const { time_field: timeField, unit, interval } = dimensionSpan;

  const tooltipIcon = <EuiIcon type="iInCircle" color="text" size="m" />;
  const crossIcon = (index: number, configName: string) => (
    <EuiSmallButtonIcon
      color="subdued"
      iconType="cross"
      aria-label="clear-field"
      iconSize="s"
      onClick={() => handleServiceRemove(index, configName)}
      data-test-subj="viz-config-delete-btn"
    />
  );

  const infoToolTip = (iconToDisplay: JSX.Element, content: string) => (
    <EuiToolTip
      position="right"
      content={content}
      delay="regular"
      anchorClassName="eui-textTruncate"
    >
      {iconToDisplay}
    </EuiToolTip>
  );

  return (
    <EuiCompressedFormRow>
      <>
        <div style={{ display: 'flex' }}>
          <EuiFormLabel className="panel_title">{sectionName}</EuiFormLabel>
          {infoToolTip(tooltipIcon, DATA_CONFIG_HINTS_INFO[`${sectionName}`])}
        </div>
        <EuiSpacer size="xs" />
        <div
          className={'panelItem_box'}
          data-test-subj={`vizConfigSection-${lowerCase(sectionName)}`}
        >
          {sectionName === GROUPBY && dimensionSpan && !isEmpty(timeField) && (
            <EuiPanel
              paddingSize="s"
              className="panelItem_button"
              data-test-subj="viz-config-section"
            >
              <EuiText size="s" className="field_text">
                <EuiLink
                  role="button"
                  tabIndex={0}
                  onClick={() => handleServiceEdit(list.length - 1, GROUPBY, true)}
                  data-test-subj="viz-config-add-btn"
                >
                  {`${SPAN}(${timeField[0]?.name}, ${interval} ${unit[0]?.value})`}
                </EuiLink>
              </EuiText>
              {crossIcon(-1, SPAN)}
            </EuiPanel>
          )}
          {isArray(list) &&
            list.map((obj: ConfigListEntry, index: number) => (
              <Fragment key={index}>
                <EuiPanel
                  paddingSize="s"
                  className="panelItem_button"
                  data-test-subj="viz-config-section"
                >
                  <EuiText size="s" className="field_text">
                    <EuiLink
                      role="button"
                      tabIndex={0}
                      onClick={() => handleServiceEdit(index, sectionName, false)}
                      data-test-subj="viz-config-add-btn"
                    >
                      {removeBacktick(
                        obj[CUSTOM_LABEL] || `${isAggregation ? obj.aggregation : ''} ${obj.label}`
                      )}
                    </EuiLink>
                  </EuiText>
                  {isAggregation
                    ? infoToolTip(
                        crossIcon(index, sectionName),
                        DATA_CONFIG_HINTS_INFO[AGGREGATIONS]
                      )
                    : crossIcon(index, sectionName)}
                </EuiPanel>
              </Fragment>
            ))}
          {!hideClickToAddButton(sectionName) && (
            <EuiPanel className="panelItem_button" data-test-subj="viz-config-section" grow>
              <EuiText size="s">{addButtonText}</EuiText>
              <EuiSmallButtonIcon
                iconType="plusInCircle"
                aria-label="add-field"
                iconSize="s"
                color="primary"
                onClick={() => handleServiceAdd(sectionName)}
                data-test-subj="viz-config-add-btn"
              />
            </EuiPanel>
          )}
        </div>
      </>
    </EuiCompressedFormRow>
  );
};
