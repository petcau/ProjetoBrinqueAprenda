import React, { useState, useEffect, useRef } from "react";
import fasesData from './fases.json';

export default function Jogo() {
  const imageUrl = './src/jogos/JogoDigitacao/game_assets/GAMEOVER.png';

  const [faseAtual, setFaseAtual] = useState(0);
  const [palavra, setPalavra] = useState('');
  const [input, setInput] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [count, setCount] = useState(0);
  const timeoutID = useRef(null);
  const [fim, setFim] = useState(false);
  const [acertos, setAcertos] = useState(0);

  const fase = fasesData.fases[faseAtual];
  const palavras = fase.palavras;

  useEffect(() => {
    novaPalavra();
    setCount(fase.tempoLimite);
    setAcertos(0);
    setFim(false);
    setMensagem('');
  }, [faseAtual]);

  useEffect(() => {
    if (fim) return;

    timeoutID.current = setTimeout(() => {
      if (count == 0) {
        clearTimeout(timeoutID.current);
        setFim(true);
        setMensagem('Tempo esgotado!');
        return;
      }
      setCount(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timeoutID.current);
  }, [count, fim, fase.tempoLimite]);

  const novaPalavra = () => {
    const nova = palavras[Math.floor(Math.random() * palavras.length)];
    setPalavra(nova);
    setInput('');
  };

  const mudança = (event) => setInput(event.target.value);

  const comparar = () => {
    if (fim) return;

    if (input.trim().toLowerCase() === palavra.toLowerCase()) {
      setMensagem('Palavra correta!');
      setAcertos(prev => prev + 1);

      if (acertos + 1 >= fase.quantidadePalavras) {
        if (faseAtual + 1 < fasesData.fases.length) {
          setMensagem('Parabéns! Indo para a próxima fase.');
          setTimeout(() => {
            setFaseAtual(prev => prev + 1);
          }, 2000);
        } else {
          setFim(true);
          setMensagem('Você completou todas as fases!');
        }
      } else {
        novaPalavra();
      }
    } else {
      setMensagem('Palavra incorreta, tente de novo!');
    }
  };

  return (
    <div>
      <h1 className="textoMD">Fase {fase.fase}</h1>
      {fim ? (
        <>
          <label className="textoMD">GAME OVER</label>
          <img src={imageUrl} alt="Game Over" />
          <p className="textoMD">{mensagem}</p>
          {faseAtual + 1 < fasesData.fases.length && (
            <button className="botao" onClick={() => setFaseAtual(prev => prev + 1)}>
              Próxima Fase
            </button>
          )}
        </>
      ) : (
        <label>
          <h1 className="textoMD">{palavra}</h1>
          <h2 className="textoMD">Tempo: {count}s</h2>
          <p className="textoMD">Digite a palavra escrita acima:</p>
          <input
           className="inputD"
            type="text"
            value={input}
            onChange={mudança}
            placeholder="Digite a palavra"
            onKeyDown={(e) => e.key === 'Enter' && comparar()}
          />
          <p className="textoMD">{mensagem}</p>
          <p className="textoMD">Acertos: {acertos} / {fase.quantidadePalavras}</p>
        </label>
      )}
    </div>
  );
}