function PalavraTentativa({ tentativa, onEnviar }) {
  return (
    <>
      <div className="tentativa">Palavra: {tentativa}</div>
      <div className="botoes">
        <button onClick={onEnviar}>Montar</button>
      </div>
    </>
  );
}

export default PalavraTentativa;