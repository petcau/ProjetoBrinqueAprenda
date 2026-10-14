import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import Icone from './Icone';
// Versão recortada e comprimida de src/assets/logo.png, do tamanho que o
// cabeçalho usa. O original de 2172x724 e 455 KB continua lá, para reexportar.
import logo from '../assets/logo-brinque-aprenda.webp';

/**
 * Cabecalho do portal.
 *
 * Os itens ficam nesta lista para que acrescentar uma secao nova seja uma
 * linha. Hoje todos levam a uma pagina que existe.
 */
const MENU = [
  { rotulo: 'Início', para: '/', icone: 'inicio', exato: true },
  { rotulo: 'Jogos', para: '/jogos', icone: 'jogos' },
  { rotulo: 'Conheça o Projeto', para: '/sobre', icone: 'professores' },
];

function Cabecalho() {
  const [aberto, setAberto] = useState(false);
  const { pathname } = useLocation();

  // Fecha ao navegar: sem isso o painel fica aberto por cima da página nova.
  useEffect(() => setAberto(false), [pathname]);

  // Esc fecha, que é o que todo mundo tenta.
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e) => e.key === 'Escape' && setAberto(false);
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [aberto]);

  const itens = MENU.map((item) => (
    <NavLink key={item.rotulo} to={item.para} end={item.exato}>
      <Icone nome={item.icone} />
      <span className="bq-nav-rotulo">{item.rotulo}</span>
    </NavLink>
  ));

  return (
    <header className="bq-cabecalho">
      <div className="bq-largura bq-cabecalho-interno">
        <Link to="/" className="bq-marca">
          <img src={logo} alt="Brinque &amp; Aprenda — página inicial" width="841" height="120" />
        </Link>

        {/* Menu de telas largas: fica na própria barra. */}
        <nav className="bq-nav" aria-label="Navegação principal">
          {itens}
        </nav>

        <div className="bq-cabecalho-acoes">
          {/* A conta ainda não existe: está aqui só para o leiaute. Por isso
              é <span>, e não <button> — nada que pareça clicável e não faça
              nada, e nada que o leitor de tela anuncie como ação. */}
          <span className="bq-conta" aria-hidden="true">
            <Icone nome="conta" tamanho={18} />
            <span className="bq-conta-rotulo">Meu espaço</span>
          </span>

          <button
            type="button"
            className="bq-sanduiche"
            onClick={() => setAberto((a) => !a)}
            aria-expanded={aberto}
            aria-controls="menu-celular"
            aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
          >
            <Icone nome={aberto ? 'fechar' : 'menu'} tamanho={22} />
          </button>
        </div>
      </div>

      {/* Menu de celular: painel que desce da barra. Fica fora de
          .bq-cabecalho-interno para ocupar a largura toda. */}
      <nav
        className={`bq-menu-celular ${aberto ? 'aberto' : ''}`}
        id="menu-celular"
        aria-label="Navegação principal"
        hidden={!aberto}
      >
        <div className="bq-largura">{itens}</div>
      </nav>
    </header>
  );
}

export default Cabecalho;
