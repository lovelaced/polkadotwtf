import React from 'react';

interface MetricsTotalProps {
  totalTps: string;
  totalMbs: string;
  totalGas: string;
  tpsRelay: number;
  weightRelay: number;
  gasRelay: number;
}

export const MetricsTotal: React.FC<MetricsTotalProps> = ({ totalTps, totalMbs, totalGas, tpsRelay, weightRelay, gasRelay }) => (
  <div className="metrics-total">
    <div className="tps-total">
      <span>TPS: </span>
      <span>{totalTps}</span>
      <div className="multiplier">x{(parseFloat(totalTps) / tpsRelay).toFixed(2)}</div>
    </div>
    <div className="gas-total">
      <span>Mgas/s: </span>
      <span>{totalGas}</span>
      <div className="multiplier">x{(parseFloat(totalGas) / gasRelay).toFixed(2)}</div>
    </div>
    <div className="mbs-total">
      <span>MB/s: </span>
      <span>{totalMbs}</span>
      <div className="multiplier">x{(parseFloat(totalMbs) / weightRelay).toFixed(2)}</div>
    </div>
  </div>
);

export default MetricsTotal;
