import React from 'react';

interface MetricsTotalProps {
  totalTps: string;
  totalMbs: string;
}

export const MetricsTotal: React.FC<MetricsTotalProps> = ({ totalTps, totalMbs }) => (
  <div className="metrics-total">
    <div className="tps-total">
      <span>Total TPS: </span>
      <span>{totalTps}</span>
    </div>
    <div className="mbs-total">
      <span>Total MB/s: </span>
      <span>{totalMbs}</span>
    </div>
  </div>
);
export default MetricsTotal;