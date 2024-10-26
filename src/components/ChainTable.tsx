import React, { useState, useEffect, useMemo } from 'react';
import { ConsumptionUpdate } from '../types/types';
import {
  PolkadotChainName,
  KusamaChainName,
} from '../types/chains';
import { PROOF_SIZE_MB, MB_TO_GAS, MB_TO_KB, GAS_TO_MGAS } from '../constants';

interface ChainTableProps {
  consumptionData: Record<
    string,
    { current: ConsumptionUpdate; prev: ConsumptionUpdate | null }
  >;
  weightData: Record<PolkadotChainName | KusamaChainName, number>;
  chains: (PolkadotChainName | KusamaChainName)[];
  selectedRelay: 'Polkadot' | 'Kusama';
  paraIdToChainName: Record<number, PolkadotChainName | KusamaChainName>;
}

type SortColumn =
  | 'chainName'
  | 'block_number'
  | 'extrinsics_num'
  | 'gas'
  | 'weight_kb'
  | 'authorities_num';

export const ChainTable: React.FC<ChainTableProps> = ({
  consumptionData,
  weightData,
  chains,
  selectedRelay,
  paraIdToChainName,
}) => {
  const [sortConfig, setSortConfig] = useState<{ column: SortColumn | null; direction: 'asc' | 'desc' | null }>({
    column: 'extrinsics_num',
    direction: 'desc',
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    checkMobile();
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const renderLoadingIcon = () => (
    <div className="loading-bar-container">
      <div className="loading-bar"></div>
    </div>
  );

  const calculateMetrics = (chain: PolkadotChainName | KusamaChainName) => {
    const paraId = Number(
      Object.keys(paraIdToChainName).find((key) => paraIdToChainName[Number(key)] === chain)
    );
    const key = `${selectedRelay}-${paraId}`;
    const entry = consumptionData[key];
    const data = entry?.current;
  
    if (!data) {
      // Display loading icon when data is unavailable
      return {
        block_number: renderLoadingIcon(),
        extrinsics_num: renderLoadingIcon(),
        gas: renderLoadingIcon(),
        weight_kb: renderLoadingIcon(),
        authorities_num: renderLoadingIcon(),
      };
    }
  
    // Use block_time_seconds directly from the data, defaulting to 6 seconds if not provided
    const blockTimeSeconds = data.block_time_seconds || 6;
  
    // Calculate weight (MB/s), gas (MGas/s), and TPS based on block time
    const weightMb = weightData[chain] ? (weightData[chain] * PROOF_SIZE_MB) / blockTimeSeconds : 0;
    const weightKb = (weightMb * MB_TO_KB).toFixed(2); // Always format with 2 decimals
    const gas = (weightMb * (MB_TO_GAS / PROOF_SIZE_MB / GAS_TO_MGAS)).toFixed(2); // 2 decimals
    const tps = (data.extrinsics_num / blockTimeSeconds).toFixed(2); // 2 decimals
  
    return {
      block_number: data.block_number,
      extrinsics_num: tps,
      gas: gas,
      weight_kb: weightKb,
      authorities_num: data.authorities_num === 404404 ? '?' : data.authorities_num,
    };
  };
  

  const chainMetrics = useMemo(() => chains.map((chain) => ({
    chainName: chain,
    metrics: calculateMetrics(chain),
  })), [chains, consumptionData, weightData]);

  const sortedChains = useMemo(() => {
    return [...chainMetrics].sort((a, b) => {
      if (!sortConfig.column || !sortConfig.direction) return 0;

      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      if (sortConfig.column === 'chainName') return a.chainName.localeCompare(b.chainName) * direction;

      const aValue = a.metrics ? a.metrics[sortConfig.column] || 0 : 0;
      const bValue = b.metrics ? b.metrics[sortConfig.column] || 0 : 0;

      return (Number(aValue) - Number(bValue)) * direction;
    });
  }, [chainMetrics, sortConfig]);

  const requestSort = (column: SortColumn) => {
    setSortConfig((prev) => ({
      column,
      direction: prev.column === column ? (prev.direction === 'desc' ? 'asc' : 'desc') : column === 'chainName' ? 'asc' : 'desc',
    }));
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
          <th onClick={() => requestSort('block_number')} className="sortable">
            Block {renderSortIndicator('block_number')}
          </th>
          <th onClick={() => requestSort('extrinsics_num')} className="sortable">
            TPS {renderSortIndicator('extrinsics_num')}
          </th>
          <th onClick={() => requestSort('gas')} className="sortable">
            MGas/s {renderSortIndicator('gas')}
          </th>
          <th onClick={() => requestSort('weight_kb')} className="sortable">
            KB/s {renderSortIndicator('weight_kb')}
          </th>
          <th onClick={() => requestSort('authorities_num')} className="sortable">
            {isMobile ? 'Seqs' : 'Sequencers'} {renderSortIndicator('authorities_num')}
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedChains.map(({ chainName, metrics }, index) => {
          const isRelayChain = ['Polkadot', 'Kusama'].includes(chainName);

          return (
            <tr key={index} className={isRelayChain ? 'polkadot-highlight' : ''}>
              <td>{chainName}</td>
              <td>{metrics.block_number}</td>
              <td>{metrics.extrinsics_num}</td>
              <td>{metrics.gas}</td>
              <td>{metrics.weight_kb}</td>
              <td>{metrics.authorities_num}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default ChainTable;
