import { useEffect, useState } from 'react';
import { connect, StringCodec } from 'https://cdn.jsdelivr.net/npm/nats.ws@1.10.0/esm/nats.js';
import './contentstyle.css'; // main content styles

type ChainMetrics = {
  tps: number;
  block: number;
  weight: number;
  kbps: number;
};

type ChainName = 'Westend' | 'Polkadot' | 'Kusama' | 'Paseo';

const chains: ChainName[] = ['Westend', 'Polkadot', 'Kusama', 'Paseo'];

const App = () => {
  const [tpsData, setTpsData] = useState<Record<ChainName, ChainMetrics>>({
    Westend: { tps: 0, block: 0, weight: 0, kbps: 0 },
    Polkadot: { tps: 0, block: 0, weight: 0, kbps: 0 },
    Kusama: { tps: 0, block: 0, weight: 0, kbps: 0 },
    Paseo: { tps: 0, block: 0, weight: 0, kbps: 0 },
  });

  const sc = new StringCodec();

  useEffect(() => {
    const tpsTracker: Record<ChainName, { count: number; lastUpdated: number }> = {
      Westend: { count: 0, lastUpdated: Date.now() },
      Polkadot: { count: 0, lastUpdated: Date.now() },
      Kusama: { count: 0, lastUpdated: Date.now() },
      Paseo: { count: 0, lastUpdated: Date.now() },
    };

    const updateTPS = (chain: ChainName, extrinsicsCount: number) => {
      const now = Date.now();
      const chainStats = tpsTracker[chain];

      if (now - chainStats.lastUpdated >= 1000) {
        const tps = chainStats.count;
        const block = Math.floor(Math.random() * 100000); // mock block number
        const weight = Math.floor(Math.random() * 1000); // mock weight
        const kbps = Math.random() * 10; // mock kb/s

        setTpsData((prevData) => ({
          ...prevData,
          [chain]: { tps, block, weight, kbps },
        }));

        chainStats.count = 0;
        chainStats.lastUpdated = now;
      }

      chainStats.count += extrinsicsCount;
    };

    const handleMessageForTPS = (msg: any) => {
      const blockData = sc.decode(msg.data);
      const parsedData = JSON.parse(blockData);
      const chain = msg.subject.split('.')[0] as ChainName;
      const extrinsicsCount = parsedData.extrinsics.length;

      updateTPS(chain, extrinsicsCount);
    };

    const setupNatsConnection = async () => {
      const nc = await connect({ servers: ['wss://dev.dotsentry.xyz/ws'] });

      const subscriptions = await Promise.all(
        chains.map((chain) =>
          nc.subscribe(`${chain}.*.*.*.Blocks.*.BlockContent`),
        )
      );

      subscriptions.forEach(async (sub: any) => {
        for await (const msg of sub) handleMessageForTPS(msg);
      });
    };

    setupNatsConnection();
  }, []);

  return (
    <div className="app-container">
      {/* Title Bar */}
      <div className="titlebar">
        <div className="logo"></div>
        <div className="headerlinks">
          <a href="#">Home</a>
        </div>
        <div className="dropdown">
          <button className="dropdowntext">Polkadot</button>
          <div className="dropdowncontent">
            <a href="#">Learn</a>
            <a href="#">Build</a>
          </div>
        </div>
        <div className="socialshare">
          <div className="twitter"></div>
        </div>
        <div className="currentTime" id="currentTime"></div>
      </div>
      <div className="divider"></div>
      {/* Main Window */}
      <div className="container largecontainer">
        <div className="windowtitle">
          <div className="windowtitlename">polkadot.wtf - built by erin</div>
        </div>

        {/* Content Area */}
        <div className="contentarea">
          <div className="textbox">
            <table className="chain-table">
              <thead>
                <tr>
                  <th>Chain Name</th>
                  <th>Block</th>
                  <th>TPS</th>
                  <th>Weight</th>
                  <th>KB/s</th>
                </tr>
              </thead>
              <tbody>
                {chains.map((chain, index) => (
                  <tr key={index}>
                    <td>{chain}</td>
                    <td>{tpsData[chain].block}</td>
                    <td>{tpsData[chain].tps}</td>
                    <td>{tpsData[chain].weight}</td>
                    <td>{tpsData[chain].kbps.toFixed(2)}</td>
                  </tr>
                ))}
                {[...Array(5)].map((_, i) => (
                  <tr key={`placeholder-${i}`}>
                    <td>Future Chain {i + 1}</td>
                    <td>--</td>
                    <td>--</td>
                    <td>--</td>
                    <td>--</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="bottompanel"></div>
    </div>
  );
};

export default App;
