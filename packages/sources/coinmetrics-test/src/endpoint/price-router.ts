import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/meta'
import { wsTransport } from './price-ws'
import { customSettings, priceInputParameters, VALID_QUOTES } from '../config'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { httpTransport } from './price'

export type MetricData = {
  asset: string
  time: string
  ReferenceRateUSD?: string
  ReferenceRateEUR?: string
  ReferenceRateETH?: string
  ReferenceRateBTC?: string
}

interface ResponseSchema {
  data: MetricData[]
  error?: {
    type: string
    message: string
  }
}

export type AssetMetricsRequestBody = {
  base: string
  quote: VALID_QUOTES
}

// Common endpoint type shared by the REST and WS transports
export type AssetMetricsEndpointTypes = {
  Response: SingleNumberResultResponse
  Request: {
    Params: AssetMetricsRequestBody
  }
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: never
    ResponseBody: ResponseSchema
  }
}

// Currently only routes to websocket. Stub is here for the follow-up release that will add in REST routes.
export const routingTransport = new RoutingTransport<AssetMetricsEndpointTypes>(
  {
    WS: wsTransport,
    HTTP: httpTransport,
  },
  (_, adapterConfig) => (adapterConfig.WS_ENABLED ? 'WS' : 'HTTP'),
)

export const endpoint = new AdapterEndpoint<AssetMetricsEndpointTypes>({
  name: 'price',
  transport: routingTransport,
  inputParameters: priceInputParameters,
})
