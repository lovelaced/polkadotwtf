import React from 'react';
import { useNatsConnection } from './hooks/useNatsConnection';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MetricsTotal } from './components/MetricsTotal';
import { ChainTable } from './components/ChainTable';
import './App.css';
import { ChainName } from './types/ChainMetrics';

const chains: ChainName[] = ['Westend', 'Polkadot', 'Kusama', 'Paseo'];

const App: React.FC = () => {
  const tpsData = useNatsConnection();

  const totalTps = chains.reduce((acc, chain) => acc + tpsData[chain].tps, 0);
  const formattedTotalTps = totalTps.toFixed(2);

  const totalMbs = chains.reduce((acc, chain) => acc + tpsData[chain].kbps / 1024, 0); // Assuming KB/s
  const formattedTotalMbs = totalMbs.toFixed(2);

  return (
    <div className="app-container">
      <Header />
      <div className="divider"></div>
      <div className="container largecontainer">
        <div className="windowtitle">
          <div className="windowtitlename">polkadot.wtf - built by erin</div>
        </div>

        <div className="contentarea">
          <MetricsTotal totalTps={formattedTotalTps} totalMbs={formattedTotalMbs} />
          <div className="textbox">
            <ChainTable tpsData={tpsData} chains={chains} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default App;
