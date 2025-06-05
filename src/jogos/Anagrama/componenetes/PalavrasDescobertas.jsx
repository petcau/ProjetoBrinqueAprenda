function PalavrasDescobertas({ descobertas, palavrasValidas }) {
  if (!palavrasValidas || !Array.isArray(palavrasValidas)) {
    return <div className="erro">Erro: palavras não carregadas.</div>;
  }

  return (
    <div className="container-palavras">
      {palavrasValidas.map((palavra, index) => {
        const descoberta = descobertas.includes(palavra);
        return (
          <div key={index} className="palavra-bloco">
            {descoberta ? (
              <span className="palavra-descoberta">{palavra}</span>
            ) : (
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

export default PalavrasDescobertas;