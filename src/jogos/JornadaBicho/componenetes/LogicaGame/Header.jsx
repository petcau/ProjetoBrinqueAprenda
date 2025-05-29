const Header = ({ level, description, dica }) => (
    <div className="Header-Nivel-Jornada">
      <h1 className="NV">Nível {level}</h1>
      <h2 className="DESC">Descrição do Nível</h2>
      <h3>{description}</h3>
      <h2 className="DICA">Dica</h2>
      <p>{dica}</p>
    </div>
  );
  
  export default Header;