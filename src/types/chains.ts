// src/types/chains.ts
import { ChainConfig } from './types';

// Define the type for Chain
export type ChainsConfig = Record<string, ChainConfig>;

// Create a central configuration object for chains
export const polkadotChainsConfig: ChainsConfig = {
  Polkadot: { paraId: 1, displayName: 'Polkadot' },
  AssetHub: { paraId: 1000, displayName: 'AssetHub' },
  BridgeHub: { paraId: 1002, displayName: 'BridgeHub' },
  Collectives: { paraId: 1001, displayName: 'Collectives' },
  Coretime: { paraId: 1005, displayName: 'Coretime' },
  People: { paraId: 1004, displayName: 'People' },
  Acala: { paraId: 2000, displayName: 'Acala' },
  Ajuna: { paraId: 2051, displayName: 'Ajuna Network' },
  Astar: { paraId: 2006, displayName: 'Astar' },
  Aventus: { paraId: 2056, displayName: 'Aventus' },
  Bifrost: { paraId: 2030, displayName: 'Bifrost' },
  Bitgreen: { paraId: 2048, displayName: 'Bitgreen' },
  Centrifuge: { paraId: 2031, displayName: 'Centrifuge' },
  Clover: { paraId: 2002, displayName: 'Clover' },
  Composable: { paraId: 2019, displayName: 'Composable Finance' },
  Continuum: { paraId: 3346, displayName: 'Continuum' },
  Crust: { paraId: 2008, displayName: 'Crust' },
  Darwinia: { paraId: 2046, displayName: 'Darwinia' },
  EnergyWebX: { paraId: 3345, displayName: 'Energy Web X' },
  Frequency: { paraId: 2091, displayName: 'Frequency' },
  Hashed: { paraId: 2093, displayName: 'Hashed Network' },
  Hydration: { paraId: 2034, displayName: 'Hydration' },
  Integritee: { paraId: 3359, displayName: 'Integritee Network' },
  Interlay: { paraId: 2032, displayName: 'Interlay' },
  InvArch: { paraId: 3340, displayName: 'InvArch' },
  KILT: { paraId: 2086, displayName: 'KILT Spiritnet' },
  Laos: { paraId: 3370, displayName: 'Laos' },
  Litentry: { paraId: 2013, displayName: 'Litentry' },
  Logion: { paraId: 3354, displayName: 'Logion' },
  Manta: { paraId: 2104, displayName: 'Manta' },
  Moonbeam: { paraId: 2004, displayName: 'Moonbeam' },
  Mythos: { paraId: 3369, displayName: 'Mythos' },
  NeuroWeb: { paraId: 2043, displayName: 'NeuroWeb' },
  Nodle: { paraId: 2026, displayName: 'Nodle' },
  Parallel: { paraId: 2012, displayName: 'Parallel' },
  Pendulum: { paraId: 2094, displayName: 'Pendulum' },
  Phala: { paraId: 2035, displayName: 'Phala Network' },
  Polimec: { paraId: 3344, displayName: 'Polimec' },
  Polkadex: { paraId: 2040, displayName: 'Polkadex' },
  Robonomics: { paraId: 3388, displayName: 'Robonomics' },
  SORA: { paraId: 2025, displayName: 'SORA' },
  Subsocial: { paraId: 2101, displayName: 'Subsocial' },
  t3rn: { paraId: 3333, displayName: 't3rn' },
  Unique: { paraId: 2037, displayName: 'Unique Network' },
  Zeitgeist: { paraId: 2092, displayName: 'Zeitgeist' },
} as const;

export const kusamaChainsConfig: ChainsConfig = {
  Kusama: { paraId: 2, displayName: 'Kusama' },
  AssetHub: { paraId: 1000, displayName: 'AssetHub' },
  BridgeHub: { paraId: 1002, displayName: 'BridgeHub' },
  Collectives: { paraId: 1001, displayName: 'Collectives' },
  Coretime: { paraId: 1005, displayName: 'Coretime' },
  People: { paraId: 1004, displayName: 'People' },
} as const;

// Type for chain names for both networks
export type PolkadotChainName = keyof typeof polkadotChainsConfig;
export type KusamaChainName = keyof typeof kusamaChainsConfig;

// Extract chain names automatically from the config
export const polkadotChainNames = Object.keys(polkadotChainsConfig) as PolkadotChainName[];
export const kusamaChainNames = Object.keys(kusamaChainsConfig) as KusamaChainName[];

// Create paraId to chainName mappings for easier lookup
export const polkadotParaIdToChainName = Object.fromEntries(
  Object.entries(polkadotChainsConfig).map(([chain, config]) => [config.paraId, chain])
) as Record<number, PolkadotChainName>;

export const kusamaParaIdToChainName = Object.fromEntries(
  Object.entries(kusamaChainsConfig).map(([chain, config]) => [config.paraId, chain])
) as Record<number, KusamaChainName>;

// Define the structure for the metrics of each chain
export type ChainMetrics = {
  tps: number;
  block: number;
  kbps: number;
};
