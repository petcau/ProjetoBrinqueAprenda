import { useEffect, useRef, useState } from "react";

function Cronometro({ tempoInicial = 30, onTempoEsgotado, reiniciarTrigger }) {
  const [tempo, setTempo] = useState(tempoInicial);
  const [ativo, setAtivo] = useState(true);

  const tickSoundRef = useRef(null);
  const timesUpSoundRef = useRef(null);

  // Reinicia o cronômetro quando o reiniciarTrigger mudar
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

          if (timesUpSoundRef.current) {
            timesUpSoundRef.current.currentTime = 0;
            timesUpSoundRef.current.play();
          }

          onTempoEsgotado();
          return 0;
        }

        if (tickSoundRef.current) {
          tickSoundRef.current.currentTime = 0;
          tickSoundRef.current.play();
        }

        return t - 1;
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, [ativo, onTempoEsgotado]);

  return (
    <div>
      <audio ref={tickSoundRef} src="src/assets/Sons/contagem.wav" preload="auto" />
      <audio ref={timesUpSoundRef} src="src/assets/Sons/contagem.wav" preload="auto" />

      <h3>Tempo: {tempo}s</h3>
    </div>
  );
}

export default Cronometro;
