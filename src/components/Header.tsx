export const Header = () => (
  <div className="titlebar">
    <div className="logo"></div>
    <div className="headerlinks">
      <a href="#">Home</a>
    </div>
    <div className="dropdown">
      <button className="dropdowntext">Polkadot</button>
      <div className="dropdowncontent">
        <a href="https://polkadot.com/get-started" target="_blank" rel="noopener noreferrer">Learn</a>
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
