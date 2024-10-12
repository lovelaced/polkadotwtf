// Time and data size constants
export const BLOCK_TIME = 6; // Block time in seconds
export const PROOF_SIZE_MB = 5; // 5MB of proof size
export const MB_TO_GAS = 60_000_000; // 60M gas is 5MB
export const GAS_TO_MGAS = 1_000_000; // 1M gas is 1MGas

// Derived constants
export const KB_TO_GAS = MB_TO_GAS / (PROOF_SIZE_MB * 1024); // KB to gas conversion
export const MB_TO_KB = 1024; // 1MB = 1024KB
export const PROOF_PER_SECOND = PROOF_SIZE_MB / BLOCK_TIME; // MB/s per proof
