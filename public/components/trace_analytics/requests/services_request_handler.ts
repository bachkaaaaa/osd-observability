/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import dateMath from '@elastic/datemath';
import { htmlIdGenerator } from '@elastic/eui';
import { round } from 'lodash';
import moment from 'moment';
import DSLService from 'public/services/requests/dsl';
import { HttpSetup, HttpStart } from '../../../../../../src/core/public';
import { TRACE_ANALYTICS_PLOTS_DATE_FORMAT } from '../../../../common/constants/trace_analytics';
import { ServiceTrends, TraceAnalyticsMode } from '../../../../common/types/trace_analytics';
import { coreRefs } from '../../../../public/framework/core_refs';
import { fixedIntervalToMilli } from '../components/common/helper_functions';
import { ServiceObject } from '../components/common/plots/service_map';
import {
  getServiceEdgesQuery,
  getServiceMetricsQuery,
  getServiceNodesQuery,
  getServicesQuery,
  getServiceTrendsQuery,
} from './queries/services_queries';
import { handleDslRequest } from './request_handler';

export const handleServicesRequest = async (
  http: HttpSetup,
  DSL: any,
  setItems: any,
  mode: TraceAnalyticsMode,
  dataSourceMDSId?: string,
  setServiceMap?: any,
  serviceNameFilter?: string
) => {
  return handleDslRequest(
    http,
    DSL,
    getServicesQuery(mode, serviceNameFilter, DSL),
    mode,
    dataSourceMDSId
  )
    .then(async (response) => {
      const serviceObject: ServiceObject = await handleServiceMapRequest(
        http,
        DSL,
        mode,
        dataSourceMDSId,
        setServiceMap
      );

      if (!serviceObject || Object.keys(serviceObject).length === 0) {
        setItems([]);
        return [];
      }

      return Promise.all(
        response.aggregations.service.buckets
          .filter((bucket: any) => serviceObject[bucket.key])
          .map((bucket: any) => {
            const connectedServices = [
              ...serviceObject[bucket.key].targetServices,
              ...serviceObject[bucket.key].destServices,
            ];
            return {
              itemId: htmlIdGenerator('trace_service')(),
              name: bucket.key,
              average_latency: serviceObject[bucket.key].latency,
              error_rate: serviceObject[bucket.key].error_rate,
              throughput: serviceObject[bucket.key].throughput,
              traces: bucket.trace_count.value,
              connected_services: connectedServices.sort(),
              number_of_connected_services: connectedServices.length,
            };
          })
      );
    })
    .then((newItems) => {
      setItems(newItems);
    })
    .catch((error) => {
      console.error('Error in handleServicesRequest:', error);
      coreRefs.core?.notifications.toasts.addError(error, {
        title: 'Failed to retrieve services',
        toastLifeTimeMs: 10000,
      });
    });
};

export const handleServiceMapRequest = async (
  http: HttpSetup,
  DSL: DSLService | any,
  mode: TraceAnalyticsMode,
  dataSourceMDSId?: string,
  setItems?: any,
  includeMetrics = true
) => {
  let minutesInDateRange: number;
  const startTime = DSL.custom?.timeFilter?.[0]?.range?.startTime;
  if (startTime && mode !== 'jaeger') {
    const gte = dateMath.parse(startTime.gte)!;
    const lte = dateMath.parse(startTime.lte, { roundUp: true })!;
    minutesInDateRange = lte.diff(gte, 'minutes', true);
  }
  const map: ServiceObject = {};
  let id = 1;
  const serviceNodesResponse = await handleDslRequest(
    http,
    null,
    getServiceNodesQuery(mode),
    mode,
    dataSourceMDSId
  ).catch((error) => {
    console.error('Error retrieving service nodes:', error);
    coreRefs.core?.notifications.toasts.addError(error, {
      title: 'Failed to retrieve service nodes',
      toastLifeTimeMs: 10000,
    });
    return null;
  });

  if (
    !serviceNodesResponse ||
    !serviceNodesResponse.aggregations ||
    !serviceNodesResponse.aggregations.service_name ||
    !serviceNodesResponse.aggregations.service_name.buckets ||
    serviceNodesResponse.aggregations.service_name.buckets.length === 0
  ) {
    if (setItems) {
      setItems(map);
    }
    return map;
  }

  serviceNodesResponse.aggregations.service_name.buckets.forEach((bucket: any) => {
    map[bucket.key] = {
      serviceName: bucket.key,
      id: id++,
      targetResources: bucket.target_resource.buckets.map((res: any) => res.key),
      targetServices: [],
      destServices: [],
    };
  });

  const targets: Record<string, string> = {};
  await handleDslRequest(http, null, getServiceEdgesQuery('target', mode), mode, dataSourceMDSId)
    .then((response) =>
      response.aggregations.service_name.buckets.map((bucket: any) => {
        bucket.resource.buckets.map((resource: any) => {
          resource.domain.buckets.map((domain: any) => {
            targets[resource.key + ':' + domain.key] = bucket.key;
          });
        });
      })
    )
    .catch((error) => {
      console.error('Error retrieving target edges:', error);
    });

  await handleDslRequest(
    http,
    null,
    getServiceEdgesQuery('destination', mode),
    mode,
    dataSourceMDSId
  )
    .then((response) =>
      Promise.all(
        response.aggregations.service_name.buckets.map((bucket: any) => {
          bucket.resource.buckets.map((resource: any) => {
            resource.domain.buckets.map((domain: any) => {
              const targetService = targets[resource.key + ':' + domain.key];
              if (targetService) {
                if (map[bucket.key].targetServices.indexOf(targetService) === -1)
                  map[bucket.key].targetServices.push(targetService);
                if (map[targetService].destServices.indexOf(bucket.key) === -1)
                  map[targetService].destServices.push(bucket.key);
              }
            });
          });
        })
      )
    )
    .catch((error) => {
      console.error('Error retrieving destination edges:', error);
    });

  if (includeMetrics) {
    try {
      const latencies = await handleDslRequest(
        http,
        DSL,
        getServiceMetricsQuery(DSL, Object.keys(map), map, mode),
        mode,
        dataSourceMDSId
      );
      latencies.aggregations.service_name.buckets.map((bucket: any) => {
        map[bucket.key].latency = bucket.average_latency.value;
        map[bucket.key].error_rate = round(bucket.error_rate.value, 2) || 0;
        map[bucket.key].throughput = bucket.doc_count;
        if (minutesInDateRange != null)
          map[bucket.key].throughputPerMinute = round(bucket.doc_count / minutesInDateRange, 2);
      });
    } catch (error) {
      console.error('Error retrieving service metrics:', error);
    }
  }
  if (setItems) setItems(map);
  return map;
};

export const handleServiceViewRequest = (
  serviceName: string,
  http: HttpSetup,
  DSL: any,
  setFields: any,
  mode: TraceAnalyticsMode,
  dataSourceMDSId?: string
) => {
  return handleDslRequest(http, DSL, getServicesQuery(mode, serviceName), mode, dataSourceMDSId)
    .then(async (response) => {
      const bucket = response.aggregations.service.buckets[0];
      if (!bucket) return {};
      const serviceObject: ServiceObject = await handleServiceMapRequest(
        http,
        DSL,
        mode,
        dataSourceMDSId
      );
      const connectedServices = [
        ...serviceObject[bucket.key].targetServices,
        ...serviceObject[bucket.key].destServices,
      ];
      return {
        name: bucket.key,
        connected_services: connectedServices.sort(),
        number_of_connected_services: connectedServices.length,
        average_latency: serviceObject[bucket.key].latency,
        error_rate: serviceObject[bucket.key].error_rate,
        throughput: serviceObject[bucket.key].throughput,
        traces: bucket.trace_count.value,
      };
    })
    .then((newFields) => {
      setFields(newFields);
    })
    .catch((error) => {
      console.error('Error in handleServiceViewRequest:', error);
      coreRefs.core?.notifications.toasts.addError(error, {
        title: 'Failed to retrieve service view data',
        toastLifeTimeMs: 10000,
      });
    });
};

export const handleServiceTrendsRequest = (
  http: HttpStart,
  fixedInterval: string,
  setItems: React.Dispatch<React.SetStateAction<ServiceTrends>>,
  mode: TraceAnalyticsMode,
  serviceFilter: any,
  dataSourceMDSId?: string
) => {
  const parsedResult: ServiceTrends = {};

  return handleDslRequest(
    http,
    [],
    getServiceTrendsQuery(mode, serviceFilter),
    mode,
    dataSourceMDSId
  )
    .then((response) => {
      response.aggregations.service_trends.buckets.forEach((serviceBucket) => {
        const serviceName = serviceBucket.key;
        parsedResult[serviceName] = {
          latency_trend: {
            x: [],
            y: [],
            type: 'scatter',
            mode: 'lines+markers',
            fill: 'tozeroy',
            hovertemplate: '%{x}<br>Average latency: %{y}<extra></extra>',
            hoverlabel: {
              bgcolor: '#d7c2ff',
            },
            marker: {
              color: '#987dcb',
              size: 8,
            },
            line: {
              color: '#987dcb',
              size: 2,
            },
          },
          throughput: {
            x: [],
            y: [],
            marker: {
              color: 'rgb(171, 211, 240)',
            },
            type: 'bar',
            customdata: [],
            hoverlabel: {
              align: 'left',
            },
            hovertemplate: '%{customdata}<br>Throughput: %{y:,}<extra></extra>',
          },
          error_rate: {
            x: [],
            y: [],
            marker: {
              color: '#fad963',
            },
            type: 'bar',
            customdata: [],
            hoverlabel: {
              align: 'left',
            },
            hovertemplate: '%{customdata}<br>Error rate: %{y}<extra></extra>',
          },
        };

        serviceBucket.time_buckets.buckets.forEach(
          (timeBucket: {
            key: any;
            average_latency?: { value: any };
            trace_count?: { value: any };
            error_rate?: { value: any };
          }) => {
            const timeKey = timeBucket.key;
            const customTime = `${moment(timeKey).format(
              TRACE_ANALYTICS_PLOTS_DATE_FORMAT
            )} - ${moment(timeKey + fixedIntervalToMilli(fixedInterval)).format(
              TRACE_ANALYTICS_PLOTS_DATE_FORMAT
            )}`;

            parsedResult[serviceName].latency_trend.x.push(timeKey);
            parsedResult[serviceName].latency_trend.y.push(
              timeBucket?.average_latency?.value ?? '0'
            );

            parsedResult[serviceName].throughput.x.push(timeKey);
            parsedResult[serviceName].throughput.y.push(timeBucket?.trace_count?.value ?? '0');
            parsedResult[serviceName].throughput.customdata.push(customTime);

            parsedResult[serviceName].error_rate.x.push(timeKey);
            parsedResult[serviceName].error_rate.y.push(timeBucket?.error_rate?.value ?? '0');
            parsedResult[serviceName].error_rate.customdata.push(customTime);
          }
        );
      });
      setItems(parsedResult);
    })
    .catch((error) => {
      console.error('Error in handleServiceTrendsRequest:', error);
      coreRefs.core?.notifications.toasts.addError(error, {
        title: 'Failed to retrieve service trends',
        toastLifeTimeMs: 10000,
      });
    });
};
