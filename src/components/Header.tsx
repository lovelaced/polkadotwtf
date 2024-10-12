import React, { useState, useEffect } from 'react';

export const Header = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // updates every second

    return () => clearInterval(timerId); // cleanup the timer on unmount
  }, []);

  const formatTime = (time) => {
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="titlebar">
    {/* Left section for logo and dropdown */}
    <div className="left-section">
      <div className="dropdown">
        <button className="logo"></button>
        <div className="dropdowncontent">
          <a href="https://polkadot.com/get-started" target="_blank" rel="noopener noreferrer">About this blockchain...</a>
        </div> 
      </div>
      <div className="dropdown">
        <button className="dropdowntext">File</button>
        <div className="dropdowncontent">
          <a href="https://polkadot.com/developers" target="_blank" rel="noopener noreferrer">Build</a>
          <a href="https://polkadot.subsquare.io/" target="_blank" rel="noopener noreferrer">Participate</a>
          <a href="https://app.regionx.tech" target="_blank" rel="noopener noreferrer">Buy Blockspace</a>
        </div>
      </div>
    </div>

    {/* Right section for clock and social icons */}
    <div className="right-section">
      <div className="socialshare">
        <a href="https://x.com/polkadot" target="_blank" rel="noopener noreferrer">
          <div className="twitter"></div>
        </a>
      </div>
      <div className="clock">12:45 PM</div>
    </div>
  </div>
);
};

export default Header;
