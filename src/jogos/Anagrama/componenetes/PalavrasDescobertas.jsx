function PalavrasDescobertas({ descobertas, palavrasValidas }) {
  if (!palavrasValidas || !Array.isArray(palavrasValidas)) {
    return <div className="erro">Erro: palavras não carregadas.</div>;
  }

  return (
    <div className="container-palavras">
      {palavrasValidas.map((palavra, index) => (
        <span key={index} className="palavra">
          <span className="separador">| </span>
          {descobertas.includes(palavra)
            ? palavra
            : "_ ".repeat(palavra.length)}
          <span className="separador">| </span>
        </span>
      ))}
    </div>
  );
}

export default PalavrasDescobertas;