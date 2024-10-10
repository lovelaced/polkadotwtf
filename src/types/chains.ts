// src/types/chains.ts
export const chainNames = ['Westend', 'Polkadot', 'Kusama', 'Paseo'] as const;

export type ChainName = typeof chainNames[number];

export type ChainMetrics = {
  tps: number;
  block: number;
  weight: number;
  kbps: number;
};
