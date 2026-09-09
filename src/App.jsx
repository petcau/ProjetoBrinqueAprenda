import { Route, BrowserRouter, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Games from "./pages/Games.jsx";
import Abaco from "./jogos/2025.1/AbacoMania/Abaco.jsx";
import JornadaBicho from "./jogos/2025.1/JornadaBicho/JornadaBicho.jsx";
import Digitacao from "./jogos/2025.1/JogoDigitacao/Digitacao.jsx";
import Anagrama from "./jogos/2025.1/Anagrama/Anagrama.jsx";
import MathRace from "./jogos/2025.2/MathRace/MathRace.jsx";
import Matemagica from "./jogos/2025.2/Matemagica/Matemagica.jsx";
import Tabuad4on from "./jogos/2025.2/Tabuad4on/Tabuad4on.jsx";
import Sobre from './pages/Sobre.jsx'


function App() {
  return (
    <BrowserRouter basename="/">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jogos" element={<Games />} />
        <Route path="/abacomania" element={<Abaco />}/>
        <Route path="/anagrama" element={<Anagrama />}/>
        <Route path="/digitacao" element={<Digitacao />}/>
        <Route path="/jornadabicho" element={<JornadaBicho />}/>
        <Route path="/mathrace" element={<MathRace />} />
        <Route path="/matemagica" element={<Matemagica />} />
        <Route path="/tabuad4on" element={<Tabuad4on />} />
        <Route path="/sobre" element={<Sobre />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
