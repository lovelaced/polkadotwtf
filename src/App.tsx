import React, { useState } from 'react';
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
import { BLOCK_TIME, PROOF_SIZE_MB, MB_TO_GAS, GAS_TO_MGAS } from './constants';

const App: React.FC = () => {
  const [selectedRelay, setSelectedRelay] = useState<'Polkadot' | 'Kusama'>('Polkadot'); // Relay selector

  const consumptionData = useWeightConsumption('http://192.168.1.232:9001/events');

  // Select the chain names and mappings based on the selected relay
  const chainNames = selectedRelay === 'Polkadot' ? polkadotChainNames : kusamaChainNames;
  const paraIdToChainName = selectedRelay === 'Polkadot' ? polkadotParaIdToChainName : kusamaParaIdToChainName;

  // Map over chainNames to calculate TPS and weight data
  const weightData: Record<PolkadotChainName | KusamaChainName, number> = chainNames.reduce((acc, chain) => {
    const paraId = Object.keys(paraIdToChainName).find(key => paraIdToChainName[Number(key)] === chain);
    if (paraId) {
      const chainData = consumptionData[Number(paraId)];
      if (chainData?.relay === selectedRelay) {
        const proofSize = chainData?.ref_time?.mandatory ?? chainData?.total_proof_size ?? 0;
        return { ...acc, [chain]: proofSize };
      }
    }
    return acc;
  }, {} as Record<PolkadotChainName | KusamaChainName, number>);

  // Calculate total TPS using extrinsics_num from consumptionData
  const totalTps = chainNames.reduce((acc, chain) => {
    const paraId = Object.keys(paraIdToChainName).find(key => paraIdToChainName[Number(key)] === chain);
    const chainData = consumptionData[Number(paraId)];
    if (chainData?.relay === selectedRelay && chainData?.extrinsics_num) {
      const tps = chainData.extrinsics_num / BLOCK_TIME;
      return acc + tps;
    }
    return acc;
  }, 0);

  // Calculate total MB/s using weightData
  const totalMbs = chainNames.reduce((acc, chain) => {
    const chainMbs = (weightData[chain] || 0) * PROOF_SIZE_MB / BLOCK_TIME;
    if (!Number.isNaN(chainMbs)) {
      return acc + chainMbs;
    }
    return acc;
  }, 0);

  // Calculate total MGas
  const totalMGas = totalMbs * (MB_TO_GAS / PROOF_SIZE_MB / GAS_TO_MGAS);

  // Calculate TPS for the relay chain only (Polkadot or Kusama)
  const relayChainName = selectedRelay === 'Polkadot' ? 'Polkadot' : 'Kusama';
  const relayParaId = Object.keys(paraIdToChainName).find(key => paraIdToChainName[Number(key)] === relayChainName);
  const relayChainData = relayParaId ? consumptionData[Number(relayParaId)] : null;
  const tpsRelay = relayChainData?.extrinsics_num ? (relayChainData.extrinsics_num / BLOCK_TIME) : 0;

  const weightRelay = weightData[relayChainName] || 0;
  const gasRelay = weightRelay * PROOF_SIZE_MB / BLOCK_TIME * (MB_TO_GAS / PROOF_SIZE_MB / GAS_TO_MGAS);

  const formattedTotalTps = totalTps.toFixed(2);
  const formattedTotalMbs = totalMbs.toFixed(2);
  const formattedTotalGas = totalMGas.toFixed(2);

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
            tpsRelay={tpsRelay}
            weightRelay={weightRelay}
            gasRelay={gasRelay}
          />

          <div className="textbox">
            <ChainTable consumptionData={consumptionData} weightData={weightData} chains={chainNames} />
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
