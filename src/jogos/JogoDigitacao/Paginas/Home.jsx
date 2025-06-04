import { useState } from "react";
import Jogo from "../componenetes/Jogo";
import '../game.css'
function Home(){
   const [estado, setEstado] = useState(true)
   const irParaJogo = () =>{
      setEstado(!estado);
   }
const carroUrl = './src/jogos/JogoDigitacao/game_assets/DESENHOCARRO.png';
const flagUrl = './src/jogos/JogoDigitacao/game_assets/istockphoto-1337596555-612x612-removebg-preview.png';
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
         <><Jogo /><button className="buttonDD" onClick={irParaJogo}>Voltar</button></>}
      </div>
   </>
)
}export default Home;