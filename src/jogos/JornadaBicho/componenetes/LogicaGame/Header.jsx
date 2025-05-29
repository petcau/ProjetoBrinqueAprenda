const Header = ({ level, description, dica }) => (
    <div>
      <h1>Nível {level}</h1>
      <h2>Descrição do Nível</h2>
      <h3>{description}</h3>
      <h2>Dica</h2>
      <p>{dica}</p>
    </div>
  );
  
  export default Header;