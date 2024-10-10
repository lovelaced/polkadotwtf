export const Header = () => (
  <div className="titlebar">
    <div className="dropdown">
    <button className="logo"></button>
    <div className="dropdowncontent">
        <a href="https://polkadot.com/get-started" target="_blank" rel="noopener noreferrer">About this blockchain...</a>
    </div> 
    </div>
    <div className="headerlinks">
      <a href="https://polkadot.wtf">Home</a>
    </div>
    <div className="dropdown">
      <button className="dropdowntext">Polkadot</button>
      <div className="dropdowncontent">
        <a href="https://polkadot.com/developers" target="_blank" rel="noopener noreferrer">Build</a>
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
