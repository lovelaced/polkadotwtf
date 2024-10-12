import React from 'react';
import { useNatsConnection } from './hooks/useNatsConnection';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MetricsTotal } from './components/MetricsTotal';
import { ChainTable } from './components/ChainTable';
import './App.css';
import { chainsConfig, paraIdToChainName, ChainName } from './types/chains';
import useWeightConsumption from './hooks/useWeightConsumption';
import { BLOCK_TIME, PROOF_SIZE_MB, MB_TO_GAS, GAS_TO_MGAS } from './constants';

const App: React.FC = () => {
  const tpsData = useNatsConnection();
  const consumptionData = useWeightConsumption('ws://192.168.1.232:9001');

  // Get chain names dynamically from the config
  const chainNames = Object.keys(chainsConfig) as ChainName[];

  // Map weight data by para_id to chain names, defaulting to 0 if no data
  const weightData: Record<ChainName, number> = chainNames.reduce((acc, chain) => {
    const paraId = Object.keys(paraIdToChainName).find((key) => paraIdToChainName[Number(key)] === chain);
    const chainData = consumptionData[Number(paraId)];
    return {
      ...acc,
      [chain]: chainData ? chainData.total_proof_size : 0,
    };
  }, {} as Record<ChainName, number>);

  const totalTps = chainNames.reduce((acc, chain) => acc + tpsData[chain].tps, 0);
  const totalMbs = chainNames.reduce((acc, chain) => {
    const chainMbs = (weightData[chain] * PROOF_SIZE_MB) / BLOCK_TIME;
    return acc + chainMbs;
  }, 0);
  const totalMGas = totalMbs * (MB_TO_GAS / PROOF_SIZE_MB / GAS_TO_MGAS);

  const tpsRelay = tpsData.Polkadot.tps;
  const weightRelay = weightData.Polkadot;
  const gasRelay = weightRelay * (MB_TO_GAS / PROOF_SIZE_MB / GAS_TO_MGAS);

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
          <MetricsTotal totalTps={formattedTotalTps} totalMbs={formattedTotalMbs} totalGas={formattedTotalGas} tpsRelay={tpsRelay} weightRelay={weightRelay} gasRelay={gasRelay}/>
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
