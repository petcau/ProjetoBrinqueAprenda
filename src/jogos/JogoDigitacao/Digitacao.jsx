import Home from "./Paginas/Home";
function App(){
  const carroUrl = './src/jogos/JogoDigitacao/game_assets/DESENHOCARRO.png';
const flagUrl = './src/jogos/JogoDigitacao/game_assets/istockphoto-1337596555-612x612-removebg-preview.png';
  return(
     <main className="digitacao-container">
      <div className="game-container-D">
        <h1 className="textoMDTtitulo">🏁DIGIRACE🏁</h1>
        <Home />
        <img src={carroUrl} ></img>
      </div>
    </main>
  )


}export default App;
  