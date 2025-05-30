/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCodeBlock, EuiHorizontalRule, EuiSpacer, EuiText } from '@elastic/eui';
import React, { useEffect, useMemo, useState } from 'react';
import { HttpStart } from '../../../../../../../src/core/public';
import { TraceAnalyticsMode } from '../../../../../common/types/trace_analytics';
import { ServiceBreakdownPanel } from '../../../trace_analytics/components/traces/service_breakdown_panel';
import { SpanDetailPanel } from '../../../trace_analytics/components/traces/span_detail_panel';
import {
  handlePayloadRequest,
  handleServicesPieChartRequest,
  handleTraceViewRequest,
} from '../../../trace_analytics/requests/traces_request_handler';
import { getListItem } from '../../helpers/utils';

interface TraceDetailRenderProps {
  traceId: string;
  http: HttpStart;
  openSpanFlyout: (spanId: string) => void;
  mode: TraceAnalyticsMode;
  dataSourceMDSId: string;
}

export const TraceDetailRender = ({
  traceId,
  http,
  openSpanFlyout,
  mode,
  dataSourceMDSId,
}: TraceDetailRenderProps) => {
  const [fields, setFields] = useState<any>({});
  const [serviceBreakdownData, setServiceBreakdownData] = useState([]);
  const [payloadData, setPayloadData] = useState('');
  const [colorMap, setColorMap] = useState({});

  const renderContent = useMemo(() => {
    if (!traceId) return <></>;
    const overviewList = [
      getListItem('Trace ID', traceId),
      getListItem('Trace group name', fields.trace_group || '-'),
      getListItem('Latency', fields.latency),
      getListItem('Last updated', fields.last_updated),
      getListItem(
        'Errors',
        fields.error_count == null ? (
          <></>
        ) : fields.error_count > 0 ? (
          <EuiText color="danger" size="s" style={{ fontWeight: 430 }}>
            Yes
          </EuiText>
        ) : (
          'No'
        )
      ),
    ];

    return (
      <>
        <EuiText size="m">
          <span className="panel-title">Overview</span>
        </EuiText>
        <EuiSpacer size="s" />
        {overviewList}
        <EuiSpacer size="xs" />
        <EuiHorizontalRule margin="s" />
        <ServiceBreakdownPanel data={serviceBreakdownData} />
        <EuiSpacer size="xs" />
        <EuiHorizontalRule margin="s" />
        <SpanDetailPanel
          traceId={traceId}
          http={http}
          colorMap={colorMap}
          page="app"
          openSpanFlyout={openSpanFlyout}
          mode={mode}
          dataSourceMDSId={dataSourceMDSId}
          isApplicationFlyout={true}
        />
        <EuiSpacer size="xs" />
        <EuiHorizontalRule margin="s" />
        <EuiText size="m">
          <span className="panel-title">Payload</span>
        </EuiText>
        <EuiSpacer size="s" />
        {payloadData.length > 0 ? (
          <EuiCodeBlock language="json" paddingSize="s" isCopyable overflowHeight={500}>
            {payloadData}
          </EuiCodeBlock>
        ) : null}
      </>
    );
  }, [traceId, fields, serviceBreakdownData, colorMap, payloadData]);

  useEffect(() => {
    handleTraceViewRequest(traceId, http, fields, setFields, mode);
    handleServicesPieChartRequest(traceId, http, setServiceBreakdownData, setColorMap, mode);
    handlePayloadRequest(traceId, http, payloadData, setPayloadData, mode);
  }, [traceId]);

  return renderContent;
};
