import { useState, useEffect } from 'react';

export const Header = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // updates every second

    return () => clearInterval(timerId); // cleanup the timer on unmount
  }, []);

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="titlebar">
      {/* Left section for logo and dropdown */}
      <div className="left-section">
        <div className="dropdown">
          <div className="logo"></div>
          <div className="dropdowncontent">
            <a href="https://polkadot.com/get-started" target="_blank" rel="noopener noreferrer">
              About this blockchain...
            </a>
          </div>
        </div>
        <div className="dropdown">
          <button className="dropdowntext">File</button>
          <div className="dropdowncontent">
            <a href="https://dotcodeschool.com" target="_blank" rel="noopener noreferrer">
              Build
            </a>
            <a href="https://polkadot.subsquare.io/" target="_blank" rel="noopener noreferrer">
              Participate
            </a>
            <a href="https://app.regionx.tech" target="_blank" rel="noopener noreferrer">
              Buy Blockspace
            </a>
          </div>
        </div>
      </div>

      {/* Right section for clock and social icons */}
      <div className="right-section">
        <div className="xlink">
          <a href="https://x.com/polkadot" target="_blank" rel="noopener noreferrer">
            <div className="xlogo"></div>
          </a>
        </div>
        {/* Call formatTime with the current time */}
        <div className="clock">{formatTime(currentTime)}</div>
      </div>
    </div>
  );
};

export default Header;
