import React, { useState, useEffect, useRef } from "react";
import fasesData from './fases.json';
import Semaforo from './Semaforo.jsx';

export default function Jogo() {
  const imageUrlD = './src/jogos/JogoDigitacao/game_assets/GAMEOVER.png';
  const imageUrlV = './src/jogos/JogoDigitacao/game_assets/EMOJIVITORIAD.png'

  const [faseAtual, setFaseAtual] = useState(0);
  const [palavra, setPalavra] = useState('');
  const [input, setInput] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [count, setCount] = useState(0);
  const timeoutID = useRef(null);
  const [fim, setFim] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [palavrasUsadas, setPalavrasUsadas] = useState([]);
  const [Perdeu, setPerdeu] = useState(true);
  //Semaforo
  const [semaforoAtivo, setSemaforoAtivo] = useState(true);
  const audioRef = useRef(null);

  const fase = fasesData.fases[faseAtual];
  const palavras = fase.palavras;
   useEffect(() => {
      if (semaforoAtivo) {
        const timer = setTimeout(() => {
          setSemaforoAtivo(false);
          
        }, 6000); // 6s totais do semáforo
        return () => clearTimeout(timer);
      }
    }, [semaforoAtivo, faseAtual]);

  useEffect(() => {
    novaPalavra();
    setCount(fase.tempoLimite);
    setAcertos(0);
    setFim(false);
    setMensagem('');
    setPalavrasUsadas([]);
    setSemaforoAtivo(true);
  }, [faseAtual]);

  useEffect(() => {
     if (fim || semaforoAtivo) return;

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
  }, [count, fim, semaforoAtivo, fase.tempoLimite]);

  const novaPalavra = () => {
    const palavrasDisponiveis = palavras.filter(p => !palavrasUsadas.includes(p));
    const nova = palavrasDisponiveis[Math.floor(Math.random() * palavrasDisponiveis.length)];
    setPalavra(nova);
    setInput('');
    setPalavrasUsadas(prev => [...prev, nova]);
    console.log(palavrasUsadas);
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
          setPerdeu(false);
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
      {semaforoAtivo && <Semaforo onComplete={() => setSemaforoAtivo(false)} />}
      {fim ? (
        <>
        {Perdeu ?(
        <div className="imagemcontainerd">
          <p className="textoMD" class ="texto-piscando">GAME OVER</p>
          <img src={imageUrlD} alt="Game Over" className="containerimgD"/>
          <p className="textoMD">{mensagem}</p>
        </div>) : (
          <div className="imagemcontainerd">
          <p className="textoMD" class ="texto-piscando">Vitoria</p>
          <img src={imageUrlV} alt="Game Over" className="containerimgD"/>
          <p className="textoMD">{mensagem}</p>
        </div>
        )}
        </>
      ) : (
        
          <><h1 className="textoMDfase">Fase {fase.fase}</h1>
          <div className="linhaPalavra">
              <h1 className="textoMDT">{palavra}</h1>
          {semaforoAtivo ? null : <h2 className="textoMD">{count}s</h2>}
          {fase.fase > 7 && fase.autor &&(
      <span style={{ marginLeft: '10px', fontSize: '0.8em', color: 'gray', fontFamily: "Fredericka the great"}}>
        {fase.autor}
      </span>
    )}
          </div>
          <p className="textoMD">Digite a palavra escrita acima:</p>
          <input
          disabled ={semaforoAtivo}
            className="inputD"
            type="text"
            value={input}
            onChange={mudança}
            placeholder="Digite a palavra"
            onKeyDown={(e) => e.key === 'Enter' && comparar()}
              onPaste={(e) => e.preventDefault()}
  />
            <p className="textoMD">{mensagem}</p>
            <p className="textoMD">Acertos: {acertos} / {fase.quantidadePalavras}</p>

            </>
            
        
      )}
    </div>
  );
}