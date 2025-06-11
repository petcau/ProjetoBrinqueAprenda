import { useEffect, useRef, useState } from "react";

function Cronometro({ tempoInicial = 30, onTempoEsgotado, reiniciarTrigger, somAtivo }) {
  const [tempo, setTempo] = useState(tempoInicial);
  const [ativo, setAtivo] = useState(true);

  const tickSoundRef = useRef(null);

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

          if (somAtivo && tickSoundRef.current) {
            tickSoundRef.current.currentTime = 0;
            tickSoundRef.current.play();
          }

          onTempoEsgotado();
          return 0;
        }

        if (somAtivo && tickSoundRef.current) {
          tickSoundRef.current.currentTime = 0;
          tickSoundRef.current.play();
        }

        return t - 1;
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, [ativo, somAtivo, onTempoEsgotado]);

  return (
    <div>
      <audio ref={tickSoundRef} src="src/assets/Sons/contagem.wav" preload="auto" />
      <h3>Tempo: {tempo}s</h3>
    </div>
  );
}

export default Cronometro;
