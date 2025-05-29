function PalavraTentativa({ tentativa, onEnviar }) {
  return (
    <>
      <div className="tentativa">Palavra: {tentativa}</div>
      <div className="real-botoes">
        <button onClick={onEnviar}>Montar</button>
      </div>
    </>
  );
}

export default PalavraTentativa;