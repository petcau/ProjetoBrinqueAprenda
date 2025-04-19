import GameCard from './GameCard'

function GameContainer() {
  return (
      <main className="container">
        <div className="cards">
          <GameCard image="" altText="Anagrama" />
          <GameCard image="" altText="Abaco Mania" />
          <GameCard image="" altText="Digitacao" />
          <GameCard image="" altText="Jornada Bicho" />
        </div>
      </main>
  );
}

export default GameContainer;
