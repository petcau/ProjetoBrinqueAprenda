// Estrutura Modularizada do Jogo

import React, { useState, useEffect } from "react";
import { levels } from "../../game_assets/Levels-Itens.json";
import Header from "./Header";
import Controls from "./ControlesLevel";
import ItemsList from "./ListaItens";
import ZonesList from "./ListaZonas";
import Results from "./Resultados";

/**
 * Componente principal da lógica do jogo JornadaBicho.
 * 
 * Gerencia o estado do jogo, incluindo o nível atual, contagem de acertos e erros,
 * status do jogo (jogando, venceu, perdeu), itens embaralhados e zonas corretas.
 * 
 * Implementa a lógica de manipulação de eventos de drop, onde os itens são
 * arrastados para zonas específicas. Verifica se o item foi colocado na zona
 * correta, atualizando as contagens de acertos e erros, e determinando o status
 * do jogo.
 * 
 * Inclui funcionalidades para avançar para o próximo nível, voltar ao nível
 * anterior e reiniciar o nível atual.
 * 
 * Renderiza os componentes de cabeçalho, lista de zonas e itens, e controles de
 * navegação entre níveis. Exibe dicas, contagem de acertos e erros, e mensagens
 * de vitória ou derrota conforme o status do jogo.
 */
function GameLogic() {
  const [levelIndex, setLevelIndex] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [gameStatus, setGameStatus] = useState("playing"); // 'playing', 'won', 'lost'
  const [dropped, setDropped] = useState({});
  const [shuffledItems, setShuffledItems] = useState([]);
  const currentLevel = levels[levelIndex];
  const currentLevelItems = levels[levelIndex].items;

  useEffect(() => {
    const items = [...currentLevelItems].sort(() => Math.random() - 0.5);
    setShuffledItems(items);
    setDropped({});
    setAcertos(0);
    setErrorCount(0);
    setGameStatus("playing");
  }, [currentLevelItems]);

  const objects = shuffledItems.map((item, index) => ({
    id: String(index),
    name: item.name,
    correctZone: item.correctZone,
    image: item.image,
    dica: levels[levelIndex].dica,
  }));

  const zones = currentLevel.zones;
  const acertosNecessarios = levels[levelIndex].acertosNecessarios;

  /**
   * Função chamada quando um item é dropado em uma zona.
   * 
   * Verifica se o item foi colocado na zona correta, atualizando a contagem
   * de acertos e erros, e determinando o status do jogo.
   * 
   * @param {string} itemId - O identificador do item.
   * @param {string} zone - A zona onde o item foi dropado.
   */
  function handleDrop(itemId, zone) {
    if (gameStatus !== "playing") return;

    const item = objects.find((obj) => obj.id === itemId);
    if (!item) return;

    const isCorrect = item.correctZone === zone;

    setDropped((prev) => ({ ...prev, [itemId]: zone }));

    if (!dropped[itemId] && isCorrect) {
      setAcertos((prev) => {
        const newCount = prev + 1;
        if (newCount >= acertosNecessarios) {
          setGameStatus("won");
        }
        return newCount;
      });
    } else if (!isCorrect && !dropped[itemId]) {
      setErrorCount((prev) => {
        const newCount = prev + 1;
        if (newCount >= 3) {
          setGameStatus("lost");
        }
        return newCount;
      });
    }
  }

  /**
   * Função para avançar para o próximo nível
   *
   * Verifica se o usuário alcançou o número de acertos necessário para avançar para
   * o próximo nível. Se sim, incrementa o nível atual e reseta o contador de acertos.
   * Se não, exibe um alerta para o usuário.
   *
   * Se o usuário estiver no último nível, exibe um alerta de parabéns
   * em vez de avançar para o próximo nível.
   */
  const nextLevel = () => {
    if (acertos < acertosNecessarios) {
      alert(
        "Você precisa acertar mais itens antes de avançar para o próximo nível!"
      );
      return;
    }

    if (levelIndex < levels.length - 1) {
      setLevelIndex(levelIndex + 1);
      setAcertos(0);
    } else {
      alert("Parabéns! Você completou todos os níveis!");
    }
  };

/**
 * Função para voltar ao nível anterior.
 *
 * Verifica se o usuário não está no primeiro nível. Se não estiver, 
 * decrementa o nível atual. Se já estiver no primeiro nível, exibe 
 * um alerta informando ao usuário que ele já está no nível inicial.
 */

  const previousLevel = () => {
    if (levelIndex > 0) {
      setLevelIndex(levelIndex - 1);
    } else {
      alert("Você já está no primeiro nível!");
    }
  };

  /**
   * Função para resetar o nível atual.
   *
   * Sorteia novamente os itens do nível, limpa a lista de itens
   * soltos, reseta o contador de acertos e erros e muda o status
   * do jogo para "playing".
   */
  const resetLevel = () => {
    setShuffledItems([...currentLevelItems].sort(() => Math.random() - 0.5));
    setDropped({});
    setAcertos(0);
    setErrorCount(0);
    setGameStatus("playing");
  };

  return (
    <div className="game_container_jornada">
      <Header
        className="level_jornada"
        level={levelIndex + 1}
        description={currentLevel.description}
      />
      <ZonesList zones={zones} onDrop={handleDrop} />
      <p className="dica_jornada">{currentLevel.dica}</p>

      <div className="acertos_jornada">
        <p>
          Acertos: {acertos} / {acertosNecessarios}
        </p>
        <p>Erros: {errorCount} / 3</p>
      </div>
      {gameStatus === "won" && (
        <div className="game_won_jornada">
          <p className="texto_venceu_jornada">
            Parabéns! Vocês venceu este nível!
          </p>
          {levelIndex < levels.length - 1 ? (
            <button className="botton_proximo_nivel" onClick={nextLevel}>
              Próximo Nível
            </button>
          ) : (
            <p>Você completou todos os níveis!</p>
          )}
        </div>
      )}
      {gameStatus === "lost" && (
        <div className="game_over_jornada">
          <p className="texto_perdeu">Você perdeu! Muitos erros.</p>
          <button className="botton_tentar_novamente" onClick={resetLevel}>
            Tentar Novamente
          </button>
        </div>
      )}

      <Controls
        className="Controles_jornada"
        onNext={nextLevel}
        onPrevious={previousLevel}
        levelIndex={levelIndex}
        totalLevels={levels.length}
      />

      <ItemsList objects={objects} />
    </div>
  );
}

export default GameLogic;
