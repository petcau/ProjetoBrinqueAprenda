/**
 * Componente que exibe o resultado do jogo.
 *
 * Recebe um vetor de objetos com as propriedades name e id,
 * e uma função checkCorrectness que verifica se o item foi colocado
 * na zona correta. Retorna um JSX com o resultado do jogo.
 *
 * @param {object[]} objects - Vetor de objetos com as propriedades name e id.
 * @param {function} checkCorrectness - Função que verifica se o item foi colocado
 *                                      na zona correta.
 * @returns {JSX.Element} O JSX do resultado do jogo.
 */
const Results = ({ objects, checkCorrectness }) => (
    <div className="result">
      <h2>Resultado</h2>
      {objects.map((obj) => (
        <div key={obj.id}>
          {obj.name}: {checkCorrectness(obj) ? "✅ Correto" : "❌ Errado ou não colocado"}
        </div>
      ))}
    </div>
  );
  
  export default Results;