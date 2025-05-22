import { useState } from "react";
import Jogo from "../componenetes/Jogo";

function Home(){
   const [estado, setEstado] = useState(true)
   const [Dificuldade, setDificuldade] = useState();
   const irParaJogo = () =>{
      setEstado(!estado);
      setDificuldade(2);
   }
   const irParaJogo1 = () =>{
      setEstado(!estado);
      setDificuldade(1);
   }
   const irParaJogo3 = () =>{
      setEstado(!estado);
      setDificuldade(3);
   }
return(
   <>
      <div>
         {estado ? 
         <>
         <button className="start-button" onClick={irParaJogo1}>Dificuldade facil</button>
         <button className="start-button" onClick={irParaJogo}>Dificuldade media</button>
         <button className="start-button" onClick={irParaJogo3}>Dificuldade dificil</button>
         </>
         :  
         <><button className="butão" onClick={irParaJogo}>Voltar para a tela inicial</button><Jogo /></>}
      </div>
   </>
)
}export default Home;