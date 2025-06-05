import { useAnagrama } from "./componenetes/useAnagrama";
import AnagramaJogo from "./componenetes/AnagramaJogo";
import AnagramaHeader from "./componenetes/AnagramaHeader";
import "./game.css";

function Anagrama() {
  const anagrama = useAnagrama();

  return (
    <main className="container">
      <div className="game-container-anagrama">
        <AnagramaHeader nivel={anagrama.nivelAtual} />
        <AnagramaJogo {...anagrama} />
      </div>
    </main>
  );
}

export default Anagrama;