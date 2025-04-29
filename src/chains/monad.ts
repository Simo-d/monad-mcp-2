import { Chain } from 'viem';

export const monadTestnet = {
  id: 2440,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.monad.xyz/'],
    },
    public: {
      http: ['https://rpc.testnet.monad.xyz/'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Explorer',
      url: 'https://explorer.testnet.monad.xyz',
    },
  },
  contracts: {},
} as const satisfies Chain;
