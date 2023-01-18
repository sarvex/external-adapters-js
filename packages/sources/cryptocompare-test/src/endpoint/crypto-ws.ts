import {
  WebSocketTransport,
  WebSocketRawData,
} from '@chainlink/external-adapter-framework/transports/websocket'
import { ProviderResult, makeLogger } from '@chainlink/external-adapter-framework/util'
import { CryptoEndpointTypes } from '../crypto-utils'

const logger = makeLogger('CryptoCompare WS')

interface WSSuccessType {
  PRICE?: number // Cryptocompare does not provide the price in updates from all exchanges
  TYPE: string
  MARKET: string
  FLAGS: number
  FROMSYMBOL: string
  TOSYMBOL: string
  VOLUMEDAY: number
  VOLUME24HOUR: number
  VOLUMEDAYTO: number
  VOLUME24HOURTO: number
  MESSAGE?: string
}

interface WSErrorType {
  TYPE: string
  MESSAGE: string
  PARAMETER: string
  INFO: string
}

export type WsMessage = WSSuccessType | WSErrorType

type WsEndpointTypes = CryptoEndpointTypes & {
  Provider: {
    WsMessage: WsMessage
  }
}

export const wsTransport = new WebSocketTransport<WsEndpointTypes>({
  url: (context) =>
    `${context.adapterConfig.WS_API_ENDPOINT}?api_key=${
      context.adapterConfig.WS_API_KEY || context.adapterConfig.API_KEY
    }`,
  handlers: {
    open(connection) {
      return new Promise((resolve, reject) => {
        // Set up listener
        connection.on('message', (data: WebSocketRawData) => {
          const parsed = JSON.parse(data.toString())
          if (parsed.MESSAGE === 'STREAMERWELCOME') {
            logger.info('Got logged in response, connection is ready')
            resolve()
          } else {
            reject(new Error('Unexpected message after WS connection open'))
          }
        })
      })
    },
    message(message): ProviderResult<WsEndpointTypes>[] | undefined {
      logger.trace(message, 'Got response from websocket')
      if (message.TYPE === '5' && 'PRICE' in message) {
        return [
          {
            params: { base: message.FROMSYMBOL, quote: message.TOSYMBOL, endpoint: 'crypto' },
            response: {
              result: message.PRICE as number,
              data: {
                result: message.PRICE as number,
              },
            },
          },
        ]
      }
      if (message.MESSAGE === 'INVALID_SUB') {
        // message.PARAMETER looks like 5~CCCAGG~BASE~QUOTE
        const parameters = (message as WSErrorType).PARAMETER.split('~')
        const base = parameters[2]
        const quote = parameters[3]
        logger.error(message, 'asset not supported by data provider')
        return [
          {
            params: { base, quote, endpoint: 'crypto' },
            response: {
              errorMessage:
                'Could not retrieve valid data from Data Provider. This is likely an issue with the Data Provider or the input params/overrides',
              statusCode: 400,
            },
          },
        ]
      }
      return []
    },
  },
  builders: {
    subscribeMessage: (params) => {
      return { action: 'SubAdd', subs: [`5~CCCAGG~${params.base}~${params.quote}`] }
    },
    unsubscribeMessage: (params) => {
      return { action: 'SubRemove', subs: [`5~CCCAGG~${params.base}~${params.quote}`] }
    },
  },
})
