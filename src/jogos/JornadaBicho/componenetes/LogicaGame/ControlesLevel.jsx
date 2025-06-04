/**
 * Componente que renderiza botões para navega o entre níveis
 *
 * @param {{ onPrevious: function, onNext: function, isFirst: boolean, isLast: boolean }} props
 * @returns {JSX.Element}
 *
 * @prop {function} onPrevious Função chamada quando o usuario clica em "Niveis Anteriores"
 * @prop {function} onNext Função chamada quando o usu rio clica em "Proximo Nivel"
 * @prop {boolean} isFirst Indica se o usuario está no primeiro nivel
 * @prop {boolean} isLast Indica se o usuario está no último nivel
 */

const Controls = ({ onPrevious, onNext, isFirst, isLast }) => (
    <div className="Controles_JornadaPA">
      <button className="NAnterior" onClick={onPrevious} disabled={isFirst} >
        Nível Anterior
      </button>
      
    </div>
  );
  
  export default Controls;    