/**
 * Icones do menu, desenhados em SVG aqui mesmo.
 *
 * Sao poucos e pequenos, entao nao vale carregar uma biblioteca de icones: SVG
 * embutido fica nitido em qualquer tela, herda a cor do texto (currentColor) e
 * nao custa nenhuma requisicao a mais.
 *
 * Cada icone e decorativo e acompanha um rotulo de texto, por isso vem com
 * aria-hidden: o leitor de tela anuncia so o rotulo, sem repetir.
 */

const CAMINHOS = {
  inicio: 'M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  jogos:
    'M7 8h10a5 5 0 0 1 4.9 6l-.8 4a2.6 2.6 0 0 1-4.6 1L15 17H9l-1.5 2a2.6 2.6 0 0 1-4.6-1l-.8-4A5 5 0 0 1 7 8z M7.5 11v3 M6 12.5h3 M16 12h.01 M18 14h.01',
  professores:
    'M3 9l9-4 9 4-9 4z M7 11.5V16c0 1.7 2.2 3 5 3s5-1.3 5-3v-4.5 M21 9v5',
  conta: 'M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8z M4 21a8 8 0 0 1 16 0',
  seta: 'M5 12h14 M13 6l6 6-6 6',
  play: 'M8 5.5v13l11-6.5z',
  menu: 'M4 7h16 M4 12h16 M4 17h16',
  fechar: 'M6 6l12 12 M18 6L6 18',

  // Categorias
  matematica:
    'M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z M7.5 7h9 M8 11.5h.01 M12 11.5h.01 M16 11.5h.01 M8 15.5h.01 M12 15.5h.01 M16 15.5h.01 M8 18h8',
  portugues:
    'M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z',
  ciencias:
    'M10 3h4 M11 3v6.2L5.6 18A2 2 0 0 0 7.3 21h9.4a2 2 0 0 0 1.7-3L13 9.2V3 M8.3 14h7.4',
  logica:
    'M12 3.5v2 M12 18.5v2 M3.5 12h2 M18.5 12h2 M6.2 6.2l1.4 1.4 M16.4 16.4l1.4 1.4 M17.8 6.2l-1.4 1.4 M7.6 16.4l-1.4 1.4 M12 8.4a3.6 3.6 0 1 1 0 7.2 3.6 3.6 0 0 1 0-7.2z',
  natureza:
    'M20 4c0 9-5.2 13.5-11 13.5A5 5 0 0 1 4 12.5C4 7 9 4 20 4z M4.5 20c2-4.5 5-7 9.5-9',
  'historia-geografia':
    'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z M3.3 9.2h17.4 M3.3 14.8h17.4 M12 3c2.4 2.4 3.7 5.5 3.7 9s-1.3 6.6-3.7 9 M12 3C9.6 5.4 8.3 8.5 8.3 12s1.3 6.6 3.7 9',
  tecnologia:
    'M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z M6.2 9.8h.01 M9.6 9.8h.01 M13 9.8h.01 M16.4 9.8h.01 M6.2 13.2h.01 M9.6 13.2h.01 M13 13.2h.01 M16.4 13.2h.01 M8.5 15.8h7',
};

function Icone({ nome, tamanho = 19 }) {
  const d = CAMINHOS[nome];
  if (!d) return null;

  return (
    <svg
      className="bq-icone"
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill={nome === 'play' ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {d.split(' M').map((parte, i) => (
        <path key={i} d={i === 0 ? parte : `M${parte}`} />
      ))}
    </svg>
  );
}

export default Icone;
