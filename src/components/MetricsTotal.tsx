import React, { useState } from 'react';

interface MetricsTotalProps {
  totalTps: string;
  totalMbs: string;
  totalGas: string;
  tpsRelay: number;
  weightRelay: number;
  gasRelay: number;
}

const metricDescriptions: Record<string, string> = {
  tps: 'TPS refers to the number of extrinsics (transactions and other state changes) included in finalized blocks per second.',
  gas: 'Polkadot has a two-dimensional gas system. One full block is 60M gas equivalent according to EVM production benchmarking.',
  mbs: 'MB/s measures the size of the proof data submitted by rollups to the relay chain for validation.',
};

export const MetricsTotal: React.FC<MetricsTotalProps> = ({
  totalTps,
  totalMbs,
  totalGas,
  tpsRelay,
  weightRelay,
  gasRelay,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const handleClick = (metric: string) => {
    setSelectedMetric((prevMetric) => (prevMetric === metric ? null : metric));
  };

  const calculateMultiplier = (total: string, relayValue: number) => {
    const totalValue = parseFloat(total);
    if (isNaN(totalValue) || relayValue === 0) {
      return '-';
    }
    return `x${(totalValue / relayValue).toFixed(2)}`;
  };

  return (
    <div className="metrics-total-container">
      <div className="metrics-total">
        <button
          className={`metric-button tps-total ${selectedMetric === 'tps' ? 'active' : ''}`}
          aria-pressed={selectedMetric === 'tps'}
          onClick={() => handleClick('tps')}
        >
          <span>TPS: </span>
          <span>{totalTps}</span>
          <div className="multiplier">
            {tpsRelay && totalTps ? calculateMultiplier(totalTps, tpsRelay) : '-'}
          </div>
        </button>
        <button
          className={`metric-button gas-total ${selectedMetric === 'gas' ? 'active' : ''}`}
          aria-pressed={selectedMetric === 'gas'}
          onClick={() => handleClick('gas')}
        >
          <span>Mgas/s: </span>
          <span>{totalGas}</span>
          <div className="multiplier">
            {gasRelay && totalGas ? calculateMultiplier(totalGas, gasRelay) : '-'}
          </div>
        </button>
        <button
          className={`metric-button mbs-total ${selectedMetric === 'mbs' ? 'active' : ''}`}
          aria-pressed={selectedMetric === 'mbs'}
          onClick={() => handleClick('mbs')}
        >
          <span>MB/s: </span>
          <span>{totalMbs}</span>
          <div className="multiplier">
            {weightRelay && totalMbs ? calculateMultiplier(totalMbs, weightRelay) : '-'}
          </div>
        </button>
      </div>
      <div className="metric-description">
        {selectedMetric ? metricDescriptions[selectedMetric] : <span>&nbsp;</span>}
      </div>
    </div>
  );
};

export default MetricsTotal;
