import { useEffect, useState } from "react";

function Cronometro({ tempoInicial = 30, onTempoEsgotado, onReiniciarTempo }) {
  const [tempo, setTempo] = useState(tempoInicial);
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    if (!ativo) return;

    const intervalo = setInterval(() => {
      setTempo((t) => {
        if (t <= 1) {
          clearInterval(intervalo);
          setAtivo(false);
          onTempoEsgotado(); // Chama função externa
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, [ativo, onTempoEsgotado]);

  const reiniciar = () => {
    setTempo(tempoInicial);
    setAtivo(true);
    onReiniciarTempo(); // Resetar tentativa
  };

  return (
    <div>
      {ativo ? (
        <h3>Tempo: {tempo}s</h3>
      ) : (
        <div>
          <h3>Tempo esgotado!</h3>
          <button className='botoes'onClick={reiniciar}>Tentar novamente</button>
        </div>
      )}
    </div>
  );
}

export default Cronometro;
