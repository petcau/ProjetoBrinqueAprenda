import logo from "../assets/logo-portal-prime.png";
import uneb from "../assets/UNEB-logo.png";
import { useNavigate, useLocation } from "react-router-dom";

function Header() {
  const navigate = useNavigate()

  let location = useLocation();
  console.log(location.pathname)

  function Button() {
    if (location.pathname == '/') {
      return <button className="credits" onClick={() => { navigate('/sobre') }}>Sobre</button>
    } else if (location.pathname == '/sobre') {
      return <button className="credits" onClick={() => { navigate('/') }}  >Voltar</button>
    }
  }
  return (
    <>
      <header className="header">
        <img src={logo} alt="Brinque e aprenda" />
        <div className="authors">
          <Button />
          <img src={uneb} alt="UNEB" />
        </div>
      </header>
    </>
  );
}

export default Header;
