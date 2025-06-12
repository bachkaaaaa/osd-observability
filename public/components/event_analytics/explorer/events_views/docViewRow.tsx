/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import React, { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { toPairs, uniqueId, has, forEach, isEqual } from 'lodash';
import { EuiSmallButtonIcon, EuiLink } from '@elastic/eui';
import { useEffect } from 'react';
import { IExplorerFields, IField } from '../../../../../common/types/explorer';
import { DocFlyout } from './doc_flyout';
import { HttpStart } from '../../../../../../../src/core/public';
import {
  OTEL_TRACE_ID,
  DATE_PICKER_FORMAT,
  JAEGER_TRACE_ID,
} from '../../../../../common/constants/explorer';
import { SurroundingFlyout } from './surrounding_flyout';
import PPLService from '../../../../services/requests/ppl';
import { isValidTraceId } from '../../utils';
import { SecondaryFlyout } from './chat_assistant/secondary_flyout';

export interface IDocType {
  [key: string]: string;
}

interface FlyoutButtonProps {
  http: HttpStart;
  doc: IDocType;
  docId: string;
  selectedCols: IField[];
  timeStampField: string;
  explorerFields: IExplorerFields;
  pplService: PPLService;
  rawQuery: string;
  onFlyoutOpen: (docId: string) => void;
  dataGridColumns: any;
  dataGridColumnVisibility: any;
  selectedIndex: any;
  sortingFields: any;
  rowHeightsOptions: any;
  rows: any;
  secondaryAction?: boolean;
}

export const FlyoutButton = forwardRef((props: FlyoutButtonProps, ref) => {
  const {
    http,
    doc,
    docId,
    selectedCols,
    timeStampField,
    explorerFields,
    pplService,
    rawQuery,
    onFlyoutOpen,
    dataGridColumns,
    dataGridColumnVisibility,
    selectedIndex,
    sortingFields,
    rowHeightsOptions,
    rows,
    secondaryAction,
  } = props;

  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
  const [surroundingEventsOpen, setSurroundingEventsOpen] = useState<boolean>(false);
  const [openTraces, setOpenTraces] = useState<boolean>(false);
  const [flyoutToggleSize, setFlyoutToggleSize] = useState(true);
  const [secondaryFlyoutOpen, setSecondaryFlyoutOpen] = useState<boolean>(false);

  useImperativeHandle(ref, () => ({
    closeAllFlyouts(openDocId: string) {
      if (openDocId !== docId && (detailsOpen || surroundingEventsOpen)) {
        setSurroundingEventsOpen(false);
        setDetailsOpen(false);
      }
    },
  }));

  const getTdTmpl = (conf: { clsName: string; content: React.ReactDOM | string }) => {
    const { clsName, content } = conf;
    return (
      <td key={uniqueId('datagrid-cell-')} className={clsName}>
        {typeof content === 'boolean' ? String(content) : content}
      </td>
    );
  };

  const getDlTmpl = (conf: { doc: IDocType }, isFlyout: boolean) => {
    const { doc: document } = conf;

    return (
      <div className="truncate-by-height">
        <span>
          <dl className="source truncate-by-height">
            {toPairs(document).map((entry: string[]) => {
              const isTraceField = entry[0] === OTEL_TRACE_ID || entry[0] === JAEGER_TRACE_ID;
              return (
                <span key={uniqueId('grid-desc')}>
                  <dt>{entry[0]}:</dt>
                  <dd>
                    <span>
                      {isTraceField &&
                      (isValidTraceId(entry[1]) || entry[0] === JAEGER_TRACE_ID) &&
                      !isFlyout ? (
                        <EuiLink onClick={tracesFlyout}>{entry[1]}</EuiLink>
                      ) : (
                        entry[1]
                      )}
                    </span>
                  </dd>
                </span>
              );
            })}
          </dl>
        </span>
      </div>
    );
  };

  const tracesFlyout = () => {
    setOpenTraces(true);
    if (!detailsOpen) toggleDetailOpen();
  };

  const getDiscoverSourceLikeDOM = (document: IDocType, isFlyout: boolean) => {
    return getDlTmpl({ doc: document }, isFlyout);
  };

  const toggleDetailOpen = () => {
    if (surroundingEventsOpen) {
      setSurroundingEventsOpen(false);
      setDetailsOpen(false);
    } else {
      const newState = !detailsOpen;
      setDetailsOpen(newState);
    }
  };

  const toggleSecondaryFlyout = () => {
    if (detailsOpen || surroundingEventsOpen || openTraces) {
      setDetailsOpen(false);
      setSurroundingEventsOpen(false);
      setOpenTraces(false);
    }
    
    // When opening the flyout, record that this row was selected
    // This will trigger the useEffect in SecondaryFlyout to add the row data
    const newState = !secondaryFlyoutOpen;
    setSecondaryFlyoutOpen(newState);
  };

  const getExpColapTd = () => {
    return (
      <td className="osdDocTableCell__toggleDetails" key={uniqueId('grid-td-')}>
        <EuiSmallButtonIcon
          className="euiButtonIcon euiButtonIcon--text"
          data-test-subj="eventExplorer__flyoutArrow"
          onClick={() => {
            toggleDetailOpen();
          }}
          iconType={detailsOpen || surroundingEventsOpen ? 'arrowLeft' : 'arrowRight'}
        />
      </td>
    );
  };

  const getTds = (document: IDocType, selectedColumns: IField[], isFlyout: boolean) => {
    const cols = [];
    const fieldClsName = 'osdDocTableCell__dataField eui-textBreakAll eui-textBreakWord';
    const timestampClsName = 'eui-textNoWrap';
    if (!selectedColumns || selectedColumns.length === 0) {
      if (has(document, timeStampField)) {
        cols.push(
          getTdTmpl({
            clsName: timestampClsName,
            content: moment.utc(document[timeStampField]).local().format(DATE_PICKER_FORMAT),
          })
        );
      }
      const _sourceLikeDOM = getDiscoverSourceLikeDOM(document, isFlyout);
      cols.push(
        getTdTmpl({
          clsName: fieldClsName,
          content: _sourceLikeDOM,
        })
      );
    } else {
      const filteredDoc = {};
      forEach(selectedColumns, (selCol) => {
        if (has(document, selCol.name)) {
          filteredDoc[selCol.name] = document[selCol.name];
        }
      });
      forEach(filteredDoc, (val, key) => {
        cols.push(
          getTdTmpl({
            clsName: fieldClsName,
            content: isEqual(key, timeStampField)
              ? moment.utc(val).local().format(DATE_PICKER_FORMAT)
              : val,
          })
        );
      });
    }

    cols.unshift(getExpColapTd());
    return cols;
  };

  const memorizedDocFlyout = useMemo(() => {
    return (
      <DocFlyout
        http={http}
        detailsOpen={detailsOpen}
        setDetailsOpen={setDetailsOpen}
        doc={doc}
        timeStampField={timeStampField}
        memorizedTds={getTds(doc, selectedCols, true).slice(1)}
        explorerFields={explorerFields}
        openTraces={openTraces}
        rawQuery={rawQuery}
        toggleSize={flyoutToggleSize}
        setToggleSize={setFlyoutToggleSize}
        setOpenTraces={setOpenTraces}
        setSurroundingEventsOpen={setSurroundingEventsOpen}
      />
    );
  }, [
    http,
    detailsOpen,
    doc,
    timeStampField,
    selectedCols,
    explorerFields,
    openTraces,
    rawQuery,
    flyoutToggleSize,
  ]);

  const memorizedSurroundingFlyout = useMemo(() => {
    return (
      <SurroundingFlyout
        http={http}
        detailsOpen={detailsOpen}
        setDetailsOpen={setDetailsOpen}
        doc={doc}
        timeStampField={timeStampField}
        memorizedTds={getTds(doc, selectedCols, true).slice(1)}
        explorerFields={explorerFields}
        openTraces={openTraces}
        setOpenTraces={setOpenTraces}
        setSurroundingEventsOpen={setSurroundingEventsOpen}
        pplService={pplService}
        rawQuery={rawQuery}
        selectedCols={selectedCols}
        getTds={getTds}
        toggleSize={flyoutToggleSize}
        setToggleSize={setFlyoutToggleSize}
        dataGridColumns={dataGridColumns}
        dataGridColumnVisibility={dataGridColumnVisibility}
        selectedIndex={selectedIndex}
        sortingFields={sortingFields}
        rowHeightsOptions={rowHeightsOptions}
        rows={rows}
      />
    );
  }, [
    http,
    detailsOpen,
    doc,
    timeStampField,
    selectedCols,
    explorerFields,
    openTraces,
    pplService,
    rawQuery,
    selectedCols,
    flyoutToggleSize,
  ]);

  let flyout = null;

  if (secondaryAction && secondaryFlyoutOpen) {
    flyout = (
      <SecondaryFlyout
        http={http}
        doc={doc}
        timeStampField={timeStampField}
        secondaryFlyoutOpen={secondaryFlyoutOpen}
        setSecondaryFlyoutOpen={setSecondaryFlyoutOpen}
        flyoutToggleSize={flyoutToggleSize}
        setFlyoutToggleSize={setFlyoutToggleSize}
      />
    );
  } else if (!secondaryAction) {
    if (detailsOpen) {
      flyout = memorizedDocFlyout;
    }

    if (surroundingEventsOpen) {
      flyout = memorizedSurroundingFlyout;
    }
  }

  useEffect(() => {
    if (detailsOpen) {
      onFlyoutOpen(docId);
    }
  }, [detailsOpen]);

  const handleClick = () => {
    if (secondaryAction) {
      toggleSecondaryFlyout();
    } else {
      toggleDetailOpen();
    }
  };

  return (
    <>
      <EuiSmallButtonIcon
        onClick={handleClick}
        iconType={
          secondaryAction
            ? secondaryFlyoutOpen
              ? 'minimize'
              : 'user'
            : detailsOpen || surroundingEventsOpen
            ? 'minimize'
            : 'inspect'
        }
        aria-label={
          secondaryAction
            ? secondaryFlyoutOpen 
              ? "minimize chat assistant" 
              : "ask chat assistance"
            : detailsOpen || surroundingEventsOpen
              ? "minimize details"
              : "inspect details"
        }
        data-test-subj={secondaryAction ? 'eventExplorer__secondaryFlyout' : 'eventExplorer__flyout'}
      />
      {flyout}
    </>
  );
});
