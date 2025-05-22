import logo from "../assets/logo-portal-prime.png";
import uneb from "../assets/UNEB-logo.png";
import { useNavigate } from "react-router-dom";

function Header() {
  const navigate = useNavigate()

  
  return (
    <>
      <header className="header">
        <img src={logo} alt="Brinque e aprenda" />
        <div className="authors">
          <button className="credits" onClick={() => {navigate('/sobre')}}  >Sobre</button>
          <img src={uneb} alt="UNEB" />
        </div>
      </header>
    </>
  );
}

export default Header;
