import { Route, BrowserRouter, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Games from "./pages/Games.jsx";
import Abaco from "./jogos/AbacoMania/Abaco.jsx";
import JornadaBicho from "./jogos/JornadaBicho/JornadaBicho.jsx";
import Digitacao from "./jogos/JogoDigitacao/Digitacao.jsx";
import Anagrama from "./jogos/Anagrama/Anagrama.jsx";
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
        <Route path="/sobre" element={<Sobre />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
