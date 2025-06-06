
/**
 * Renderiza uma área de soltura (drop zone) com imagem de fundo personalizável.
 *
 * @componente
 * @param {Object} props
 * @param {string} props.zoneName - Nome ou identificador único para a zona de soltura.
 * @param {function} props.onDrop - Função callback chamada quando um item é solto. Recebe o ID do item e o nome da zona como argumentos.
 * @param {string} props.backgroundUrl - URL da imagem de fundo da zona de soltura.
 *
 * @exemplo
 * <AreaColocar
 *   zoneName="zona-1"
 *   onDrop={(itemId, zone) => handleDrop(itemId, zone)}
 *   backgroundUrl="/imagens/fundo.png"
 * />
 */
function AreaColocar({ zoneName, onDrop, backgroundUrl }) {
  return (
    <div
      className={`drop-zone ${zoneName}`}
      style={{ 
      backgroundImage: `url(${backgroundUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center" 
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const itemId = e.dataTransfer.getData("text/plain");
        onDrop(itemId, zoneName);
      }}
    ></div>
  );
}

export default AreaColocar;
