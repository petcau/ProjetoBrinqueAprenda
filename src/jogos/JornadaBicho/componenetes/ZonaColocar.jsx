import React from "react";
//import './DropZone.css'; // Não Implementado ainda

/**
 * Componente que representa uma zona onde um item pode ser colocado.
 *
 * Renderiza um elemento div com a classe "drop-zone" e
 * os eventos onDragOver e onDrop.
 *
 * @param {string} zoneName - O nome da zona.
 * @param {function} onDrop - Função chamada quando um item é colocado na zona.
 * @returns {JSX.Element} O JSX do componente.
 */
function AreaColocar({ zoneName, onDrop }) {
  return (
    <div
      className="drop-zone"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const itemId = e.dataTransfer.getData("text/plain");
        onDrop(itemId, zoneName);
      }}
    >
      {zoneName.toUpperCase()}
    </div>
  );
}

export default AreaColocar;
