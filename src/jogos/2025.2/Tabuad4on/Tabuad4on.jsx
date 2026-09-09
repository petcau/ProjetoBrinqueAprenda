import JogoEmbutido from '../../../componentes/JogoEmbutido';

/**
 * Tabuad4on — desafios de tabuada com niveis de dificuldade e placar de recordes.
 *
 * Feito em HTML/CSS/JS puro e multi-pagina: o index.html e uma tela de entrada
 * que leva para `tabuad4on/componentes/arquivos HTML/tela-inicial.html`, e dali a
 * navegacao segue entre as telas de modo, instrucao, questoes e pontuacao.
 * Os arquivos ficam em `public/2025.2/Tabuad4on/`; ver componentes/JogoEmbutido.jsx.
 */

function Tabuad4on() {
  return (
    <JogoEmbutido url="/2025.2/Tabuad4on/index.html" titulo="Tabuad4on" />
  );
}

export default Tabuad4on;
