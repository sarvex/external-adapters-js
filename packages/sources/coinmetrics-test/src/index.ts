import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from './config'
import { burned, priceRouter, totalBurned } from './endpoint'

export const adapter = new Adapter({
  defaultEndpoint: priceRouter.name,
  name: 'COINMETRICS',
  endpoints: [priceRouter, totalBurned, burned],
  customSettings,
  rateLimiting: {
    tiers: {
      community: {
        rateLimit1m: 100,
      },
      paid: {
        rateLimit1s: 300,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
