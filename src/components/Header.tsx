export const Header = () => (
  <div className="titlebar">
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
    <div className="socialshare">
      <a href="https://x.com/polkadot" target="_blank" rel="noopener noreferrer">
        <div className="twitter"></div>
      </a>
    </div>
  </div>
);

export default Header;
