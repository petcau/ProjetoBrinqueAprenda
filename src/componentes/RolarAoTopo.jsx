import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Leva a pagina para o topo a cada troca de rota.
 *
 * Numa SPA o navegador mantem a posicao da rolagem ao navegar, o que faz a
 * ficha de um jogo abrir no meio quando se clica num card la embaixo da home.
 */
function RolarAoTopo() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default RolarAoTopo;
