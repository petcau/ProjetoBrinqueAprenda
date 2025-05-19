
import React,{useState, useEffect, useRef} from "react";
export default function Jogo(){
    const imageUrl = './src/jogos/JogoDigitacao/game_assets/GAMEOVER.png'
    const palavras = [
  "Cachorro", "Gato", "Computador", "Programar", "Teclado", "Mouse",
  "Janela", "Monitor", "Cadeira", "Livro", "Caneta", "Papel", "Mochila",
  "Telefone", "Internet", "Javascript", "React", "Vite", "Tempo", "Digitar",
  "Desafio", "Pontuar", "Velocidade", "Precisão", "Jogo", "Digitacao"
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
            setFim(true);
        }
    }
    return(
    <>
    <div>
    { fim ?
    <><label className="textoMD">
    GAME OVER
    </label>
    <img src={imageUrl}></img></>
     : <label>
        <h1 className="textoMD">{palavra}</h1>
    <h2 className="textoMD">{count}</h2>
        <p className="textoMD">Digite o a palavra escrita acima;</p><input type="text" value={input} onChange={mudança} placeholder="Digite a palavra"/>
        <button className = 'butão' onClick={comparar}>Comparar</button>
    </label> }
    </div>
    </>
    )
}