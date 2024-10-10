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

const BLOCK_TIME = 6; // Block time in seconds

const App = () => {
  const [tpsData, setTpsData] = useState<Record<ChainName, ChainMetrics>>({
    Westend: { tps: 0, block: 0, weight: 0, kbps: 0 },
    Polkadot: { tps: 0, block: 0, weight: 0, kbps: 0 },
    Kusama: { tps: 0, block: 0, weight: 0, kbps: 0 },
    Paseo: { tps: 0, block: 0, weight: 0, kbps: 0 },
  });

  const sc = new StringCodec();

  const totalTps = chains.reduce((acc, chain) => acc + tpsData[chain].tps, 0);
  const formattedTotalTps = totalTps.toFixed(2);

  const totalMbs = chains.reduce((acc, chain) => acc + tpsData[chain].kbps / 1024, 0); // Assuming KB/s
  const formattedTotalMbs = totalMbs.toFixed(2);

  useEffect(() => {
    const setupNatsConnection = async () => {
      const nc = await connect({ servers: ['wss://dev.dotsentry.xyz/ws'] });

      const subscriptions = await Promise.all(
        chains.map((chain) => ({
          blockContentSub: nc.subscribe(`${chain}.*.*.*.Blocks.*.BlockContent`),
        }))
      );

      subscriptions.forEach(async (subObj: any, chainIndex: number) => {
        for await (const msg of subObj.blockContentSub) {
          const blockData = sc.decode(msg.data);
          const parsedData = JSON.parse(blockData);
          const chain = chains[chainIndex];

          const extrinsicsCount = parsedData.extrinsics.length;
          const tps = (extrinsicsCount / BLOCK_TIME).toFixed(2);
          const weight = Math.floor(Math.random() * 1000);
          const kbps = Math.random() * 10;

          setTpsData((prevData) => ({
            ...prevData,
            [chain]: { ...prevData[chain], tps: parseFloat(tps), weight, kbps },
          }));
        }
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
            <a href="https://polkadot.com/get-started" target="_blank" rel="noopener noreferrer">Learn</a>
            <a href="https://polkadot.com/developers" target="_blank" rel="noopener noreferrer" >Build</a>
          </div>
        </div>
        <div className="socialshare">
        <a href="https://x.com/polkadot" target="_blank" rel="noopener noreferrer">
          <div className="twitter"></div>
          </a>
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
          {/* TPS and MB/s Total Box */}
          <div className="metrics-total">
            <div className="tps-total">
              <span>Total TPS: </span>
              <span>{formattedTotalTps}</span>
            </div>
            <div className="mbs-total">
              <span>Total MB/s: </span>
              <span>{formattedTotalMbs}</span>
            </div>
          </div>

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
                  <tr key={index} className={chain === 'Polkadot' ? 'polkadot-highlight' : ''}>
                    <td>{chain}</td>
                    <td>{tpsData[chain].block}</td>
                    <td>{tpsData[chain].tps.toFixed(2)}</td>
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

      {/* Bottom Panel / Footer */}
      <div className="footer">
        <div className="footer-button">
          <a href="#">Feedback</a>
        </div>
        <div className="footer-button">
          <a href="#">Add Chain</a>
        </div>
        <div className="footer-button">
          <a href="#">Source Code</a>
        </div>
        <div className="footer-text">polkadot.wtf</div>
      </div>
    </div>
  );
};

export default App;
