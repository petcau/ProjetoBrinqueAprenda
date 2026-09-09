import { useNavigate } from "react-router-dom";
import "./game.css";

/**
 * MathRace — jogo de corrida com equacoes matematicas.
 *
 * O jogo original e uma aplicacao em JavaScript puro, multi-pagina e com canvas,
 * desenvolvida pela equipe LUDUS-LAB. Ele nao foi reescrito em React: os arquivos
 * ficam em `public/2025.2/MathRace/` e sao servidos como estao, dentro de um iframe.
 *
 * Duas consequencias praticas dessa escolha:
 * - a navegacao interna do jogo (menu, fases, placar, opcoes) acontece dentro do
 *   iframe e nao mexe na rota do portal, por isso este componente oferece o
 *   proprio botao de saida;
 * - o CSS do jogo e o do portal ficam isolados, sem risco de um sobrescrever o outro.
 */

const URL_DO_JOGO = "/2025.2/MathRace/index.html";

function MathRace() {
  const navigate = useNavigate();

  return (
    <main className="mathrace-container">
      <button
        className="mathrace-voltar"
        onClick={() => navigate("/")}
        title="Voltar para o portal Brinque e Aprenda"
      >
        &#8592; Portal
      </button>

      <iframe
        className="mathrace-frame"
        src={URL_DO_JOGO}
        title="MathRace"
        allow="autoplay; fullscreen"
      />
    </main>
  );
}

export default MathRace;
