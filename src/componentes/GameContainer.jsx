import GameCard from './GameCard'
import logo from '../assets/card-jornada-bicho.png';
import capaD from '../assets/CAPADIGITAÇÃO.png';
import capaA from '../assets/abaco-capa.png';


function GameContainer() {
  return (
      <main className="container">
        <div className="cards">
          <GameCard route={'/anagrama'} image="" altText="Anagrama" />
          <GameCard route={'/abacomania'} image={capaA} altText="Abaco Mania" />
          <GameCard route={'/digitacao'} image= {capaD} altText="Digitacao" />
          <GameCard route={'/jornadabicho'} image={logo} altText="Jornada Bicho" />
        </div>
      </main>
  );
}

export default GameContainer;
