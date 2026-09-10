import JogoEmbutido from '../../../componentes/JogoEmbutido';

/**
 * Palavras Magicas — jogo de formacao de palavras com tema de magia.
 *
 * Feito em HTML/CSS/JS puro. Ao contrario dos outros jogos estaticos do portal,
 * a entrada nao fica na raiz da pasta: e `componentes/index.html`, e os recursos
 * sao buscados um nivel acima, em `../game_assets/`. Por isso o caminho abaixo
 * aponta para dentro de componentes/ — mudar isso quebra todos os assets.
 *
 * Os arquivos ficam em `public/2025.2/PalavrasMagicas/`.
 * Ver componentes/JogoEmbutido.jsx.
 */

function PalavrasMagicas() {
  return (
    <JogoEmbutido
      url="/2025.2/PalavrasMagicas/componentes/index.html"
      titulo="Palavras Mágicas"
    />
  );
}

export default PalavrasMagicas;
