
/**
 * Renderiza um componente de item arrastável para uso em interfaces de arrastar e soltar.
 *
 * @componente
 * @param {Object} props
 * @param {Object} props.item - O objeto do item a ser exibido e arrastado.
 * @param {string|number} props.item.id - Identificador único do item, usado nos eventos de arrastar.
 * @param {string} [props.item.image] - O nome do arquivo ou caminho da imagem a ser exibida para o item.
 * @returns {JSX.Element} Uma div arrastável contendo a imagem do item (se fornecida).
 */
function PegarItem({ item }) {
  console.log(item.image);
  return (
    <div
      className="drag-item"
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)}
    >
      {item.image && (
        <img
          src={`/JornadaBicho/${item.image}`}
          style={{ width: "90px", height: "90px", objectFit: "contain" }}
        />
      )}
    </div>
  );
}

export default PegarItem;
