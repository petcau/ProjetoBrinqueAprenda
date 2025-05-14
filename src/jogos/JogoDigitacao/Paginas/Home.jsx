
// Para mais tarde ser transferido para os componentes e um menu sera feito
import React,{useState, useEffect, useRef} from "react";
export default function Home(){

    const palavra = "dog";
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
    <h1>Dog</h1>
    <h2 style={{color : 'black', display :'flex', ustifyContent: 'center',
            alignItems: 'center',
            height: '10vh' }}>{count}</h2>
    <label>
        Digite o a palavra escrita acima; <input type="text" value={input} onChange={mudança} placeholder="Digite a palavra"/>
    </label>
    <button onClick={comparar}>Comparar</button>
    </>
    )
}