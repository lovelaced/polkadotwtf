import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MetricsTotal } from './components/MetricsTotal';
import { ChainTable } from './components/ChainTable';
import { RelaySelector } from './components/RelaySelector';
import './App.css';
import {
  polkadotChainNames,
  kusamaChainNames,
  polkadotParaIdToChainName,
  kusamaParaIdToChainName,
  PolkadotChainName,
  KusamaChainName,
} from './types/chains';
import useWeightConsumption from './hooks/useWeightConsumption';
import { PROOF_SIZE_MB, MB_TO_GAS, GAS_TO_MGAS } from './constants';

const ALPHA = 0.3;
const TARGET_WINDOW_SIZE = 30000; // 30s
const MAX_BLOCKS_STORE = 2000;

// standard ema
function calculateEma(oldValue: number, newValue: number) {
  return ALPHA * newValue + (1 - ALPHA) * oldValue;
}

// compute rolling tps, mbs, gas from blocks in the last 30s
function calculateRollingMetrics(
  blocks: Array<{ blockNumber: number; timestamp: number; extrinsics: number; proofSize: number }>
) {
  if (blocks.length < 2) return { tps: 0, mbs: 0, gas: 0 };

  const now = Date.now();
  const cutoff = now - TARGET_WINDOW_SIZE;
  const relevant = blocks.filter(b => b.timestamp >= cutoff);
  if (relevant.length === 0) return { tps: 0, mbs: 0, gas: 0 };

  relevant.sort((a, b) => a.timestamp - b.timestamp);
  const timeWindow = relevant[relevant.length - 1].timestamp - relevant[0].timestamp;
  if (timeWindow <= 0) return { tps: 0, mbs: 0, gas: 0 };

  // adjust extrinsics with -2 offset if desired
  const sumExtrinsics = relevant.reduce((acc, b) => acc + Math.max(0, b.extrinsics - 2), 0);
  const sumProofSize = relevant.reduce((acc, b) => acc + b.proofSize, 0);

  const tps = (sumExtrinsics * 1000) / timeWindow;
  const mbs = (sumProofSize * PROOF_SIZE_MB * 1000) / timeWindow;
  const gas = mbs * (MB_TO_GAS / PROOF_SIZE_MB / GAS_TO_MGAS);

  return { tps, mbs, gas };
}

interface BlockRecord {
  chainKey: string;
  blockNumber: number;
  timestamp: number;
  extrinsics: number;
  proofSize: number;
}

const App: React.FC = () => {
  const [selectedRelay, setSelectedRelay] = useState<'Polkadot' | 'Kusama'>('Polkadot');

  // data feed
  const consumptionData = useWeightConsumption('https://stream.freeside.network/events');

  // figure out which chains we're interested in
  const chainNames = selectedRelay === 'Polkadot' ? polkadotChainNames : kusamaChainNames;
  const paraIdToChainName =
    selectedRelay === 'Polkadot' ? polkadotParaIdToChainName : kusamaParaIdToChainName;

  // gather the "weightData" for all chains (just the mandatory + total_proof_size, for example)
  const weightData: Record<PolkadotChainName | KusamaChainName, number> = chainNames.reduce(
    (acc, chain) => {
      const paraId = Object.keys(paraIdToChainName).find(
        (key) => paraIdToChainName[Number(key)] === chain
      );
      if (paraId) {
        const key = `${selectedRelay}-${paraId}`;
        const chainData = consumptionData[key]?.current;
        if (chainData) {
          // example: combine mandatory + total_proof_size
          const mandatorySize = chainData.ref_time?.mandatory ?? 0;
          const totalSize = chainData.total_proof_size ?? 0;
          const combinedProof = mandatorySize + totalSize;
          return { ...acc, [chain]: combinedProof };
        }
      }
      return acc;
    },
    {} as Record<PolkadotChainName | KusamaChainName, number>
  );

  // store rolling metrics
  //const [rollingTps, setRollingTps] = useState(0);
  const [rollingTpsEma, setRollingTpsEma] = useState(0);

  //const [rollingMbs, setRollingMbs] = useState(0);
  const [rollingMbsEma, setRollingMbsEma] = useState(0);

  //const [rollingGas, setRollingGas] = useState(0);
  const [rollingGasEma, setRollingGasEma] = useState(0);

  // dedup blocks
  const blocksRef = useRef<BlockRecord[]>([]);
  const lastBlockNumberByChain = useRef<Record<string, number>>({});

  // we also want the immediate (non-ema) relay data
  let weightRelay = 0;
  let tpsRelay = 0;
  let gasRelay = 0;

  // figure out the relay chain's data
  const relayChainName = selectedRelay === 'Polkadot' ? 'Polkadot' : 'Kusama';
  const relayParaId = Object.keys(paraIdToChainName).find(
    (k) => paraIdToChainName[Number(k)] === relayChainName
  );
  if (relayParaId) {
    const relayKey = `${selectedRelay}-${relayParaId}`;
    const relayData = consumptionData[relayKey]?.current;
    if (relayData && relayData.block_time_seconds) {
      const blockTime = relayData.block_time_seconds || 6;
      const mandatorySize = relayData.ref_time?.mandatory ?? 0;
      const totalSize = relayData.total_proof_size ?? 0;
      weightRelay = mandatorySize + totalSize;
      tpsRelay = (relayData.extrinsics_num ?? 0) / blockTime;

      const chainMbs = (weightRelay * PROOF_SIZE_MB) / blockTime;
      gasRelay = chainMbs * (MB_TO_GAS / PROOF_SIZE_MB / GAS_TO_MGAS);
    }
  }

  useEffect(() => {
    const newBlocks: BlockRecord[] = [];

    chainNames.forEach((chain) => {
      const paraId = Object.keys(paraIdToChainName).find(
        (key) => paraIdToChainName[Number(key)] === chain
      );
      if (!paraId) return;
      const key = `${selectedRelay}-${paraId}`;
      const chainData = consumptionData[key]?.current;
      if (!chainData) return;

      const blockNum = chainData.block_number;
      const ts = chainData.timestamp;
      // only add if we haven't seen this block_number before for this chain
      if (
        typeof blockNum === 'number' &&
        ts &&
        (lastBlockNumberByChain.current[key] === undefined ||
          blockNum > lastBlockNumberByChain.current[key])
      ) {
        lastBlockNumberByChain.current[key] = blockNum;

        // combine mandatory + total_proof_size
        const mandatorySize = chainData.ref_time?.mandatory ?? 0;
        const totalSize = chainData.total_proof_size ?? 0;
        const totalProof = mandatorySize + totalSize;

        newBlocks.push({
          chainKey: key,
          blockNumber: blockNum,
          timestamp: ts,
          extrinsics: chainData.extrinsics_num ?? 0,
          proofSize: totalProof,
        });
      }
    });

    // if we actually have new blocks, compute rolling metrics
    if (newBlocks.length > 0) {
      // add them, prune old
      blocksRef.current = [...blocksRef.current, ...newBlocks].slice(-MAX_BLOCKS_STORE);

      const { tps, mbs, gas } = calculateRollingMetrics(blocksRef.current);

      //setRollingTps(tps);
      setRollingTpsEma((prev) => calculateEma(prev || tps, tps));

      //setRollingMbs(mbs);
      setRollingMbsEma((prev) => calculateEma(prev || mbs, mbs));

     // setRollingGas(gas);
      setRollingGasEma((prev) => calculateEma(prev || gas, gas));
    }
  }, [consumptionData, chainNames, paraIdToChainName, selectedRelay]);

  return (
    <div className="app-container">
      <Header />
      <div className="divider"></div>
      <div className="container largecontainer">
        <div className="windowtitle">
          <div className="windowtitlename">polkadot.wtf</div>
        </div>

        <div className="contentarea">
          <RelaySelector selectedRelay={selectedRelay} onRelayChange={setSelectedRelay} />

          <MetricsTotal
            // the rolling 30s metrics
          // rollingTps={rollingTps.toFixed(2)}
            totalTps={rollingTpsEma.toFixed(2)}
         //   rollingMbs={rollingMbs.toFixed(2)}
            totalMbs={rollingMbsEma.toFixed(2)}
          //  rollingGas={rollingGas.toFixed(2)}
            totalGas={rollingGasEma.toFixed(2)}

            // immediate relay chain-only stats (non-ema)
            tpsRelay={tpsRelay}
            weightRelay={weightRelay}
            gasRelay={gasRelay}
          />

          <div className="textbox">
            <ChainTable
              consumptionData={consumptionData}
              chains={chainNames}
              selectedRelay={selectedRelay}
              paraIdToChainName={paraIdToChainName}
              // pass in weightData for chain usage
              weightData={weightData}
            />
          </div>
        </div>
        <div className="divider"></div>
        <div className="divider"></div>
      </div>
      <Footer />
    </div>
  );
};

export default App;
