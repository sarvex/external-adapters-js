import { BigNumberish, ethers } from 'ethers'
import { types } from '@chainlink/token-allocation-adapter'
import { getSymbol } from '../symbols'
import { AdapterDataProviderError, RPCCustomError, util } from '@chainlink/ea-bootstrap'
/*
  NOTICE!

  The current implementation is fetching data directly from SetToken contracts (https://etherscan.io/address/0x78733fa5e70e3ab61dc49d93921b289e4b667093#code)
  Note that this implementation won't work in other networks unless we deploy a copy of the contract.

  The correct implementation should use SetProtocol.js typed library instead to fetch data directly from the SetToken contract directly.
  The ChainlinkAdapter.getAllocations(ISetToken _setToken) should be reimplemented in JS in order to use it.
*/

const ABI = [
  {
    inputs: [{ internalType: 'contract ISetToken', name: '_setToken', type: 'address' }],
    name: 'getAllocations',
    outputs: [
      { internalType: 'address[]', name: '', type: 'address[]' },
      { internalType: 'int256[]', name: '', type: 'int256[]' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

export const getAllocations = async (
  contractAddress: string,
  setAddress: string,
  rpcUrl: string,
  network: string,
): Promise<types.TokenAllocations> => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const index = new ethers.Contract(contractAddress, ABI, provider)

  let addresses
  let balances: BigNumberish[]
  try {
    ;[addresses, balances] = await index.getAllocations(setAddress)
  } catch (e) {
    const error = e as RPCCustomError
    throw new AdapterDataProviderError({
      network,
      message: util.mapRPCErrorMessage(error?.code, error?.message),
      cause: error,
    })
  }

  // Token balances are coming already normalized as 18 decimals token
  return await Promise.all(
    addresses.map(async (address: string, i: number) => ({
      balance: balances[i],
      symbol: await getSymbol(address, rpcUrl, network),
      decimals: 18,
    })),
  )
}
