const palavrasValidas = ["ALEGRIA", "ALERGIA", "GALERIA", "REGALIA"];

function PalavrasDescobertas({ descobertas }) {
  return (
    <div className="palavras-validas">
      {palavrasValidas.map((palavra, index) => (
        <div key={index}>
          {descobertas.includes(palavra)
            ? palavra
            : "_ ".repeat(palavra.length)}
        </div>
      ))}
    </div>
  );
}

export default PalavrasDescobertas;