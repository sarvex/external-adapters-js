import { customSettings } from '../config'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import {
  PriceEndpoint,
  priceEndpointInputParameters,
  PriceEndpointParams,
} from '@chainlink/external-adapter-framework/adapter'
import { WebSocketRawData } from '@chainlink/external-adapter-framework/transports/websocket'

// Note: this adapter is intended for the API with endpoint 'wss://cryptofeed.ws.newchangefx.com'.
// There is another API with endpoint 'wss://feed.newchangefx.com/cryptodata' that has slightly
// different behavior, including a different login success message and the price messages being
// an array of price data objects for each subscribed asset.

type WsMessage = WsInfoMessage | WsPriceMessage

type WsInfoMessage = {
  Type: string
  Message: string
}

type WsPriceMessage = {
  timestamp: string // e.g. 2023-01-31T20:10:41
  currencyPair: string // e.g. ETH/USD
  bid?: number // e.g. 1595.4999
  offer?: number // e.g. 1595.5694
  mid?: number // e.g. 1595.5346
}

type Response = {
  Result: number
  Data: {
    result: number
    bid: number
    ask: number
  }
}

export type EndpointTypes = {
  Request: {
    Params: PriceEndpointParams
  }
  Response: Response
  CustomSettings: typeof customSettings
  Provider: {
    WsMessage: WsMessage
  }
}

const logger = makeLogger('NcfxCryptoEndpoint')

export const cryptoTransport = new WebSocketTransport<EndpointTypes>({
  url: (context) => context.adapterConfig.WS_API_ENDPOINT,
  handlers: {
    open(connection, context) {
      return new Promise((resolve, reject) => {
        // Set up listener
        connection.on('message', (data: WebSocketRawData) => {
          const parsed = JSON.parse(data.toString())
          if (parsed.Message === 'Succesfully Authenticated') {
            logger.debug('Got logged in response, connection is ready')
            resolve()
          } else {
            reject(new Error(`Unexpected message after WS connection open: ${data.toString()}`))
          }
        })
        // Send login payload
        logger.debug('Logging in WS connection')
        connection.send(
          JSON.stringify({
            request: 'login',
            username: context.adapterConfig.API_USERNAME,
            password: context.adapterConfig.API_PASSWORD,
          }),
        )
      })
    },

    message(message: WsMessage): ProviderResult<EndpointTypes>[] | undefined {
      if (isInfoMessage(message)) {
        logger.debug(`Received message ${message.Type}: ${message.Message}`)
        return
      }

      if (!message.currencyPair || !message.mid || !message.bid || !message.offer) {
        logger.debug('WS message does not contain valid data, skipping')
        return
      }

      const [base, quote] = message.currencyPair.split('/')
      return [
        {
          params: { base, quote },
          response: {
            result: message.mid || 0, // Already validated in the filter above
            data: {
              result: message.mid || 0, // Already validated in the filter above
              bid: message.bid || 0, // Already validated in the filter above
              ask: message.offer || 0, // Already validated in the filter above
            },
            timestamps: {
              providerIndicatedTimeUnixMs: new Date(message.timestamp).getTime(),
            },
          },
        },
      ]
    },
  },
  builders: {
    subscribeMessage: (params) => ({
      request: 'subscribe',
      ccy: `${params.base}/${params.quote}`,
    }),
    unsubscribeMessage: (params) => ({
      request: 'unsubscribe',
      ccy: `${params.base}/${params.quote}`,
    }),
  },
})

const isInfoMessage = (message: WsMessage): message is WsInfoMessage => {
  return (message as WsInfoMessage).Type !== undefined
}

export const cryptoEndpoint = new PriceEndpoint<EndpointTypes>({
  name: 'crypto',
  transport: cryptoTransport,
  inputParameters: priceEndpointInputParameters,
})
