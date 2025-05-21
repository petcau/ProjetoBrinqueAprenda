import { useAnagrama } from "./componenetes/useAnagrama";
import AnagramaJogo from "./componenetes/AnagramaJogo";
import "./game.css";

function Anagrama() {
  const anagrama = useAnagrama();

  return (
    <main className="container">
      <div className="game-container-anagrama">
        <h1 className="title">ANAGRAMA</h1>
        <h2 className="fase">Lvl 1</h2>
        <AnagramaJogo {...anagrama} />
      </div>
    </main>
  );
}

export default Anagrama;
