import PegarItem from "./PegarItens";

/**
 * Componente que representa uma lista de itens arrastáveis.
 *
 * Renderiza cada objeto da lista como um componente PegarItem,
 * que por sua vez representa um item individual arrastável.
 *
 * @param {Array} objects - A lista de objetos a serem renderizados.
 * Cada objeto deve conter um identificador único.
 */

const ItemsList = ({ objects }) => (
  <div className="objects">
    {objects.map((obj) => (
      <PegarItem key={obj.id} item={obj} />
    ))}
  </div>
);

export default ItemsList;