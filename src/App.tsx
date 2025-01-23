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

const ALPHA = 0.7;
const TARGET_WINDOW_SIZE = 30000; // 30s
const MAX_BLOCKS_STORE = 1000;

type RelayType = 'Polkadot' | 'Kusama';

interface BlockRecord {
  chainKey: string;
  blockNumber: number;
  timestamp: number;
  extrinsics: number;
  proofSize: number;
}

function calculateEma(oldValue: number, newValue: number) {
  return ALPHA * newValue + (1 - ALPHA) * oldValue;
}

// compute rolling tps, mbs, gas from last 30s
function calculateRollingMetrics(blocks: BlockRecord[]) {
  if (blocks.length < 2) {
   // console.log('debug: not enough blocks to calc rolling metrics -> returning 0');
    return { tps: 0, mbs: 0, gas: 0 };
  }

  const now = Date.now();
  const cutoff = now - TARGET_WINDOW_SIZE;
  const relevant = blocks.filter(b => b.timestamp >= cutoff);
  if (relevant.length === 0) {
  //  console.log('debug: no blocks in last 30s -> returning 0');
    return { tps: 0, mbs: 0, gas: 0 };
  }

  relevant.sort((a, b) => a.timestamp - b.timestamp);
  const timeWindow = relevant[relevant.length - 1].timestamp - relevant[0].timestamp;
  if (timeWindow <= 0) {
   // console.log('debug: timeWindow <= 0, weird data -> returning 0');
    return { tps: 0, mbs: 0, gas: 0 };
  }
  // subtract 2 for system extrinsics, but just in case ensure it's not negative
  const sumExtrinsics = relevant.reduce((acc, b) => acc + Math.max(0, b.extrinsics - 2), 0);
  const sumProofSize = relevant.reduce((acc, b) => acc + b.proofSize, 0);

  const tps = (sumExtrinsics * 1000) / timeWindow;
  const mbs = (sumProofSize * PROOF_SIZE_MB * 1000) / timeWindow;
  const gas = mbs * (MB_TO_GAS / PROOF_SIZE_MB / GAS_TO_MGAS);

  return { tps, mbs, gas };
}

const App: React.FC = () => {
  // user picks polkadot or kusama
  const [selectedRelay, setSelectedRelay] = useState<RelayType>('Polkadot');

  const consumptionData = useWeightConsumption('https://stream.freeside.network/events');

  // separate chain arrays for polkadot vs. kusama
  // do the same for blockNumber dedupe
  const blocksByRelayRef = useRef<{ Polkadot: BlockRecord[]; Kusama: BlockRecord[] }>({
    Polkadot: [],
    Kusama: [],
  });

  const lastBlockNumberByRelayRef = useRef<{
    Polkadot: Record<string, number>;
    Kusama: Record<string, number>;
  }>({
    Polkadot: {},
    Kusama: {},
  });

  // rolling totals for whichever relay is selected
  //const [rollingTps, setRollingTps] = useState(0);
  const [rollingTpsEma, setRollingTpsEma] = useState(0);
  //const [rollingMbs, setRollingMbs] = useState(0);
  const [rollingMbsEma, setRollingMbsEma] = useState(0);
  //const [rollingGas, setRollingGas] = useState(0);
  const [rollingGasEma, setRollingGasEma] = useState(0);

  // figure out chain lists
  const chainNames = selectedRelay === 'Polkadot' ? polkadotChainNames : kusamaChainNames;
  const paraIdToChainName =
    selectedRelay === 'Polkadot' ? polkadotParaIdToChainName : kusamaParaIdToChainName;

  // gather "weightData" for chain table
  const weightData: Record<PolkadotChainName | KusamaChainName, number> = chainNames.reduce(
    (acc, chain) => {
      const paraId = Object.keys(paraIdToChainName).find(k => paraIdToChainName[Number(k)] === chain);
      if (paraId) {
        const key = `${selectedRelay}-${paraId}`;
        const chainData = consumptionData[key]?.current;
        if (chainData) {
          const mandatorySize = chainData.ref_time?.mandatory ?? 0;
          const totalSize = chainData.total_proof_size ?? 0;
          const totalProof = mandatorySize + totalSize;
          acc[chain] = totalProof;
        }
      }
      return acc;
    },
    {} as Record<PolkadotChainName | KusamaChainName, number>
  );

  // immediate (non-ema) relay stats for whichever relay is selected
  let weightRelay = 0;
  let tpsRelay = 0;
  let gasRelay = 0;

  const relayChainName = selectedRelay === 'Polkadot' ? 'Polkadot' : 'Kusama';
  const relayParaId = Object.keys(paraIdToChainName).find(
    k => paraIdToChainName[Number(k)] === relayChainName
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
   // console.log('debug: consumptionData or selectedRelay changed -> updating polkadot + kusama blocks');

    // step 1: process polkadot chain data
    polkadotChainNames.forEach(chain => {
      const paraId = Object.keys(polkadotParaIdToChainName).find(
        k => polkadotParaIdToChainName[Number(k)] === chain
      );
      if (!paraId) return;
      const key = `Polkadot-${paraId}`;
      const chainData = consumptionData[key]?.current;
      if (!chainData) return;

      const blockNum = chainData.block_number;
      const ts = chainData.timestamp;
      const lastSeen = lastBlockNumberByRelayRef.current['Polkadot'][key];

      if (typeof blockNum === 'number' && ts && (lastSeen === undefined || blockNum > lastSeen)) {
        lastBlockNumberByRelayRef.current['Polkadot'][key] = blockNum;
        const mandatorySize = chainData.ref_time?.mandatory ?? 0;
        const totalSize = chainData.total_proof_size ?? 0;
        const totalProof = mandatorySize + totalSize;

        blocksByRelayRef.current['Polkadot'] = [
          ...blocksByRelayRef.current['Polkadot'],
          {
            chainKey: key,
            blockNumber: blockNum,
            timestamp: ts,
            extrinsics: chainData.extrinsics_num ?? 0,
            proofSize: totalProof,
          },
        ].slice(-MAX_BLOCKS_STORE);

      }
    });

    // step 2: process kusama chain data
    kusamaChainNames.forEach(chain => {
      const paraId = Object.keys(kusamaParaIdToChainName).find(
        k => kusamaParaIdToChainName[Number(k)] === chain
      );
      if (!paraId) return;
      const key = `Kusama-${paraId}`;
      const chainData = consumptionData[key]?.current;
      if (!chainData) return;

      const blockNum = chainData.block_number;
      const ts = chainData.timestamp;
      const lastSeen = lastBlockNumberByRelayRef.current['Kusama'][key];

      if (typeof blockNum === 'number' && ts && (lastSeen === undefined || blockNum > lastSeen)) {
        lastBlockNumberByRelayRef.current['Kusama'][key] = blockNum;
        const mandatorySize = chainData.ref_time?.mandatory ?? 0;
        const totalSize = chainData.total_proof_size ?? 0;
        const totalProof = mandatorySize + totalSize;

        blocksByRelayRef.current['Kusama'] = [
          ...blocksByRelayRef.current['Kusama'],
          {
            chainKey: key,
            blockNumber: blockNum,
            timestamp: ts,
            extrinsics: chainData.extrinsics_num ?? 0,
            proofSize: totalProof,
          },
        ].slice(-MAX_BLOCKS_STORE);

      }
    });

    // step 3: compute rolling metrics for whichever relay is selected
    const blocks = blocksByRelayRef.current[selectedRelay] || [];
   // console.log(`debug: computing rolling metrics for ${selectedRelay}, block array length = ${blocks.length}`);

    const { tps, mbs, gas } = calculateRollingMetrics(blocks);
   // setRollingTps(tps);
    setRollingTpsEma(prev => calculateEma(prev || tps, tps));
   // setRollingMbs(mbs);
    setRollingMbsEma(prev => calculateEma(prev || mbs, mbs));
   // setRollingGas(gas);
    setRollingGasEma(prev => calculateEma(prev || gas, gas));

  //  console.log('debug: set new rolling metrics ->', { tps, mbs, gas });
  }, [consumptionData, selectedRelay]);

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
            totalTps={rollingTpsEma.toFixed(2)}
            totalMbs={rollingMbsEma.toFixed(2)}
            totalGas={rollingGasEma.toFixed(2)}
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
