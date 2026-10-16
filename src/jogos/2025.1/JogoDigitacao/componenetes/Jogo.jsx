import { useCallback, useState, useEffect, useRef } from "react";
import fasesData from './fases.json';
import Semaforo from './Semaforo.jsx';

// Importe os áudios
import contagemSound from '../../../../assets/Sons/contagem.wav';
import relogioSound from '../../../../assets/Sons/relogio.mp3';
import respCorretaSound from '../../../../assets/Sons/respCorreta.mp3';
import respErradaSound from '../../../../assets/Sons/respErrada.mp3';
import somDerrotaSound from '../../../../assets/Sons/somDerrota.mp3';
import somVitoriaSound from '../../../../assets/Sons/somVitoria.mp3';


export default function Jogo({ onVoltar }) {
  // Estados do jogo
  const [faseAtual, setFaseAtual] = useState(0);
  const [palavra, setPalavra] = useState('');
  const [input, setInput] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [count, setCount] = useState(0);
  const [fim, setFim] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [palavrasUsadas, setPalavrasUsadas] = useState([]);
  const [Perdeu, setPerdeu] = useState(true);
  const [semaforoAtivo, setSemaforoAtivo] = useState(true);
  const[mudançafase, setMudançafase] = useState(false)

  // Deixa o cursor no campo assim que o semaforo libera e a cada palavra nova,
  // para a crianca sair digitando sem precisar clicar. So depois que o input
  // deixa de estar disabled, senao o foco nao pega.
  const campoRef = useRef(null);
  useEffect(() => {
    if (semaforoAtivo || mudançafase || fim) return;
    campoRef.current?.focus();
  }, [semaforoAtivo, mudançafase, fim, palavra]);
  // Referências de áudio
  const audioPrincipal = useRef(null);     // Semáforo e relógio
  const audioSecundario = useRef(null);   // Efeitos momentâneos
  const audioEvento = useRef(null);       // Vitória/derrota
  const timeoutID = useRef(null);
  

  const fase = fasesData.fases[faseAtual];
  const palavras = fase.palavras;

  const pararTodosOsAudios = () => {
    if (audioPrincipal.current) audioPrincipal.current.pause();
    if (audioSecundario.current) audioSecundario.current.pause();
    if (audioEvento.current) audioEvento.current.pause();
  };
  const playAudioPrincipal = (src, loop = false) => {
  if (audioPrincipal.current) {
    audioPrincipal.current.pause();
    audioPrincipal.current = null;
  }

  const audio = new Audio(src);
  audio.loop = loop;

  audio
    .play()
    .then(() => {
      audioPrincipal.current = audio;
    })
    .catch((err) => {
      console.error('Erro ao tentar tocar áudio:', err);
    });
};
   // Chama quando o componente desmonta
  useEffect(() => {
    return () => {
      pararTodosOsAudios();
    };
  }, [onVoltar]);

  // Função para tocar sons secundários
  const playSomSecundario = (som) => {
    if (audioSecundario.current) {
      audioSecundario.current.pause();
    }
    audioSecundario.current = new Audio(som);
    audioSecundario.current.play();
  };

  // Efeito do semáforo e áudio
  useEffect(() => {
    if (semaforoAtivo) {
    console.log("🔊 Tocando áudio do semáforo...");
    playAudioPrincipal(contagemSound);

    const timer = setTimeout(() => {
      setSemaforoAtivo(false);
      playAudioPrincipal(relogioSound, true);
    }, 3000);

    return () => clearTimeout(timer);
  }
}, [semaforoAtivo]);

  // Efeito de reinício de fase
  useEffect(() => {
    setCount(fase.tempoLimite);
    setAcertos(0);
    setFim(false);
    setMensagem('');
    setPalavrasUsadas([]);
    setSemaforoAtivo(true);
    setMudançafase(false);
    // Limpa áudios ao mudar de fase
    if (audioPrincipal.current) audioPrincipal.current.pause();
    if (audioSecundario.current) audioSecundario.current.pause();
  }, [faseAtual, fase.tempoLimite]);
  // Efeito do cronômetro
  useEffect(() => {
    if (fim || semaforoAtivo) return;
    if (mudançafase == false) {
      timeoutID.current = setTimeout(() => {
        if (count === 0) {
          setFim(true);
          setMensagem('Tempo esgotado!');
          // Toca som de derrota
          if (audioPrincipal.current) audioPrincipal.current.pause();
          audioEvento.current = new Audio(somDerrotaSound);
          audioEvento.current.play();
          return;
        }
        setCount(prev => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timeoutID.current);
  }, [count, fim, mudançafase, semaforoAtivo]);

  // Funções do jogo
  const novaPalavra = useCallback(() => {
    const palavrasDisponiveis = palavras.filter(p => !palavrasUsadas.includes(p));
    const nova = palavrasDisponiveis[Math.floor(Math.random() * palavrasDisponiveis.length)];
    setPalavra(nova.trim());
    setInput('');
    console.log(palavrasUsadas);
    setPalavrasUsadas(prev => [...prev, nova]);
  }, [palavras, palavrasUsadas]);

  useEffect(() => {
    if (palavrasUsadas.length === 0 && !fim) {
      novaPalavra();
    }
  }, [fim, novaPalavra, palavrasUsadas]);

  const mudança = (event) => {
    setInput(event.target.value);
  };

  const comparar = () => {
    if (fim || semaforoAtivo) return;

    if (input.trim().toLowerCase() === palavra.toLowerCase()) {
      setMensagem('Palavra correta!');
      playSomSecundario(respCorretaSound);
      setAcertos(prev => prev + 1);

      if (acertos + 1 >= fase.quantidadePalavras) {
        if (faseAtual + 1 < fasesData.fases.length) {
          setMensagem('Parabéns! Indo para a próxima fase.');
          setMudançafase(true);
          setTimeout(() => setFaseAtual(prev => prev + 1), 2000);
        } else {
          setFim(true);
          setPerdeu(false);
          setMensagem('Você completou todas as fases!');
          // Toca som de vitória
          if (audioPrincipal.current) audioPrincipal.current.pause();
          audioEvento.current = new Audio(somVitoriaSound);
          audioEvento.current.play();
        }
      } else {
        novaPalavra();
      }
    } else {
      setMensagem('Palavra incorreta, tente de novo!');
      playSomSecundario(respErradaSound);
    }
  };
  const renderPalavraInterativa = () => {
  return (
    <h1 className={`textoMDT ${palavra.length > 10 ? 'textoMDTgrande' : ''}`}>
      {palavra.split('').map((letra, index) => {
        const correto = input[index] && input[index].toLowerCase() === letra.toLowerCase();
        return (
          <span key={index} style={{ color: correto ? 'limegreen' : 'white' }}>
            {letra}
          </span>
        );
      })}
    </h1>
  );
};

  // Renderização
  return (
    <div>
      {semaforoAtivo && <Semaforo onComplete={() => setSemaforoAtivo(false)} />}
      {fim ? (
        <>
          <div>
            {Perdeu ? (
              <div className="imagemcontainerd">
                <p className="textoMD texto-piscando">GAME OVER</p>
                <img src={'/JornadaBicho/digitacao/GAMEOVER.png'} alt="Game Over" className="containerimgD"/>
                <p className="mensagem-derrota">{mensagem}</p>
              </div>
            ) : (
              <div className="imagemcontainerd">
                <p className="textoMD texto-piscando">Vitória</p>
                <img src={'/JornadaBicho/digitacao/EMOJIVITORIAD.png'} alt="Vitória" className="containerimgD"/>
                <p className="mensagem-derrota">{mensagem}</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="barra-info-d">
            <h2 className={`textoMD tempo-d ${count <= 10 ? "tempo-baixo" : ""}`}>{!semaforoAtivo ? `${count}s` : ''}</h2>
            <h1 className="textoMDfase">Fase {fase.fase}</h1>
          </div>
          <div className="linhaPalavra">
            {renderPalavraInterativa()}
            {fase.fase > 7 && fase.autor && (
              <span style={{ marginLeft: '10px', fontSize: '0.8em', color: 'gray', fontFamily: "Fredericka the great"}}>
                {fase.autor}
              </span>
            )}
          </div>
          <p className="textoMD">Digite a palavra escrita acima:</p>
          <input
            ref={campoRef}
            className="inputD"
            type="text"
            value={input}
            onChange={mudança}
            placeholder="Digite a palavra"
            onKeyDown={(e) => e.key === 'Enter' && comparar()}
            onPaste={(e) => e.preventDefault()}
            disabled={semaforoAtivo || mudançafase}
          />
          <p className="textoMD">{mensagem}</p>
          <p className="textoMD">Acertos: {acertos} / {fase.quantidadePalavras}</p>
        </>
      )}
    </div>
  );
}
