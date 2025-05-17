// Estrutura Modularizada do Jogo

import React, { useState, useEffect } from "react";
import {levels } from "../../game_assets/Levels-Itens.json";
import Header from "./Header";
import Controls from "./ControlesLevel";
import ItemsList from "./ListaItens";
import ZonesList from "./ListaZonas";
import Results from "./Resultados";

/**
 * Componente que representa a lógica do jogo Jornada Bicho.
 *
 * Renderiza o componente Header, ControlesLevel, ListarItems, ListarZonas e Resultados,
 * que por sua vez renderizam a logica do jogo.
 *
 * @returns {JSX.Element} O componente renderizado.
 */
function GameLogic() {
  const [levelIndex, setLevelIndex] = useState(() => Math.floor(Math.random() * levels.length));
  const [dropped, setDropped] = useState({});
  const [shuffledItems, setShuffledItems] = useState([]);
  const currentLevel = levels[levelIndex];

  useEffect(() => {
    const items = [...currentLevel.items].sort(() => Math.random() - 0.5);
    setShuffledItems(items);
    setDropped({});
  }, [levelIndex]);

  const objects = shuffledItems.map((item, index) => ({
    id: String(index),
    name: item.name,
    correctZone: item.correctZone,
    image: item.image
  }));

  const zones = currentLevel.zones;

  /**
   * Função chamada quando um item  arrastado e solto em uma zona.
   *
   * Atualiza o estado dropped com o item que foi solto e a zona em que
   * ele foi solto.
   *
   * @param {string} itemId - O id do item que foi solto.
   * @param {string} zone - A zona em que o item foi solto.
   */
  function handleDrop(itemId, zone) {
    setDropped((prev) => ({ ...prev, [itemId]: zone }));
  }

  /**
   * Verifica se o item foi colocado na zona correta.
   *
   * @param {object} item - O item a ser verificado.
   * @returns {boolean} true se o item foi colocado na zona correta, false caso contr rio.
   */
  function checkCorrectness(item) {
    return dropped[item.id] === item.correctZone;
  }

  /**
   * Vai para o próximo nível do jogo.
   *
   * Se o nível atual for o último, uma mensagem de parabéns é exibida e
   * o estado levelIndex não é alterado.
   */
  function nextLevel() {
    if (levelIndex < levels.length - 1) {
      setLevelIndex(levelIndex + 1);
    } else {
      alert("Parabéns! Você completou todos os níveis!");
    }
  }

  /**
   * Volta para o nível anterior do jogo.
   *
   * Se o nível atual for o primeiro, uma mensagem de alerta é exibida e
   * o estado levelIndex não é alterado.
   */
  function previousLevel() {
    if (levelIndex > 0) {
      setLevelIndex(levelIndex - 1);
    } else {
      alert("Você já está no primeiro nível!");
    }
  }

  return (
    <div className="container">
      <Header level={levelIndex + 1} description={currentLevel.description} />
      <Controls onNext={nextLevel} onPrevious={previousLevel} levelIndex={levelIndex} totalLevels={levels.length} />
      <ItemsList objects={objects} />
      <ZonesList zones={zones} onDrop={handleDrop} />
      <Results objects={objects} checkCorrectness={checkCorrectness} />
    </div>
  );
}

export default GameLogic;