import React from 'react';

interface RelaySelectorProps {
  selectedRelay: string;
  onRelayChange: (relay: 'Polkadot' | 'Kusama') => void;
}

export const RelaySelector: React.FC<RelaySelectorProps> = ({ selectedRelay, onRelayChange }) => {
  return (
    <div className="relay-selector">
    <label className="relay-label">
      <input
        type="radio"
        name="relay"
        value="Polkadot"
        checked={selectedRelay === 'Polkadot'}
        onChange={() => onRelayChange('Polkadot')}
      />
      <span className="custom-radio"></span>
      Polkadot
    </label>
    
    <label className="relay-label">
      <input
        type="radio"
        name="relay"
        value="Kusama"
        checked={selectedRelay === 'Kusama'}
        onChange={() => onRelayChange('Kusama')}
      />
      <span className="custom-radio"></span>
      Kusama
    </label>
  </div>
  );
};
