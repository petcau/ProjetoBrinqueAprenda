function AnagramaHeader({ nivel }) {
  return (
    <div className="Anagrama-header">
      <button
        className="botao_voltar_menu"
        onClick={() => (window.location.href = "/")}
      >
        Voltar para o menu
      </button>
      <h1 className="title">ANAGRAMA</h1>
      <div className="fase">Nível {nivel + 1}</div>
    </div>
  );
}

export default AnagramaHeader;