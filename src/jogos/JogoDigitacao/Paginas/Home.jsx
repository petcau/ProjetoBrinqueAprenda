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
         <><p>Bem vindo ao jogo da digitação!</p><button onClick={irParaJogo}>Jogar</button></>
         :  
         <><button onClick={irParaJogo}>Voltar para a tela inicial</button><Jogo /></>}
      </div>
   </>
)
}export default Home;