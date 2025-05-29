import { useState } from "react";
import Jogo from "../componenetes/Jogo";

function Home(){
   const [estado, setEstado] = useState(true)
   const irParaJogo = () =>{
      setEstado(!estado);
   }
  
return(
   <>
      <div>
         {estado ? 
         <>
         <button className="start-button" onClick={irParaJogo}>Começar</button>
         </>
         :  
         <><button className="butão" onClick={irParaJogo}>Voltar para a tela inicial</button><Jogo /></>}
      </div>
   </>
)
}export default Home;