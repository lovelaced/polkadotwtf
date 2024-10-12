import React, { useState } from 'react';
import { ChainMetrics, ChainName } from '../types/chains';
import { BLOCK_TIME, PROOF_SIZE_MB, MB_TO_GAS, MB_TO_KB } from '../constants';

interface ChainTableProps {
  tpsData: Record<ChainName, ChainMetrics>;
  weightData: Record<ChainName, number>;
  chains: ChainName[];
}

type SortColumn = keyof ChainMetrics | 'chainName' | 'gas' | 'weight';

export const ChainTable: React.FC<ChainTableProps> = ({ tpsData, weightData, chains }) => {
  // Initialize sorting with gas, largest first (desc)
  const [sortConfig, setSortConfig] = useState<{ column: SortColumn; direction: 'asc' | 'desc' }>({
    column: 'gas',
    direction: 'desc',
  });

  const renderLoadingIcon = () => (
    <div className="loading-bar-container">
      <div className="loading-bar"></div>
    </div>
  );

  // Function to check if the row has fully loaded data
  const isFullyLoaded = (chain: ChainName) => {
    const data = tpsData[chain];
    return data.block > 0 && data.tps > 0 && weightData[chain] > 0;
  };

  // Sort chains based on fully loaded status first, then based on the selected column
  const sortedChains = [...chains].sort((a, b) => {
    const aFullyLoaded = isFullyLoaded(a);
    const bFullyLoaded = isFullyLoaded(b);

    // Prioritize fully loaded rows
    if (aFullyLoaded && !bFullyLoaded) return -1;
    if (!aFullyLoaded && bFullyLoaded) return 1;

    // If both rows have the same loaded status, apply sorting based on user-selected column
    const column = sortConfig.column;
    const direction = sortConfig.direction === 'asc' ? 1 : -1;

    if (column === 'chainName') {
      return a.localeCompare(b) * direction;
    }

    // Sorting logic for tpsData (block, tps, etc.)
    if (column !== 'weight' && column !== 'gas') {
      const aValue = tpsData[a][column as keyof ChainMetrics];
      const bValue = tpsData[b][column as keyof ChainMetrics];
      return ((aValue as number) - (bValue as number)) * direction;
    }

    // Sorting logic for weightData and gas
    if (column === 'gas') {
      const aGas = weightData[a] * (MB_TO_GAS / PROOF_SIZE_MB);
      const bGas = weightData[b] * (MB_TO_GAS / PROOF_SIZE_MB);
      return (aGas - bGas) * direction;
    }

    const aWeight = weightData[a] ?? 0;
    const bWeight = weightData[b] ?? 0;

    return (aWeight - bWeight) * direction;
  });

  // Calculate gas for each chain based on weightData (KB/s)
  const calculateGas = (weight: number) => (weight * (MB_TO_GAS / PROOF_SIZE_MB)).toFixed(2);

  const requestSort = (column: SortColumn) => {
    if (sortConfig.column === column) {
      const newDirection = sortConfig.direction === 'desc' ? 'asc' : 'desc';
      setSortConfig({ column, direction: newDirection });
    } else {
      setSortConfig({ column, direction: 'desc' });
    }
  };

  const renderSortIndicator = (column: SortColumn) => {
    if (sortConfig.column !== column || !sortConfig.direction) return null;
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  return (
    <table className="chain-table">
      <thead>
        <tr>
          <th onClick={() => requestSort('chainName')} className="sortable">
            Chain {renderSortIndicator('chainName')}
          </th>
          <th onClick={() => requestSort('block')} className="sortable">
            Block {renderSortIndicator('block')}
          </th>
          <th onClick={() => requestSort('tps')} className="sortable">
            TPS {renderSortIndicator('tps')}
          </th>
          <th onClick={() => requestSort('gas')} className="sortable">
            Gas/s {renderSortIndicator('gas')}
          </th>
          <th onClick={() => requestSort('weight')} className="sortable">
            KB/s {renderSortIndicator('weight')}
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedChains.map((chain, index) => {
          const data = tpsData[chain];
          const weight_mb = (weightData[chain] * PROOF_SIZE_MB) / BLOCK_TIME; // Convert percentage to MB/s
          const weight_kb = weight_mb * MB_TO_KB;
          const gas = weight_mb > 0 ? calculateGas(weight_mb) : renderLoadingIcon(); // Correct Gas calculation

          return (
            <tr key={index} className={chain === 'Polkadot' ? 'polkadot-highlight' : ''}>
              <td>{chain}</td>
              <td>{data.block > 0 ? data.block : renderLoadingIcon()}</td>
              <td>{data.tps > 0 ? data.tps.toFixed(2) : renderLoadingIcon()}</td>
              <td>{typeof gas === 'string' ? gas : renderLoadingIcon()}</td>
              <td>{weight_kb > 0 ? weight_kb.toFixed(2) : renderLoadingIcon()}</td>
            </tr>
          );
        })}
        {[...Array(40)].map((_, i) => (
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
