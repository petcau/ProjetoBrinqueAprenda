import { useEffect, useRef, useState } from "react";

function Cronometro({ tempoInicial = 30, onTempoEsgotado, onReiniciarTempo, reiniciarTrigger }) {
  const [tempo, setTempo] = useState(tempoInicial);
  const [ativo, setAtivo] = useState(true);

  const tickSoundRef = useRef(null);
  const timesUpSoundRef = useRef(null);

  // *** NOVO: reinicia o cronômetro quando reiniciarTrigger mudar ***
  useEffect(() => {
    setTempo(tempoInicial);
    setAtivo(true);
  }, [reiniciarTrigger, tempoInicial]);

  useEffect(() => {
    if (!ativo) return;

    const intervalo = setInterval(() => {
      setTempo((t) => {
        if (t <= 1) {
          clearInterval(intervalo);
          setAtivo(false);

          // Toca som de tempo esgotado
          if (timesUpSoundRef.current) {
            timesUpSoundRef.current.currentTime = 0;
            timesUpSoundRef.current.play();
          }

          onTempoEsgotado();
          return 0;
        }

        // Toca som de tique-taque a cada segundo
        if (tickSoundRef.current) {
          tickSoundRef.current.currentTime = 0;
          tickSoundRef.current.play();
        }

        return t - 1;
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, [ativo, onTempoEsgotado]);

  const reiniciar = () => {
    setTempo(tempoInicial);
    setAtivo(true);
    onReiniciarTempo();
  };

  return (
    <div>
      {/* Sons */}
      <audio ref={tickSoundRef} src="src/assets/Sons/contagem.wav" preload="auto" />
      <audio ref={timesUpSoundRef} src="src/assets/Sons/contagem.wav" preload="auto" />

      {ativo ? (
        <h3>Tempo: {tempo}s</h3>
      ) : (
        <div>
          <h3>Tempo esgotado!</h3>
          <button className="botoes" onClick={reiniciar}>
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
}

export default Cronometro;
