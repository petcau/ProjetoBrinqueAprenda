
import React,{useState, useEffect, useRef} from "react";
export default function Jogo(){
    const imageUrl = './src/jogos/JogoDigitacao/game_assets/GAMEOVER.png'
    const palavras = [
  "cachorro", "gato", "computador", "programar", "teclado", "mouse",
  "janela", "monitor", "cadeira", "livro", "caneta", "papel", "mochila",
  "telefone", "internet", "javascript", "react", "vite", "tempo", "digitar",
  "desafio", "pontuar", "velocidade", "precisão", "jogo", "digitacao"
];
    const[input, setInput]=useState('');
    const[mensagem, setmensagem]=useState('');
    const[tempo, setTempo] = useState('0');
    const [count, setCount] = useState(0);
    const timeoutID = useRef(null);
    const [fim, setFim] = useState(false);
    // Timer
    useEffect(() => {
       timeoutID.current = setTimeout(() => {
        if (count == 10) {
          clearTimeout(timeoutID.current);
          timeoutID.current = null;
          setFim(true);
          return;
        }
        setCount((count) => count + 1);
       }, 1000);
       return () => clearTimeout(timeoutID.current);
    },[count]); 
    const mudança =(event) =>{
        setInput(event.target.value);
    };
    // Aleatorizador de palavras
     const [palavra, setPalavra] = useState(() => {
    return palavras[Math.floor(Math.random() * palavras.length)];
  });
    // Compara o input do usuario com a palavra correta
    const comparar = () =>{
        if (input == palavra ) {
            alert('Palavra correta')
        }
        else{
            alert('palavra incorreta')
        }
    }
    return(
    <>
    <div>
    { fim ?
    <><label>
    GAME OVER
    </label>
    <img src={imageUrl}></img></>
     : <label>
        <h1>{palavra}</h1>
    <h2 style={{color : 'black', display :'flex', ustifyContent: 'center',
            alignItems: 'center',
         height: '10vh' }}>{count}</h2>
        Digite o a palavra escrita acima; <input type="text" value={input} onChange={mudança} placeholder="Digite a palavra"/>
        <button onClick={comparar}>Comparar</button>
    </label> }
    </div>
    </>
    )
}