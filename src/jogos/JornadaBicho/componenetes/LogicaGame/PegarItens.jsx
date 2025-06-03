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
  console.log(item.image)
  return (
    <div
      className="drag-item"
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)}
    >
      {item.image && (
        <img
          src={(`/JornadaBicho/${item.image}`)}
          style={{ width: "300px", height: "30px", objectFit: "contain" }}
        />
      )}
      <div>{item.name}</div>
    </div>
  );
}

export default PegarItem;
