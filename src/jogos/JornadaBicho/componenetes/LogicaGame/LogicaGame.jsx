// Estrutura Modularizada do Jogo

import React, { useState, useEffect } from "react";
import {levels } from "../../game_assets/Levels-Itens.json";
import Header from "./Header";
import Controls from "./ControlesLevel";
import ItemsList from "./ListaItens";
import ZonesList from "./ListaZonas";
import Results from "./Resultados";

function GameLogic() {
  
  const [levelIndex, setLevelIndex] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [dropped, setDropped] = useState({});
  const [shuffledItems, setShuffledItems] = useState([]);
  const currentLevel = levels[levelIndex];
  const currentLevelItems = levels[levelIndex].items;

  useEffect(() => {
    const items = [...currentLevelItems].sort(() => Math.random() - 0.5);
    setShuffledItems(items);
    setDropped({});
  }, [currentLevelItems]);

  const objects = shuffledItems.map((item, index) => ({
    id: String(index),
    name: item.name,
    correctZone: item.correctZone,
    image: item.image
  }));

  const zones = currentLevel.zones;
  const acertosNecessarios = levels[levelIndex].acertosNecessarios;

  const handleAcerto = () => {
    setAcertos(prev => prev + 1);
  }

  function handleDrop(itemId, zone) {
    const item = objects.find(obj => obj.id === itemId);
    const isCorrect = item && zone === item.correctZone;

      if (!dropped[itemId] && isCorrect) {
        handleAcerto();
      }
    setDropped((prev) => ({ ...prev, [itemId]: zone }));
  }

  function checkCorrectness(item) {
    return dropped[item.id] === item.correctZone;
  }

  function nextLevel() {
  if (acertos < acertosNecessarios) {
    alert("Você precisa acertar mais itens antes de avançar para o próximo nível!");
    return;
  }

  if (levelIndex < levels.length - 1) {
    setLevelIndex(levelIndex + 1);
    setAcertos(0);
  } else {
    alert("Parabéns! Você completou todos os níveis!");
  }
}


  function previousLevel() {
    if (levelIndex > 0) {
      setLevelIndex(levelIndex - 1);
    } else {
      alert("Você já está no primeiro nível!");
    }
  }

  return (
    <div className="game_container_jornada">
      <Header className="level_jornada" level={levelIndex + 1} description={currentLevel.description} />
      <ZonesList zones={zones} onDrop={handleDrop} />
      <Controls className="Controles_jornada" onNext={nextLevel} onPrevious={previousLevel} levelIndex={levelIndex} totalLevels={levels.length} />
      <ItemsList objects={objects} />
      
      <Results objects={objects} checkCorrectness={checkCorrectness} />
    </div>
  );
}

export default GameLogic;