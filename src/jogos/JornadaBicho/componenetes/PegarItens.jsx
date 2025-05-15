import React from "react";
//import './DragItem.css'; // Não Implementado ainda

/**
 * Componente que representa um item arrastavel.
 *
 * Renderiza um item como um elemento div com a classe "drag-item" e
 * a propriedade "draggable" true.
 *
 * @param {object} item - O item a ser renderizado.
 * @returns {JSX.Element} O JSX do item arrast vel.
 */
function PegarItem({ item }) {
  return (
    <div
      className="drag-item"
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)}
    >
      {item.name}
    </div>
  );
}

export default PegarItem;
