// Componente que exibe o cabeçalho do jogo Anagrama
function AnagramaHeader({ nivel, aoVoltar }) {
  return (
    // Container principal do cabeçalho
    <div className="Anagrama-header">

      <button
        className="botao_voltar_menu"
        onClick={aoVoltar} // Volta para a tela inicial do Anagrama
      >
        Menu
      </button>

      <h1 className="title">ANAGRAMA</h1>

      {/* Mostra o nível atual (nível + 1 para começar do 1 em vez do 0) */}
      <div className="fase">Nível {nivel + 1}</div> 
    </div>
  );
}

// Exporta o componente para ser usado em outras partes do projeto
export default AnagramaHeader;
