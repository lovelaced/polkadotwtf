import React, { useState, useEffect } from 'react';
import { PolkadotChainName, KusamaChainName, polkadotParaIdToChainName, kusamaParaIdToChainName } from '../types/chains';
import { BLOCK_TIME, PROOF_SIZE_MB, MB_TO_GAS, MB_TO_KB, GAS_TO_MGAS } from '../constants';

interface ChainTableProps {
    consumptionData: Record<number, { block_number: number; extrinsics_num: number; total_proof_size: number; authorities_num: number }>;
    weightData: Record<PolkadotChainName | KusamaChainName, number>;
    chains: (PolkadotChainName | KusamaChainName)[];
}

type SortColumn = 'chainName' | 'block_number' | 'extrinsics_num' | 'gas' | 'weight' | 'authorities_num';

export const ChainTable: React.FC<ChainTableProps> = ({ consumptionData, weightData, chains }) => {
    const [sortConfig, setSortConfig] = useState<{ column: SortColumn | null; direction: 'asc' | 'desc' | null }>({
        column: 'extrinsics_num', // Set TPS (extrinsics_num) as default sort column
        direction: 'desc',
    });

    const [lastKnownData, setLastKnownData] = useState<
        Record<PolkadotChainName | KusamaChainName, { block_number: number; extrinsics_num: number; gas: string; weight_kb: string; authorities_num: number }>
    >({});

    const renderLoadingIcon = () => (
        <div className="loading-bar-container">
            <div className="loading-bar"></div>
        </div>
    );

    const updateLastKnownData = (chain: PolkadotChainName | KusamaChainName, data: any) => {
        setLastKnownData((prevData) => ({
            ...prevData,
            [chain]: {
                block_number: data.block_number ?? prevData[chain]?.block_number ?? 0,
                extrinsics_num: data.extrinsics_num ?? prevData[chain]?.extrinsics_num ?? 0,
                gas: data.gas ?? prevData[chain]?.gas ?? renderLoadingIcon(),
                weight_kb: data.weight_kb ?? prevData[chain]?.weight_kb ?? renderLoadingIcon(),
                authorities_num: data.authorities_num !== undefined
                    ? (data.authorities_num === 404404 ? '?' : data.authorities_num)
                    : prevData[chain]?.authorities_num ?? renderLoadingIcon(),
            },
        }));
    };

    const calculateGas = (weight: number) => (weight * (MB_TO_GAS / PROOF_SIZE_MB / GAS_TO_MGAS)).toFixed(2);

    useEffect(() => {
        // Update last known data every time new consumption data comes in
        chains.forEach((chain) => {
            const paraId =
                Object.keys(polkadotParaIdToChainName).find((key) => polkadotParaIdToChainName[Number(key)] === chain) ||
                Object.keys(kusamaParaIdToChainName).find((key) => kusamaParaIdToChainName[Number(key)] === chain);

            if (paraId) {
                const data = consumptionData[Number(paraId)];
                const weight_mb = weightData[chain] ? (weightData[chain] * PROOF_SIZE_MB) / BLOCK_TIME : null;
                const weight_kb = weight_mb ? weight_mb * MB_TO_KB : null;
                const gas = weight_mb ? calculateGas(weight_mb) : null;

                updateLastKnownData(chain, {
                    block_number: data?.block_number || null,
                    extrinsics_num: data?.extrinsics_num || null,
                    gas: gas || null,
                    weight_kb: weight_kb?.toFixed(2) || null,
                    authorities_num: data?.authorities_num || null,
                });
            }
        });
    }, [consumptionData, weightData, chains]);

    const sortedChains = [...chains].sort((a, b) => {
        const aData = lastKnownData[a];
        const bData = lastKnownData[b];
        // Check if both chains have fully loaded data
        const aFullyLoaded = aData?.block_number && aData?.extrinsics_num && aData?.gas && aData?.weight_kb && aData?.authorities_num;
        const bFullyLoaded = bData?.block_number && bData?.extrinsics_num && bData?.gas && bData?.weight_kb && bData?.authorities_num;

        // Always prioritize fully loaded rows over partially loaded rows
        if (aFullyLoaded && !bFullyLoaded) return -1;
        if (!aFullyLoaded && bFullyLoaded) return 1;

        // If both are fully loaded or both are partially loaded, apply the usual sorting
        if (!sortConfig.column || !sortConfig.direction) return 0;

        const column = sortConfig.column;
        const direction = sortConfig.direction === 'asc' ? 1 : -1;

        if (column === 'block_number' || column === 'extrinsics_num' || column === 'authorities_num') {
            const aValue = lastKnownData[a]?.[column] || 0;
            const bValue = lastKnownData[b]?.[column] || 0;
            return (aValue - bValue) * direction;
        }

        if (column === 'gas') {
            const aGas = parseFloat(lastKnownData[a]?.gas || '0');
            const bGas = parseFloat(lastKnownData[b]?.gas || '0');
            return (aGas - bGas) * direction;
        }

        const aWeight = parseFloat(lastKnownData[a]?.weight_kb || '0');
        const bWeight = parseFloat(lastKnownData[b]?.weight_kb || '0');
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
                    <th onClick={() => requestSort('authorities_num')} className="sortable">
                        Sequencers {renderSortIndicator('authorities_num')}
                    </th>
                </tr>
            </thead>
            <tbody>
                {sortedChains.map((chain, index) => {
                    const lastData = lastKnownData[chain] || {};
                    const isRelayChain = chain === 'Polkadot' || chain === 'Kusama'; // Check if it's a relay chain

                    return (
                        <tr key={index} className={isRelayChain || chain === 'AssetHub' ? 'polkadot-highlight' : ''}>
                            <td>{chain}</td>
                            <td>{lastData.block_number || renderLoadingIcon()}</td>
                            <td>{lastData.extrinsics_num ? (lastData.extrinsics_num / BLOCK_TIME).toFixed(2) : renderLoadingIcon()}</td>
                            <td>{lastData.gas || renderLoadingIcon()}</td>
                            <td>{lastData.weight_kb || renderLoadingIcon()}</td>
                            <td>
                                {isRelayChain
                                    ? 'N/A' // Display "N/A" for Polkadot or Kusama
                                    : lastData.authorities_num === 404404
                                    ? '?' // Show "?" if authorities_num is 404404
                                    : lastData.authorities_num !== undefined
                                    ? lastData.authorities_num // Show the number if available
                                    : renderLoadingIcon()}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

export default ChainTable;
