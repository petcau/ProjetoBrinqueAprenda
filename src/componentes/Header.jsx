import logo from "../assets/logo-portal-prime.png";
import uneb from "../assets/UNEB-logo.png";

function Header() {
  return (
    <>
      <header className="header">
        <img src={logo} alt="Brinque e aprenda" />
        <div className="authors">
          <a className="credits">Créditos</a>
          <img src={uneb} alt="UNEB" />
        </div>
      </header>
    </>
  );
}

export default Header;
