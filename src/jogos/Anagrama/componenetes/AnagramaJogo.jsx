import Letras from "./Letras";
import PalavraTentativa from "./PalavraTentativa";
import PalavrasDescobertas from "./PalavrasDescobertas";
import Cronometro from "./Cronometro";

function AnagramaJogo({
  letras,
  tentativa,
  descobertas,
  palavrasValidas,
  adicionarLetra,
  enviarPalavra,
  resetarTentativa,
  limparDescobertas,
}) {
  return (
    <>
      <Cronometro
        tempoInicial={30}
        onTempoEsgotado={() => console.log("Tempo acabou!")}
        onReiniciarTempo={() => {
          resetarTentativa();
          limparDescobertas();
        }}
      />

      <Letras letras={letras} onAdicionarLetra={adicionarLetra} />
      <PalavraTentativa tentativa={tentativa} onEnviar={enviarPalavra} />
      <PalavrasDescobertas
        descobertas={descobertas}
        palavrasValidas={palavrasValidas}
      />
    </>
  );
}

export default AnagramaJogo;
