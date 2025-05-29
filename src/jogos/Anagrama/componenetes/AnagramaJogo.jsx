import { useRef, useState, useEffect } from "react";
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
  proximoNivel,
}) {
  const timesUpSoundRef = useRef(null);
  const [tempoEsgotado, setTempoEsgotado] = useState(false);
  const [faseCompleta, setFaseCompleta] = useState(false);
  const [reiniciarTrigger, setReiniciarTrigger] = useState(0);
  const [carregandoProximaFase, setCarregandoProximaFase] = useState(false); // 👈 novo estado

  // Verifica se o jogador completou a fase
  useEffect(() => {
    if (
      palavrasValidas.length > 0 &&
      descobertas.length === palavrasValidas.length
    ) {
      setFaseCompleta(true);
    }
  }, [descobertas, palavrasValidas]);

  const handleTempoEsgotado = () => {
    setTempoEsgotado(true);

    if (timesUpSoundRef.current) {
      timesUpSoundRef.current.currentTime = 0;
      timesUpSoundRef.current.play();
    }
  };

  const handleReiniciar = () => {
    setTempoEsgotado(false);
    resetarTentativa();
    limparDescobertas();
    setReiniciarTrigger((t) => t + 1); // força reinício do cronômetro
  };

  const handleProximaFase = () => {
    setCarregandoProximaFase(true); 
    setTimeout(() => {
      handleReiniciar();
      setFaseCompleta(false);
      setTempoEsgotado(false);
      resetarTentativa();
      limparDescobertas();
      setReiniciarTrigger(t => t + 1); 
      proximoNivel(); // Avança fase
      setCarregandoProximaFase(false); 
    }, 1000); 
  };

  return (
    <div className="mesa-container">
      {/* Som de tempo esgotado */}
      <audio
        ref={timesUpSoundRef}
        src="src/assets/Sons/somDerrota.mp3"
        preload="auto"
      />

      {/* Cronômetro aparece só se a fase estiver ativa */}
      {!faseCompleta && !tempoEsgotado && (
        <Cronometro
          tempoInicial={30}
          onTempoEsgotado={handleTempoEsgotado}
          reiniciarTrigger={reiniciarTrigger}
        />
      )}

      {/* Tela de derrota */}
      {tempoEsgotado && (
        <div>
          <h3 className="finish">Tempo Esgotado!</h3>
          <button className="botoes" onClick={handleReiniciar}>
            Tentar novamente
          </button>
        </div>
      )}

      {/* Tela de sucesso */}
      {faseCompleta && (
        <div>
          <h3 className="finish">Você Venceu!</h3>
          <button
            className="botoes"
            onClick={handleProximaFase}
            disabled={carregandoProximaFase} // 👈 botão desabilitado enquanto carrega
          >
            {carregandoProximaFase ? "Carregando..." : "Próxima fase"}
          </button>
        </div>
      )}

      <Letras
        letras={letras}
        onAdicionarLetra={adicionarLetra}
        desabilitado={tempoEsgotado || faseCompleta}
      />
      <PalavraTentativa
        tentativa={tentativa}
        onEnviar={enviarPalavra}
        desabilitado={tempoEsgotado || faseCompleta}
      />
      <PalavrasDescobertas
        descobertas={descobertas}
        palavrasValidas={palavrasValidas}
      />
    </div>
  );
}

export default AnagramaJogo;
