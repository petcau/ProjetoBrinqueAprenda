import Letras from "./componenetes/Letras";
import PalavraTentativa from "./componenetes/PalavraTentativa";
import PalavrasDescobertas from "./componenetes/PalavrasDescobertas";
import { useAnagrama } from "./componenetes/useAnagrama";
//import dados from "./componenetes/Palavras.json"; //import o json
import Cronometro from "./componenetes/Cronometro";

import "./game.css";

function Anagrama() {
    // Pega tudo que precisa do hook useAnagrama
  const {
    letras,
    tentativa,
    descobertas,
    adicionarLetra,
    enviarPalavra,
    resetarTentativa,
    limparDescobertas,
    palavrasValidas
  } = useAnagrama();

    // Pega as palavras válidas do JSON (por exemplo, a primeira lista)
  //const palavrasValidas = dados.anagramas[0].palavrasValidas;

  return (
    <main className="container">
      <div className="game-container-anagrama">
        <h1 className="title">ANAGRAMA</h1>
        <h2 className="fase">Lvl 1</h2>
 <Cronometro
  tempoInicial={30}
  onTempoEsgotado={() => console.log("Tempo acabou!")}
  onReiniciarTempo={() => {
    resetarTentativa();
    limparDescobertas(); // agora funciona certinho
  }}
/>


     

      <Letras letras={letras} onAdicionarLetra={adicionarLetra} />
      <PalavraTentativa tentativa={tentativa} onEnviar={enviarPalavra} />
      
       

       

        
        <PalavrasDescobertas descobertas={descobertas} palavrasValidas={palavrasValidas} />

      </div>
    </main>
  );
}

export default Anagrama;
