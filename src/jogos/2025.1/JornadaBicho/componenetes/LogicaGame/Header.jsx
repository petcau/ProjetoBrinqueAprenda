const Header = ({ level, description }) => (
  <div className="Header-Nivel-Jornada">
    <h1 className="NV">Nível {level}</h1>
    <h3 className="desc-jornada">{description}</h3>
  </div>
);

export default Header;
