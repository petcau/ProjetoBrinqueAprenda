function PalavraTentativa({ tentativa, onEnviar, desabilitado }) {
  return (
    <>
      <div className="tentativa">Palavra: {tentativa}</div>
      <div className="real-botoes">
        <button onClick={onEnviar} disabled={desabilitado}>
          Montar
        </button>
      </div>
    </>
  );
}

export default PalavraTentativa;
