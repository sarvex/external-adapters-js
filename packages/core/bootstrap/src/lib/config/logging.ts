// List of default and custom config paths that need to be redacted when logging config
export const configRedactPaths = [
  'config.api.auth',
  'config.api.headers',
  'config.api.params',
  'config.apiKey',
  'config.wsApiKey',
  'config.privateKey',
  'config.password',
  'config.adapterSpecificParams.privateKey',
  'config.adapterSpecificParams.apiKey',
  'config.adapterSpecificParams.apiPassword',
  'config.adapterSpecificParams.nftApiAuthHeader',
  'config.adapterSpecificParams.forexEncodedCreds',
  'config.client.key',
  'config.client.secret',
  'config.nflScoresKey',
  'config.mmaStatsKey',
  'config.cfbScoresKey',
  'config.nbaKey',
  'config.mlbKey',
  'config.stockWsEndpoint',
  'config.forexWsEndpoint',
  'config.cryptoWsEndpoint',
]
