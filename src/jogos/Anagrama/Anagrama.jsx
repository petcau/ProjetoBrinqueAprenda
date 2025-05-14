import Letras from "./componenetes/letras";
import PalavraTentativa from "./componenetes/PalavraTentativa";
import PalavrasDescobertas from "./componenetes/PalavrasDescobertas";
import { useAnagrama } from "./componenetes/useAnagrama";
import "./game.css";

function Anagrama() {
    // Pega tudo que precisa do hook useAnagrama
  const {
    letras,
    tentativa,
    descobertas,
    adicionarLetra,
    enviarPalavra,
  } = useAnagrama();

  return (
    <main className="container">
      <div className="game-container">
        <h1 className="title">ANAGRAMA</h1>
        <h2 className="fase">Lvl 1</h2>

        <Letras letras={letras} onAdicionarLetra={adicionarLetra} />

        <PalavraTentativa tentativa={tentativa} onEnviar={enviarPalavra} />

        <PalavrasDescobertas descobertas={descobertas} />
      </div>
    </main>
  );
}

export default Anagrama;
