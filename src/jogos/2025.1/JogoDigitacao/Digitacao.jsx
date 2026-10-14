import Home from "./Paginas/Home";

function App() {
  const carroUrl = '/JornadaBicho/digitacao/karting-vehicle-clipart.svg';

  return (
    <main className="digitacao-container">
      <div className="game-container-D">
        <h1 className="textoMDTtitulo">🏁DIGIRACE🏁</h1>
        <Home />
        <img className="carro-img" src={carroUrl} alt="Carro de corrida" />
      </div>
    </main>
  );
}

export default App;
