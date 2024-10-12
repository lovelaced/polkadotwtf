import React, { useState } from 'react';
import { useNatsConnection } from './hooks/useNatsConnection';
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

  const tpsData = useNatsConnection(selectedRelay);
  const consumptionData = useWeightConsumption('ws://192.168.1.232:9001');

  // Select the chain names and mappings based on the selected relay
  const chainNames = selectedRelay === 'Polkadot' ? polkadotChainNames : kusamaChainNames;
  const paraIdToChainName = selectedRelay === 'Polkadot' ? polkadotParaIdToChainName : kusamaParaIdToChainName;

  const weightData: Record<PolkadotChainName | KusamaChainName, number> = chainNames.reduce((acc, chain) => {
    // Get the paraId from the mapping
    const paraId = Object.keys(paraIdToChainName).find(key => paraIdToChainName[Number(key)] === chain);

    if (paraId) {
      // Find the corresponding chain data using para_id
      const chainData = consumptionData[Number(paraId)];

      // Only process chains that match the selected relay (Polkadot or Kusama)
      if (chainData?.relay === selectedRelay) {
        // Safely retrieve proof size, falling back to 0 if not present
        const proofSize = chainData?.ref_time?.mandatory ?? chainData?.total_proof_size ?? 0;

        return {
          ...acc,
          [chain]: proofSize,
        };
      }
    }

    // Return the accumulator unchanged if no data is available
    return acc;
  }, {} as Record<PolkadotChainName | KusamaChainName, number>);

  // Calculate total TPS, MB/s, and Gas using the weightData
  const totalTps = chainNames.reduce((acc, chain) => acc + (tpsData[chain]?.tps || 0), 0);
  const totalMbs = chainNames.reduce((acc, chain) => {
    const chainMbs = (weightData[chain] || 0) * PROOF_SIZE_MB / BLOCK_TIME;
    if (Number.isNaN(chainMbs)) {
      return acc;
    }
    return acc + chainMbs;
  }, 0);

  const totalMGas = totalMbs * (MB_TO_GAS / PROOF_SIZE_MB / GAS_TO_MGAS);

  // Retrieve metrics for the selected relay
  const tpsRelay = tpsData[selectedRelay]?.tps || 0;
  const weightRelay = weightData[selectedRelay] || 0;
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
          <RelaySelector
            selectedRelay={selectedRelay}
            onRelayChange={setSelectedRelay}
          />

          <MetricsTotal
            totalTps={formattedTotalTps}
            totalMbs={formattedTotalMbs}
            totalGas={formattedTotalGas}
            tpsRelay={tpsRelay}
            weightRelay={weightRelay}
            gasRelay={gasRelay}
          />

          <div className="textbox">
            <ChainTable tpsData={tpsData} weightData={weightData} chains={chainNames} />
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
