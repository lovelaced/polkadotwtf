// Move type definitions here, avoid importing anything from chainsConfig here
// Define the shape of the data you're receiving (e.g., WeightConsumption)
export type ConsumptionUpdate = {
    para_id: number;
    relay: string;
    block_number: number;
    extrinsics_num: number;
    authorities_num: number;
    timestamp: number;
    block_time_seconds: number;
    ref_time: {
      normal: number;
      operational: number;
      mandatory: number;
    };
    proof_size: {
      normal: number;
      operational: number;
      mandatory: number;
    };
    total_proof_size: number;
  }
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