/**
 * Componente que representa o header do jogo JornadaBicho.
 *
 * Renderiza um título com o nível corrente e uma descrição do nível.
 *
 * @param {number} level - O nível atual.
 * @param {string} description - A descrição do nível.
 *
 * @returns {JSX.Element} O componente renderizado.
 */
// 
const Header = ({ level, description }) => (
    <div>
      <h1>Nível {level}</h1>
      <h2>Descrição do Nível</h2>
      <h3>{description}</h3>
    </div>
  );
  
  export default Header;