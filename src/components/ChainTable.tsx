import React, { useState } from 'react';
import { PolkadotChainName, KusamaChainName, polkadotParaIdToChainName, kusamaParaIdToChainName } from '../types/chains';
import { BLOCK_TIME, PROOF_SIZE_MB, MB_TO_GAS, MB_TO_KB, GAS_TO_MGAS } from '../constants';

interface ChainTableProps {
  consumptionData: Record<number, { block_number: number, extrinsics_num: number, total_proof_size: number }>;
  weightData: Record<PolkadotChainName | KusamaChainName, number>;
  chains: (PolkadotChainName | KusamaChainName)[];
}

type SortColumn = 'chainName' | 'block_number' | 'extrinsics_num' | 'gas' | 'weight';

export const ChainTable: React.FC<ChainTableProps> = ({ consumptionData, weightData, chains }) => {
  const [sortConfig, setSortConfig] = useState<{ column: SortColumn | null; direction: 'asc' | 'desc' | null }>({
    column: 'extrinsics_num', // Set TPS (extrinsics_num) as default sort column
    direction: 'desc',
  });

  const renderLoadingIcon = () => (
    <div className="loading-bar-container">
      <div className="loading-bar"></div>
    </div>
  );

  const isFullyLoaded = (chain: PolkadotChainName | KusamaChainName) => {
    const paraId = Object.keys(polkadotParaIdToChainName).find(key => polkadotParaIdToChainName[Number(key)] === chain)
      || Object.keys(kusamaParaIdToChainName).find(key => kusamaParaIdToChainName[Number(key)] === chain);
    const data = consumptionData[Number(paraId)];
    return data?.block_number > 0 && data?.extrinsics_num > 0 && weightData[chain] > 0;
  };

  const calculateGas = (weight: number) => (weight * (MB_TO_GAS / PROOF_SIZE_MB / GAS_TO_MGAS)).toFixed(2);

  const sortedChains = [...chains].sort((a, b) => {
    const aFullyLoaded = isFullyLoaded(a);
    const bFullyLoaded = isFullyLoaded(b);

    if (aFullyLoaded && !bFullyLoaded) return -1;
    if (!aFullyLoaded && bFullyLoaded) return 1;

    if (!sortConfig.column || !sortConfig.direction) return 0;

    const column = sortConfig.column;
    const direction = sortConfig.direction === 'asc' ? 1 : -1;

    const paraIdA = Object.keys(polkadotParaIdToChainName).find(key => polkadotParaIdToChainName[Number(key)] === a)
      || Object.keys(kusamaParaIdToChainName).find(key => kusamaParaIdToChainName[Number(key)] === a);
    const paraIdB = Object.keys(polkadotParaIdToChainName).find(key => polkadotParaIdToChainName[Number(key)] === b)
      || Object.keys(kusamaParaIdToChainName).find(key => kusamaParaIdToChainName[Number(key)] === b);

    if (column === 'block_number' || column === 'extrinsics_num') {
      const aValue = consumptionData[Number(paraIdA)]?.[column];
      const bValue = consumptionData[Number(paraIdB)]?.[column];
      return (aValue - bValue) * direction;
    }

    if (column === 'gas') {
      const aGas = weightData[a] * (MB_TO_GAS / PROOF_SIZE_MB);
      const bGas = weightData[b] * (MB_TO_GAS / PROOF_SIZE_MB);
      return (aGas - bGas) * direction;
    }

    const aWeight = weightData[a] ?? 0;
    const bWeight = weightData[b] ?? 0;
    return (aWeight - bWeight) * direction;
  });

  const requestSort = (column: SortColumn) => {
    if (sortConfig.column === column) {
      const newDirection = sortConfig.direction === 'desc' ? 'asc' : sortConfig.direction === 'asc' ? null : 'desc';
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
          <th onClick={() => requestSort('block_number')} className="sortable">
            Block {renderSortIndicator('block_number')}
          </th>
          <th onClick={() => requestSort('extrinsics_num')} className="sortable">
            TPS {renderSortIndicator('extrinsics_num')}
          </th>
          <th onClick={() => requestSort('gas')} className="sortable">
            MGas/s {renderSortIndicator('gas')}
          </th>
          <th onClick={() => requestSort('weight')} className="sortable">
            KB/s {renderSortIndicator('weight')}
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedChains.map((chain, index) => {
          const paraId = Object.keys(polkadotParaIdToChainName).find(key => polkadotParaIdToChainName[Number(key)] === chain)
            || Object.keys(kusamaParaIdToChainName).find(key => kusamaParaIdToChainName[Number(key)] === chain);
          const data = consumptionData[Number(paraId)];
          if (!data) return null;

          const weight_mb = (weightData[chain] * PROOF_SIZE_MB) / BLOCK_TIME;
          const weight_kb = weight_mb * MB_TO_KB;
          const gas = weight_mb > 0 ? calculateGas(weight_mb) : renderLoadingIcon();

          return (
            <tr key={index} className={chain === 'Polkadot' ? 'polkadot-highlight' : ''}>
              <td>{chain}</td>
              <td>{data?.block_number || renderLoadingIcon()}</td>
              <td>{data?.extrinsics_num ? (data.extrinsics_num / BLOCK_TIME).toFixed(2) : renderLoadingIcon()}</td>
              <td>{typeof gas === 'string' ? gas : renderLoadingIcon()}</td>
              <td>{weight_kb > 0 ? weight_kb.toFixed(2) : renderLoadingIcon()}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default ChainTable;
