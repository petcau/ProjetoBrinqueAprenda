import GameCard from './GameCard'
import capaJornada from '../assets/card-jornada-bicho.png';
import capaDigiRace from '../assets/CAPADIGITAÇÃO.png';
import capaAbaco from '../assets/abaco-capa.png';
import capaAnagrama from '../assets/anagramacapa4.png';
import capaMatemagica from '../assets/matemagica-capa.webp';
import capaTabuad4on from '../assets/tabuad4on-capa.webp';
import capaTesouro from '../assets/tesouroavista-capa.webp';
import capaReciclaKids from '../assets/reciclakids-capa.webp';

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
      // As capas de 2025.2 sao largas (logo em faixa ou captura de tela), e nao
      // artes quadradas como as de 2025.1. `capaEmFaixa` mostra a imagem inteira
      // no card em vez de cortar as laterais.
      { rota: '/reciclakids', nome: 'ReciclaKids', capa: capaReciclaKids, capaEmFaixa: true },
      { rota: '/tesouroavista', nome: 'Tesouro à Vista', capa: capaTesouro, capaEmFaixa: true },
      { rota: '/tabuad4on', nome: 'Tabuad4on', capa: capaTabuad4on, capaEmFaixa: true },
      { rota: '/matemagica', nome: 'Matemágica', capa: capaMatemagica, capaEmFaixa: true },
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
