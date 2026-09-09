import somDerrotaSound from "../../../../assets/Sons/somDerrota.mp3";
// Importa hooks do React e componentes do jogo
import { useRef, useState, useEffect } from "react";
import Letras from "./Letras";
import PalavraTentativa from "./PalavraTentativa";
import PalavrasDescobertas from "./PalavrasDescobertas";
import Cronometro from "./Cronometro";
import PalavrasData from "./Palavras.json";

// Componente principal do jogo de anagrama
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
  // Estado para controlar se o som está ativado
  const [somAtivo, setSomAtivo] = useState(true);

  // Referência para o som de tempo esgotado
  const timesUpSoundRef = useRef(null);

  // Estado para controlar se o tempo acabou
  const [tempoEsgotado, setTempoEsgotado] = useState(false);

  // Estado para saber se o jogador completou a fase
  const [faseCompleta, setFaseCompleta] = useState(false);

  // Trigger para reiniciar o cronômetro
  const [reiniciarTrigger, setReiniciarTrigger] = useState(0);

  // Estado de carregamento ao passar para próxima fase
  const [carregandoProximaFase, setCarregandoProximaFase] = useState(false);

  // Verifica se é a última fase do jogo
  const ultimaFase = nivelAtual === PalavrasData.anagramas.length - 1;

  // Verifica automaticamente se todas as palavras já foram descobertas
  useEffect(() => {
    if (
      palavrasValidas.length > 0 &&
      descobertas.length === palavrasValidas.length
    ) {
      setFaseCompleta(true); // Marca a fase como completa
    }
  }, [descobertas, palavrasValidas]);

  // Função chamada quando o tempo acaba
  const handleTempoEsgotado = () => {
    setTempoEsgotado(true);

    // Toca som de tempo esgotado, se estiver ativado
    if (somAtivo && timesUpSoundRef.current) {
      timesUpSoundRef.current.currentTime = 0;
      timesUpSoundRef.current.play();
    }
  };

  // Reinicia a fase atual
  const handleReiniciar = () => {
    setTempoEsgotado(false);
    resetarTentativa();
    limparDescobertas();
    setReiniciarTrigger((t) => t + 1); // Atualiza o trigger para reiniciar o cronômetro
  };

  // Vai para a próxima fase
  const handleProximaFase = () => {
    setCarregandoProximaFase(true); // Mostra "carregando..."
    setTimeout(() => {
      handleReiniciar(); // Limpa dados da fase anterior
      setFaseCompleta(false);
      proximoNivel(); // Avança para a próxima fase
      setCarregandoProximaFase(false);
    }, 1000);
  };

  return (
    <div className="mesa-container">
      {/* 🔊 Som de tempo esgotado */}
      <audio
        ref={timesUpSoundRef}
        src={somDerrotaSound}
        preload="auto"
      />

      {/* ⏱️ Cronômetro visível apenas durante a fase ativa */}
      {!faseCompleta && !tempoEsgotado && (
        <Cronometro
          tempoInicial={30} // Tempo de 30 segundos
          onTempoEsgotado={handleTempoEsgotado}
          reiniciarTrigger={reiniciarTrigger}
          somAtivo={somAtivo}
        />
      )}

      {/* ❌ Tela exibida quando o tempo acaba */}
      {tempoEsgotado && (
        <div>
          <h3 className="finish">Tempo Esgotado!</h3>
          <button className="botoes" onClick={handleReiniciar}>
            Tentar novamente
          </button>
        </div>
      )}

      {/* ✅ Tela exibida quando o jogador completa a fase */}
      {faseCompleta && (
        <div>
          <h3 className="finish">
            {ultimaFase
              ? "Parabéns! Você completou todas as fases!"
              : "Você Venceu!"}
          </h3>
          {/* Botão para ir para a próxima fase (se ainda houver fases) */}
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

      {/* 🔤 Letras disponíveis para formar palavras */}
      <Letras
        letras={letras}
        onAdicionarLetra={adicionarLetra}
        desabilitado={tempoEsgotado || faseCompleta}
      />

      {/* 📝 Área onde aparece a tentativa atual do jogador */}
      <PalavraTentativa
        tentativa={tentativa}
        onEnviar={enviarPalavra}
        desabilitado={tempoEsgotado || faseCompleta}
      />

      {/* 📜 Lista de palavras que já foram descobertas */}
      <PalavrasDescobertas
        descobertas={descobertas}
        palavrasValidas={palavrasValidas}
      />
    </div>
  );
}

// Exporta o componente principal do jogo
export default AnagramaJogo;
