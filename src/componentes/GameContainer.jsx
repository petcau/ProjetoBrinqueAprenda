import GameCard from './GameCard'

function GameContainer() {
  return (
      <main className="container">
        <div className="cards">
          <GameCard route={'/anagrama'} image="" altText="Anagrama" />
          <GameCard route={'/abacomania'} image="" altText="Abaco Mania" />
          <GameCard route={'/digitacao'} image="" altText="Digitacao" />
          <GameCard route={'/jornadabicho'} image="" altText="Jornada Bicho" />
        </div>
      </main>
  );
}

export default GameContainer;
