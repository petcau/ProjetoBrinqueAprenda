// Componente funcional TelaInicial, recebe uma prop chamada onIniciar (função para iniciar o jogo)
function TelaInicial({ onIniciar }) {
  return (
    // Elemento principal da tela inicial, com classes para estilização
    <main className="container tela-inicial">
      {/* Caixa que envolve o conteúdo da tela inicial */}
      <div className="tela-inicial-box">
        {/* Botão para iniciar o jogo; ao clicar, chama a função onIniciar passada como prop */}
        <button className="botao-iniciar" onClick={onIniciar}>
          Jogar
        </button>
      </div>
    </main>
  );
}

// Exporta o componente para poder ser usado em outros arquivos
export default TelaInicial;