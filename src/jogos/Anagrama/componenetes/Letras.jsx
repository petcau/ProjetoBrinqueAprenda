function Letras({ letras, onAdicionarLetra }) {
  return (
    <div className="letras">
      {letras.map((letra, index) => (
        <button key={index} onClick={() => onAdicionarLetra(letra)}>
          {letra}
        </button>
      ))}
    </div>
  );
}

export default Letras;