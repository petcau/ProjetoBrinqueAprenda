import { useRef, useState, useEffect } from "react";
import Letras from "./Letras";
import PalavraTentativa from "./PalavraTentativa";
import PalavrasDescobertas from "./PalavrasDescobertas";
import Cronometro from "./Cronometro";
import PalavrasData from "./Palavras.json";

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
  nivelAtual,
}) {
  const timesUpSoundRef = useRef(null);
  const [somAtivo, setSomAtivo] = useState(true);
  const [tempoEsgotado, setTempoEsgotado] = useState(false);
  const [faseCompleta, setFaseCompleta] = useState(false);
  const [reiniciarTrigger, setReiniciarTrigger] = useState(0);
  const [carregandoProximaFase, setCarregandoProximaFase] = useState(false);

  const ultimaFase = nivelAtual === PalavrasData.anagramas.length - 1;

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

    if (somAtivo && timesUpSoundRef.current) {
      timesUpSoundRef.current.currentTime = 0;
      timesUpSoundRef.current.play();
    }
  };

  const handleReiniciar = () => {
    setTempoEsgotado(false);
    resetarTentativa();
    limparDescobertas();
    setReiniciarTrigger((t) => t + 1);
  };

  const handleProximaFase = () => {
    setCarregandoProximaFase(true);
    setTimeout(() => {
      handleReiniciar();
      setFaseCompleta(false);
      setTempoEsgotado(false);
      resetarTentativa();
      limparDescobertas();
      setReiniciarTrigger((t) => t + 1);
      proximoNivel();
      setCarregandoProximaFase(false);
    }, 1000);
  };

  const alternarSom = () => {
    setSomAtivo((prev) => !prev);
  };

  return (
    <div className="mesa-container">
      {/* Som de tempo esgotado */}
      <audio
        ref={timesUpSoundRef}
        src="src/assets/Sons/somDerrota.mp3"
        preload="auto"
      />

      {/* Botão para ativar/desativar som */}
      <button className="botao-som" onClick={alternarSom}>
        {somAtivo ? "🔊 Som Ativado" : "🔇 Som Desativado"}
      </button>

      {/* Cronômetro */}
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

      {/* Tela de vitória ou final */}
      {faseCompleta && (
        <div>
          <h3 className="finish">
            {ultimaFase
              ? "Parabéns! Você completou todas as fases!"
              : "Você Venceu!"}
          </h3>
          {!ultimaFase && (
            <button
              className="botoes"
              onClick={handleProximaFase}
              disabled={carregandoProximaFase}
            >
              {carregandoProximaFase ? "Carregando..." : "Próxima fase"}
            </button>
          )}
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
