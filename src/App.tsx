import React, { useState, useEffect } from 'react';
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

// ema smoothing factor
const ALPHA = 0.3;

// helper to calculate ema
function calculateEma(oldValue: number, newValue: number): number {
  return ALPHA * newValue + (1 - ALPHA) * oldValue;
}

const App: React.FC = () => {
  const [selectedRelay, setSelectedRelay] = useState<'Polkadot' | 'Kusama'>('Polkadot');

  // fetch consumption data
  const consumptionData = useWeightConsumption('https://stream.freeside.network/events');

  // determine chain names and mappings
  const chainNames = selectedRelay === 'Polkadot'
    ? polkadotChainNames
    : kusamaChainNames;

  const paraIdToChainName = selectedRelay === 'Polkadot'
    ? polkadotParaIdToChainName
    : kusamaParaIdToChainName;

  // calculate proof-size-based weights
  const weightData: Record<PolkadotChainName | KusamaChainName, number> = chainNames.reduce(
    (acc, chain) => {
      const paraId = Object.keys(paraIdToChainName).find(
        (key) => paraIdToChainName[Number(key)] === chain
      );
      if (paraId) {
        const key = `${selectedRelay}-${paraId}`;
        const chainData = consumptionData[key]?.current || {};
        const proofSize = chainData.ref_time?.mandatory ?? chainData.total_proof_size ?? 0;
        return { ...acc, [chain]: proofSize };
      }
      return acc;
    },
    {} as Record<PolkadotChainName | KusamaChainName, number>
  );

  // naive tps and mbs calculations
  const totalTps = chainNames.reduce((acc, chain) => {
    const paraId = Object.keys(paraIdToChainName).find(
      (key) => paraIdToChainName[Number(key)] === chain
    );
    if (paraId) {
      const key = `${selectedRelay}-${paraId}`;
      const chainData = consumptionData[key]?.current || {};
      const extrinsicsNum = chainData.extrinsics_num || 0;
      const blockTimeSec = chainData.block_time_seconds || 0;
      if (blockTimeSec > 0) {
        return acc + extrinsicsNum / blockTimeSec;
      }
    }
    return acc;
  }, 0);

  const totalMbs = chainNames.reduce((acc, chain) => {
    const paraId = Object.keys(paraIdToChainName).find(
      (key) => paraIdToChainName[Number(key)] === chain
    );
    if (paraId) {
      const key = `${selectedRelay}-${paraId}`;
      const chainData = consumptionData[key]?.current || {};
      const blockTimeSec = chainData.block_time_seconds || 0;
      const chainProofSize = weightData[chain] || 0;
      if (blockTimeSec > 0) {
        return acc + (chainProofSize * PROOF_SIZE_MB) / blockTimeSec;
      }
    }
    return acc;
  }, 0);

  const totalMGas = totalMbs * (MB_TO_GAS / PROOF_SIZE_MB / GAS_TO_MGAS);

  // relay chain-specific stats
  const relayChainName = selectedRelay === 'Polkadot' ? 'Polkadot' : 'Kusama';
  const relayParaId = Object.keys(paraIdToChainName).find(
    (key) => paraIdToChainName[Number(key)] === relayChainName
  );
  const relayKey = relayParaId ? `${selectedRelay}-${relayParaId}` : '';
  const relayChainData = relayKey ? consumptionData[relayKey]?.current || {} : {};

  const tpsRelay = relayChainData.block_time_seconds
    ? (relayChainData.extrinsics_num || 0) / relayChainData.block_time_seconds
    : 0;

  const weightRelay = weightData[relayChainName] || 0;
  const gasRelay = weightRelay * PROOF_SIZE_MB / (relayChainData.block_time_seconds || 6);

  // store ema values and reset on relay change
  const [emaTps, setEmaTps] = useState(totalTps);
  const [emaMbs, setEmaMbs] = useState(totalMbs);
  const [emaMGas, setEmaMGas] = useState(totalMGas);

  // recalculate ema whenever raw totals change
  useEffect(() => {
    setEmaTps((prev) => calculateEma(prev, totalTps));
    setEmaMbs((prev) => calculateEma(prev, totalMbs));
    setEmaMGas((prev) => calculateEma(prev, totalMGas));
  }, [totalTps, totalMbs, totalMGas]);

  // reset ema when relay changes
  useEffect(() => {
    setEmaTps(totalTps);
    setEmaMbs(totalMbs);
    setEmaMGas(totalMGas);
  }, [selectedRelay]);

  // format for display
  const formattedTotalTps = emaTps.toFixed(2);
  const formattedTotalMbs = emaMbs.toFixed(2);
  const formattedTotalGas = emaMGas.toFixed(2);
  const formattedTpsRelay = tpsRelay.toFixed(2);
  const formattedGasRelay = gasRelay.toFixed(2);

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
            totalTps={formattedTotalTps}
            totalMbs={formattedTotalMbs}
            totalGas={formattedTotalGas}
            tpsRelay={parseFloat(formattedTpsRelay)}
            weightRelay={weightRelay}
            gasRelay={parseFloat(formattedGasRelay)}
          />

          <div className="textbox">
            <ChainTable
              consumptionData={consumptionData}
              weightData={weightData}
              chains={chainNames}
              selectedRelay={selectedRelay}
              paraIdToChainName={paraIdToChainName}
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

