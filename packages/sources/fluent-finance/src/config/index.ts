import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/ea-bootstrap'

export const NAME = 'FLUENT_FINANCE'

export const DEFAULT_ENDPOINT = 'moon'
export const DEFAULT_BASE_URL = 'https://gateway-api.fluent.finance/v1/gateway/'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
