const Header = ({ level, description, dica }) => (
    <div className="Header-Nivel-Jornada">
      <h1 className="NV">Nível {level}</h1>
      <h3 className="desc-jornada">{description}</h3>
      <p className="p-jornada">{dica}</p>
    </div>
  );
  
  export default Header;