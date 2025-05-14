import React,{useState, useEffect} from "react";
export default function Jogo(){
    const palavra = "dog";
    const[input, setInput]=useState('');
    const[mensagem, setmensagem]=useState('');
    const[tempo, setTempo] = useState('');
    const intervalo = setInterval(() => {
        
    }, interval);
    const mudança =(event) =>{
        setInput(event.target.value);
    };
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
    <label>
        Digite o a palavra escrita acima; <input type="text" value={input} onChange={mudança} placeholder="Digite a palavra"/>
    </label>
    <button onClick={comparar}>Comparar</button>
    </>
    )
}