// Move type definitions here, avoid importing anything from chainsConfig here

// ChainMetrics definition (unchanged)
export type ChainMetrics = {
    tps: number;
    block: number;
    kbps: number;
  };
  
  // ChainConfig for individual chain configurations
  export type ChainConfig = {
    paraId: number;
    displayName: string;
  };
 
  // Define the type for Chain
export type ChainsConfig = Record<string, ChainConfig>;