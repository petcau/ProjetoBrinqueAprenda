import { useState } from "react";
import Jogo from "../componenetes/Jogo";
import Giz from "../componenetes/Giz";
function Home(){
   const [estado, setEstado] = useState(true)
   const irParaJogo = () =>{
      setEstado(!estado);
   }
  
return(
   <>
      <div className="MenuD">
         {estado ? 
         <>
         <button className="start-button" onClick={irParaJogo}>Começar</button>
         <button className="start-button" onClick={() => (window.location.href = "/")}>Voltar
      </button>
         </>
         :  
         <><button className="butão" onClick={irParaJogo}>Voltar para a tela inicial</button><Jogo /></>}
      </div>
   </>
)
}export default Home;