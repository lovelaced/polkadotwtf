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
import { PROOF_SIZE_MB, MB_TO_GAS, GAS_TO_MGAS } from './constants';

const App: React.FC = () => {
  const [selectedRelay, setSelectedRelay] = useState<'Polkadot' | 'Kusama'>('Polkadot'); 

  // Fetch consumption data using the updated hook
  const consumptionData = useWeightConsumption('https://stream.freeside.network/events');

  // Set chain names and mappings based on the selected relay
  const chainNames = selectedRelay === 'Polkadot' ? polkadotChainNames : kusamaChainNames;
  const paraIdToChainName = selectedRelay === 'Polkadot' ? polkadotParaIdToChainName : kusamaParaIdToChainName;

  // Map over chainNames to calculate weight data
  const weightData: Record<PolkadotChainName | KusamaChainName, number> = chainNames.reduce((acc, chain) => {
    const paraId = Object.keys(paraIdToChainName).find((key) => paraIdToChainName[Number(key)] === chain);
    if (paraId) {
      const key = `${selectedRelay}-${paraId}`;
      const chainData = consumptionData[key]?.current;
      if (chainData) {
        const proofSize = chainData.ref_time?.mandatory ?? chainData.total_proof_size ?? 0;
        return { ...acc, [chain]: proofSize };
      }
    }
    return acc;
  }, {} as Record<PolkadotChainName | KusamaChainName, number>);

  // Calculate total TPS using extrinsics_num and block time
  const totalTps = chainNames.reduce((acc, chain) => {
    const paraId = Object.keys(paraIdToChainName).find((key) => paraIdToChainName[Number(key)] === chain);
    if (paraId) {
      const key = `${selectedRelay}-${paraId}`;
      const chainData = consumptionData[key]?.current;
      if (chainData?.extrinsics_num && chainData.block_time_seconds) {
        const tps = chainData.extrinsics_num / chainData.block_time_seconds;
        return acc + tps;
      }
    }
    return acc;
  }, 0);

  // Calculate total MB/s using weightData and block time
  const totalMbs = chainNames.reduce((acc, chain) => {
    const paraId = Object.keys(paraIdToChainName).find((key) => paraIdToChainName[Number(key)] === chain);
    if (paraId) {
      const key = `${selectedRelay}-${paraId}`;
      const chainData = consumptionData[key]?.current;
      if (chainData?.block_time_seconds) {
        const chainMbs = (weightData[chain] || 0) * PROOF_SIZE_MB / chainData.block_time_seconds;
        return acc + chainMbs;
      }
    }
    return acc;
  }, 0);

  // Calculate total MGas
  const totalMGas = totalMbs * (MB_TO_GAS / PROOF_SIZE_MB / GAS_TO_MGAS);

  // Calculate TPS for the relay chain only (Polkadot or Kusama)
  const relayChainName = selectedRelay === 'Polkadot' ? 'Polkadot' : 'Kusama';
  const relayParaId = Object.keys(paraIdToChainName).find((key) => paraIdToChainName[Number(key)] === relayChainName);
  const relayKey = relayParaId ? `${selectedRelay}-${relayParaId}` : '';
  const relayChainData = relayKey ? consumptionData[relayKey]?.current : null;

  const tpsRelay = relayChainData && relayChainData.block_time_seconds
    ? relayChainData.extrinsics_num / relayChainData.block_time_seconds
    : 0;

  const weightRelay = weightData[relayChainName] || 0;
  const gasRelay = weightRelay * PROOF_SIZE_MB / (relayChainData?.block_time_seconds || 6);

  // Format numerical outputs
  const formattedTotalTps = totalTps.toFixed(2);
  const formattedTotalMbs = totalMbs.toFixed(2);
  const formattedTotalGas = totalMGas.toFixed(2);
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
          <RelaySelector
            selectedRelay={selectedRelay}
            onRelayChange={setSelectedRelay}
          />

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
