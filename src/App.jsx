import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RolarAoTopo from './componentes/RolarAoTopo';
import Home from './paginas/Home';
import Jogos from './paginas/Jogos';
import Turma from './paginas/Turma';
import Jogo from './paginas/Jogo';
import Jogar from './paginas/Jogar';
import Sobre from './paginas/Sobre';
import NaoEncontrada from './paginas/NaoEncontrada';

/**
 * As rotas do portal, sem o roteador em volta.
 *
 * Fica separado de App para poder ser montado tambem fora do navegador — e o
 * que permite renderizar as paginas num script de verificacao.
 *
 * Repare que NAO existe uma rota por jogo aqui. As rotas /jogo/:slug e
 * /jogar/:slug servem qualquer jogo do catalogo, entao publicar um jogo novo
 * nao exige mexer neste arquivo: basta acrescentar a entrada em
 * src/dados/jogos.js. Veja src/dados/MODELO.md.
 */
export function Rotas() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/jogos" element={<Jogos />} />
      <Route path="/turma/:semestre" element={<Turma />} />
      <Route path="/jogo/:slug" element={<Jogo />} />
      <Route path="/jogar/:slug" element={<Jogar />} />
      <Route path="/sobre" element={<Sobre />} />
      <Route path="*" element={<NaoEncontrada />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter basename="/">
      <RolarAoTopo />
      <Rotas />
    </BrowserRouter>
  );
}

export default App;
