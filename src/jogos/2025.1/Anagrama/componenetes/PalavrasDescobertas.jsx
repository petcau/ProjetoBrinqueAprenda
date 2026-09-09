// Componente responsável por exibir as palavras válidas e se já foram descobertas
function PalavrasDescobertas({ descobertas, palavrasValidas }) {
  // Verifica se a lista de palavras é válida
  if (!palavrasValidas || !Array.isArray(palavrasValidas)) {
    return <div className="erro">Erro: palavras não carregadas.</div>;
  }

  return (
    <div className="container-palavras">
      {/* Percorre todas as palavras válidas */}
      {palavrasValidas.map((palavra, index) => {
        // Verifica se a palavra já foi descoberta pelo jogador
        const descoberta = descobertas.includes(palavra);

        return (
          <div key={index} className="palavra-bloco">
            {/* Se a palavra foi descoberta, exibe normalmente */}
            {descoberta ? (
              <span className="palavra-descoberta">{palavra}</span>
            ) : (
              // Caso contrário, exibe "_" para cada letra da palavra
              <span className="palavra-oculta">
                {"_ ".repeat(palavra.length)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Exporta o componente para ser usado em outras partes do app
export default PalavrasDescobertas;
