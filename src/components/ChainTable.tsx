import React from 'react';
import { ChainMetrics, ChainName } from '../types/ChainMetrics';

interface ChainTableProps {
  tpsData: Record<ChainName, ChainMetrics>;
  chains: ChainName[];
}

export const ChainTable: React.FC<ChainTableProps> = ({ tpsData, chains }) => {
  const renderLoadingIcon = () => (
        <div className="loading-bar-container">
          <div className="loading-bar"></div>
        </div>
      );

  return (
    <table className="chain-table">
      <thead>
        <tr>
          <th>Chain Name</th>
          <th>Block Number</th>
          <th>TPS</th>
          <th>Weight</th>
          <th>KB/s</th>
        </tr>
      </thead>
      <tbody>
        {chains.map((chain, index) => {
          const data = tpsData[chain];
          return (
            <tr key={index} className={chain === 'Polkadot' ? 'polkadot-highlight' : ''}>
              <td>{chain}</td>
              <td>{data.block > 0 ? data.block : renderLoadingIcon()}</td>
              <td>{data.tps > 0 ? data.tps.toFixed(2) : renderLoadingIcon()}</td>
              <td>{data.weight > 0 ? data.weight : renderLoadingIcon()}</td>
              <td>{data.kbps > 0 ? data.kbps.toFixed(2) : renderLoadingIcon()}</td>
            </tr>
          );
        })}
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
  );
};
export default ChainTable;