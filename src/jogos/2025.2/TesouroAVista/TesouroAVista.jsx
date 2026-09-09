import JogoEmbutido from '../../../componentes/JogoEmbutido';

/**
 * Tesouro a Vista — jogo de tabuleiro com quiz, loja e cenarios de ilha.
 *
 * Feito em HTML/CSS/JS puro por Mateus Nepomuceno de Paula Santos. Diferente dos
 * outros jogos estaticos do portal, este e uma pagina unica: as telas (index,
 * jogar, tabuleiro, quiz, loja, opcoes, creditos) sao trocadas por JavaScript
 * dentro do proprio index.html.
 *
 * Os arquivos ficam em `public/2025.2/TesouroAVista/`, junto com a LICENSE do
 * repositorio de origem (MIT). Ver componentes/JogoEmbutido.jsx.
 */

function TesouroAVista() {
  return (
    <JogoEmbutido url="/2025.2/TesouroAVista/index.html" titulo="Tesouro à Vista" />
  );
}

export default TesouroAVista;
