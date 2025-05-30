/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import Plotly from 'plotly.js-dist';
import React from 'react';
import plotComponentFactory from 'react-plotly.js/factory';
import { uiSettingsService } from '../../../../common/utils';

interface PltProps {
  data: Plotly.Data[];
  layout?: Partial<Plotly.Layout>;
  config?: Partial<Plotly.Config>;
  onHoverHandler?: (event: Readonly<Plotly.PlotMouseEvent>) => void;
  onUnhoverHandler?: (event: Readonly<Plotly.PlotMouseEvent>) => void;
  onClickHandler?: (event: Readonly<Plotly.PlotMouseEvent>) => void;
  onSelectedHandler?: (event: Readonly<Plotly.PlotSelectionEvent>) => void;
  onRelayout?: (event: Readonly<Plotly.PlotSelectionEvent>) => void;
  height?: string;
  dispatch?: (props: any) => void;
}

export function Plt(props: PltProps) {
  const PlotComponent = plotComponentFactory(Plotly);
  const darkLayout = uiSettingsService.get('theme:darkMode')
    ? {
        paper_bgcolor: '#1D1E24',
        plot_bgcolor: '#1D1E24',
        font: {
          color: '#DFE5EF',
        },
      }
    : {};

  const finalLayout = {
    autosize: true,
    barmode: 'stack',
    legend: {
      orientation: 'h',
      traceorder: 'normal',
    },
    showlegend: false,
    hovermode: 'closest',
    xaxis: {
      showgrid: true,
      zeroline: false,
      rangemode: 'normal',
      automargin: true,
    },
    yaxis: {
      title: {
        text: 'Count',
      },
      showgrid: true,
      zeroline: false,
      rangemode: 'normal',
    },
    ...darkLayout,
    ...props.layout,
  };

  const finalConfig = {
    displayModeBar: false,
    ...props.config,
  };

  return (
    <PlotComponent
      divId="explorerPlotComponent"
      data={props.data}
      style={{ width: '100%', height: props.height || '100%' }}
      onHover={props.onHoverHandler}
      onUnhover={props.onUnhoverHandler}
      onClick={props.onClickHandler}
      onRelayout={props.onRelayout}
      onSelected={props.onSelectedHandler}
      useResizeHandler
      config={finalConfig}
      layout={finalLayout}
    />
  );
}
