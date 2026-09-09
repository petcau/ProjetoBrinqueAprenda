import GameCard from './GameCard'
import logo from '../assets/card-jornada-bicho.png';
import capaD from '../assets/CAPADIGITAÇÃO.png';
import capaA from '../assets/abaco-capa.png';
import capaB from '../assets/anagramacapa4.png';

// O MathRace mora em public/, entao a capa dele e uma URL direta e nao um import.
const capaM = '/2025.2/MathRace/assets/menu/titulo.png';

function GameContainer() {
  return (
      <main className="container">
        <div className="cards">
          <GameCard route={'/anagrama'} image={capaB} altText="Anagrama" />
          <GameCard route={'/abacomania'} image={capaA} altText="Abaco Mania" />
          <GameCard route={'/digitacao'} image= {capaD} altText="Digitacao" />
          <GameCard route={'/jornadabicho'} image={logo} altText="Jornada Bicho" />
          <GameCard route={'/mathrace'} image={capaM} altText="MathRace" />
        </div>
      </main>
  );
}

export default GameContainer;
