import JogoEmbutido from '../../../componentes/JogoEmbutido';

/**
 * ReciclaKids — jogo de separacao de residuos em cenarios (praia, praca, rua,
 * floresta).
 *
 * Feito em HTML/CSS/JS puro por D'Sordes. O index.html do jogo ja carrega as
 * telas num iframe interno, entao aqui existe um iframe dentro de outro: o de
 * fora isola o jogo do portal, o de dentro e a navegacao propria dele.
 *
 * Os arquivos ficam em `public/2025.2/ReciclaKids/`, junto com a LICENSE do
 * repositorio de origem (MIT). Ver componentes/JogoEmbutido.jsx.
 */

function ReciclaKids() {
  return (
    <JogoEmbutido url="/2025.2/ReciclaKids/index.html" titulo="ReciclaKids" />
  );
}

export default ReciclaKids;
