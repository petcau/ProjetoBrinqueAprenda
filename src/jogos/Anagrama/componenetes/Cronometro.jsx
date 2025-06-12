// Importa os hooks do React
import { useEffect, useRef, useState } from "react";

// Componente Cronômetro
function Cronometro({ tempoInicial = 30, onTempoEsgotado, reiniciarTrigger, somAtivo }) {
  // Estado que controla o tempo restante
  const [tempo, setTempo] = useState(tempoInicial);

  // Estado que indica se o cronômetro está ativo
  const [ativo, setAtivo] = useState(true);

  // Referência para o som de contagem regressiva
  const tickSoundRef = useRef(null);

  // Reinicia o cronômetro quando o trigger muda (ex: após reiniciar fase)
  useEffect(() => {
    setTempo(tempoInicial); // Reseta o tempo
    setAtivo(true);         // Ativa o cronômetro
  }, [reiniciarTrigger, tempoInicial]);

  // Efeito responsável por fazer a contagem regressiva
  useEffect(() => {
    // Se o cronômetro não estiver ativo, não faz nada
    if (!ativo) return;

    // Define o intervalo para diminuir 1 segundo a cada 1000ms
    const intervalo = setInterval(() => {
      setTempo((t) => {
        // Quando o tempo chega a 1 ou menos, cronômetro para
        if (t <= 1) {
          clearInterval(intervalo);  // Para o intervalo
          setAtivo(false);           // Desativa o cronômetro

          // Toca o som se estiver ativado
          if (somAtivo && tickSoundRef.current) {
            tickSoundRef.current.currentTime = 0;
            tickSoundRef.current.play();
          }

          onTempoEsgotado(); // Chama a função de tempo esgotado
          return 0;
        }

        // Toca som de contagem regressiva (tick), se ativado
        if (somAtivo && tickSoundRef.current) {
          tickSoundRef.current.currentTime = 0;
          tickSoundRef.current.play();
        }

        return t - 1; // Reduz o tempo em 1 segundo
      });
    }, 1000);

    // Limpa o intervalo ao desmontar o componente ou mudar dependências
    return () => clearInterval(intervalo);
  }, [ativo, somAtivo, onTempoEsgotado]);

  return (
    <div>
      {/* Áudio usado para som de contagem regressiva */}
      <audio ref={tickSoundRef} src="src/assets/Sons/contagem.wav" preload="auto" />

      {/* Exibe o tempo restante na tela */}
      <h3>Tempo: {tempo}s</h3>
    </div>
  );
}

// Exporta o componente para ser usado em outros arquivos
export default Cronometro;
