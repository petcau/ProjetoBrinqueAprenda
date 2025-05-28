import { useAnagrama } from "./componenetes/useAnagrama";
import AnagramaJogo from "./componenetes/AnagramaJogo";
import "./game.css";

function Anagrama() {
  const anagrama = useAnagrama();

  return (
    <main className="container">
      <div className="game-container-anagrama">
        <h1 className="title">ANAGRAMA</h1>
           <button className="botao_voltar_menu"
  onClick={() => window.location.href = "/"} >
  Voltar para o menu
</button>


        <div className="fase">Nível {anagrama.nivelAtual + 1}</div>

        <AnagramaJogo {...anagrama} />
      </div>
    </main>
  );
}

export default Anagrama;
