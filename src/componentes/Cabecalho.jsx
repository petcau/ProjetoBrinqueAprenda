import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import Icone from './Icone';
import { EVENTO_PERFIL, lerPerfilAtivo } from '../dados/perfil';
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
  // Lido depois da montagem: o localStorage não existe na renderização fora do
  // navegador, e o cabeçalho é comum a todas as páginas.
  const [perfil, setPerfil] = useState(null);
  const { pathname } = useLocation();

  // Fecha ao navegar: sem isso o painel fica aberto por cima da página nova.
  useEffect(() => setAberto(false), [pathname]);

  // Relê ao navegar e também quando o perfil muda em outra tela: trocar o
  // apelido em Meu espaço tem que aparecer aqui no mesmo instante, sem precisar
  // sair da página.
  useEffect(() => setPerfil(lerPerfilAtivo()), [pathname]);

  useEffect(() => {
    const aoMudar = () => setPerfil(lerPerfilAtivo());
    window.addEventListener(EVENTO_PERFIL, aoMudar);
    return () => window.removeEventListener(EVENTO_PERFIL, aoMudar);
  }, []);

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
          <NavLink className="bq-conta" to="/meu-espaco">
            {perfil ? (
              <span className="bq-conta-avatar" aria-hidden="true">{perfil.avatar}</span>
            ) : (
              <Icone nome="conta" tamanho={18} />
            )}
            <span className="bq-conta-rotulo">{perfil ? perfil.apelido : 'Seu espaço'}</span>
          </NavLink>

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
