// Componente que mostra a palavra que está sendo montada e o botão para enviar
function PalavraTentativa({ tentativa, onEnviar, desabilitado }) {
  return (
    <>
      {/* Exibe a palavra atual que o jogador está tentando formar */}
      <div className="tentativa">Palavra: {tentativa}</div>

      {/* Botão para enviar a tentativa */}
      <div className="real-botoes">
        <button onClick={onEnviar} disabled={desabilitado}>
          Montar
        </button>
      </div>
    </>
  );
}

// Exporta o componente para ser usado em outras partes do aplicativo
export default PalavraTentativa;
