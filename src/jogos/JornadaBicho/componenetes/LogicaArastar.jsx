import React, { useState } from "react";
import { objects, zones } from "../game_assets/Itens";
import PegarItem from "./PegarItens.jsx";
import ZonaColocar from "./ZonaColocar.jsx";

/**
 * Componente que representa a logica do jogo de arrastar.
 *
 * Renderiza a lista de objetos e a lista de zonas,
 * e define a função o handleDrop para atualizar o estado dropped
 * e a fun o checkCorrectness para verificar se o item foi colocado na zona correta.
 *
 * @returns {JSX.Element} O JSX do componente.
 */
function LogicaArrastar() {
  const [dropped, setDropped] = useState({});

  /**
   * Função  que chamada quando um item solto em uma zona.
   * Atualiza o estado dropped com o item e a zona onde ele foi solto.
   * @param {string} itemId - O id do item que foi solto.
   * @param {string} zone - A zona onde o item foi solto.
   */
  function handleDrop(itemId, zone) {
    setDropped((prev) => ({ ...prev, [itemId]: zone }));
  }

  /**
   * Função que verifica se o item foi colocado na zona correta.
   * Se o item foi colocado na zona correta, retorna true, caso contrário retorna false.
   * @param {object} item - O item a ser verificado
   * @returns {boolean} true se o item estiver na zona correta, false caso contrário
   */
  function checkCorrectness(item) {
    return dropped[item.id] === item.correctZone;
  }

  return (
    <div className="container">
      <h1>Arraste os objetos para a zona correta</h1>

      <div className="objects">
        {objects.map((obj) => (
          <PegarItem key={obj.id} item={obj} />
        ))}
      </div>

      <div className="zones">
        {zones.map((zone) => (
          <ZonaColocar key={zone} zoneName={zone} onDrop={handleDrop} />
        ))}
      </div>

      <div className="result">
        <h2>Resultado</h2>
        {objects.map((obj) => (
          <div key={obj.id}>
            {obj.name}:{" "}
            {checkCorrectness(obj) ? "✅ Correto" : "❌ Errado ou não colocado"}
          </div>
        ))}
      </div>
    </div>
  );
}

export default LogicaArrastar;
