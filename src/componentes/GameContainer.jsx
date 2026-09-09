import GameCard from './GameCard'
import capaJornada from '../assets/card-jornada-bicho.png';
import capaDigiRace from '../assets/CAPADIGITAÇÃO.png';
import capaAbaco from '../assets/abaco-capa.png';
import capaAnagrama from '../assets/anagramacapa4.png';

// O MathRace e um jogo estatico servido de public/, entao a capa dele e uma URL
// direta e nao um import. Ver src/jogos/2025.2/MathRace/MathRace.jsx.
const capaMathRace = '/2025.2/MathRace/assets/menu/titulo.png';

// Os jogos sao agrupados por semestre, do mais recente para o mais antigo, na
// mesma ordem em que aparecem em src/jogos/. Para publicar um jogo novo, basta
// acrescentar uma entrada aqui e registrar a rota em App.jsx.
const turmas = [
  {
    semestre: '2025.2',
    jogos: [
      // A capa do MathRace e o logo em faixa do proprio jogo, e nao uma arte
      // quadrada como as demais: por isso ela e exibida inteira, sem corte.
      { rota: '/mathrace', nome: 'MathRace', capa: capaMathRace, capaEmFaixa: true },
    ],
  },
  {
    semestre: '2025.1',
    jogos: [
      { rota: '/abacomania', nome: 'AbacoMania', capa: capaAbaco },
      { rota: '/anagrama', nome: 'Anagrama', capa: capaAnagrama },
      { rota: '/digitacao', nome: 'DigiRace', capa: capaDigiRace },
      { rota: '/jornadabicho', nome: 'Jornada do Bicho', capa: capaJornada },
    ],
  },
];

function GameContainer() {
  return (
    <main className="container">
      <div className="cards">
        {turmas.map((turma) => (
          <section className="turma" key={turma.semestre}>
            <h2 className="turma-titulo">{turma.semestre}</h2>

            <div className="turma-jogos">
              {turma.jogos.map((jogo) => (
                <GameCard
                  key={jogo.rota}
                  route={jogo.rota}
                  image={jogo.capa}
                  altText={jogo.nome}
                  imageClassName={jogo.capaEmFaixa ? 'card-image-contain' : ''}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

export default GameContainer;
