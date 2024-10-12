// src/types/chains.ts

// Define the type for Chain
export type ChainName = keyof typeof chainsConfig;

// Create a central configuration object for chains
export const chainsConfig = {
  Polkadot: { paraId: 2034, displayName: 'Polkadot' },
  Acala: { paraId: 2000, displayName: 'Acala' },
  Moonbeam: { paraId: 2006, displayName: 'Moonbeam' },
  Hydration: { paraId: 2048, displayName: 'Hydration' },
} as const;

// Extract the chain names automatically from the config
export const chainNames = Object.keys(chainsConfig) as ChainName[];

// Create a paraId to chainName mapping for easier lookup
export const paraIdToChainName = Object.fromEntries(
  Object.entries(chainsConfig).map(([chain, config]) => [config.paraId, chain])
) as Record<number, ChainName>;

// Define the structure for the metrics of each chain
export type ChainMetrics = {
  tps: number;
  block: number;
  kbps: number;
};
