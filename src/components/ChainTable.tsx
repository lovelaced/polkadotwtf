import React, { useState } from 'react';
import { ChainMetrics, ChainName } from '../types/chains';

interface ChainTableProps {
  tpsData: Record<ChainName, ChainMetrics>;
  chains: ChainName[];
}

type SortColumn = keyof ChainMetrics | 'chainName';

export const ChainTable: React.FC<ChainTableProps> = ({ tpsData, chains }) => {
  const [sortConfig, setSortConfig] = useState<{ column: SortColumn; direction: 'asc' | 'desc' | null } | null>(null);

  const renderLoadingIcon = () => (
    <div className="loading-bar-container">
      <div className="loading-bar"></div>
    </div>
  );

  const sortedChains = [...chains].sort((a, b) => {
    if (!sortConfig || !sortConfig.direction) return 0; // No sorting applied
    const column = sortConfig.column;
    const direction = sortConfig.direction === 'asc' ? 1 : -1;

    if (column === 'chainName') {
      return a.localeCompare(b) * direction;
    }

    // Ensure the comparison is done numerically
    const aValue = tpsData[a][column as keyof ChainMetrics];
    const bValue = tpsData[b][column as keyof ChainMetrics];

    // If the value is a number, ensure it's compared correctly, or handle loading values
    return ((aValue as number) - (bValue as number)) * direction;
  });

  const requestSort = (column: SortColumn) => {
    if (sortConfig && sortConfig.column === column) {
      // Cycle through states: desc -> asc -> null (default state)
      const newDirection = sortConfig.direction === 'desc' ? 'asc' : sortConfig.direction === 'asc' ? null : 'desc';
      setSortConfig(newDirection ? { column, direction: newDirection } : null);
    } else {
      // Start sorting with descending
      setSortConfig({ column, direction: 'desc' });
    }
  };

  const renderSortIndicator = (column: SortColumn) => {
    if (!sortConfig || sortConfig.column !== column || !sortConfig.direction) return null;
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  return (
    <table className="chain-table">
      <thead>
        <tr>
          <th onClick={() => requestSort('chainName')} className="sortable">
            Chain Name {renderSortIndicator('chainName')}
          </th>
          <th onClick={() => requestSort('block')} className="sortable">
            Block Number {renderSortIndicator('block')}
          </th>
          <th onClick={() => requestSort('tps')} className="sortable">
            TPS {renderSortIndicator('tps')}
          </th>
          <th onClick={() => requestSort('weight')} className="sortable">
            Weight {renderSortIndicator('weight')}
          </th>
          <th onClick={() => requestSort('kbps')} className="sortable">
            KB/s {renderSortIndicator('kbps')}
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedChains.map((chain, index) => {
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
        {[...Array(45)].map((_, i) => (
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
