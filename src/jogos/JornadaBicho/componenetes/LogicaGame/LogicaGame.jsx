import React, { useState, useEffect } from "react";
import { levels } from "../../game_assets/Levels-Itens.json";
import Header from "./Header";
import Controls from "./ControlesLevel";
import ItemsList from "./ListaItens";
import ZonesList from "./ListaZonas";

/**
 * GameLogic é um componente React que gerencia a lógica central de um jogo educativo de arrastar e soltar.
 * Ele controla o estado do jogo, incluindo o nível atual, acertos, erros e status do jogo.
 * O componente embaralha os itens de cada nível, acompanha as interações do usuário e determina quando o usuário
 * vence ou perde o nível. Também fornece controles para navegar entre níveis e reiniciar o nível atual.
 *
 * Variáveis de Estado:
 * - levelIndex: Índice do nível atual.
 * - acertos: Número de acertos no nível atual.
 * - errorCount: Número de erros no nível atual.
 * - gameStatus: Status atual do jogo ('playing', 'won', 'lost').
 * - dropped: Objeto que rastreia quais itens foram soltos em quais zonas.
 * - shuffledItems: Array de itens embaralhados para o nível atual.
 *
 * Funções Principais:
 * - handleDrop: Lida com a lógica ao soltar um item em uma zona, atualizando acertos/erros e o status do jogo.
 * - nextLevel: Avança para o próximo nível ou mostra uma mensagem de parabéns se todos os níveis foram concluídos.
 * - previousLevel: Retorna ao nível anterior ou alerta se já está no primeiro nível.
 * - resetLevel: Reinicia o nível atual, embaralhando itens e resetando os contadores.
 *
 * Renderiza:
 * - Header: Exibe o nível atual e a descrição.
 * - ZonesList: Exibe as zonas de soltura dos itens.
 * - ItemsList: Exibe os itens arrastáveis.
 * - Controls: Controles de navegação entre níveis.
 * - Mensagens de status e botões para vitória ou derrota no nível.
 *
 * @component
 */
function GameLogic() {
  const [levelIndex, setLevelIndex] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [gameStatus, setGameStatus] = useState("Jogando"); // 'Jogando', 'Ganhou', 'Perdeu'
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
    setGameStatus("Jogando");
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

   // Pega a URL do background do nível atual
  const backgroundUrl = currentLevel.background;

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
    if (gameStatus !== "Jogando") return;

    const item = objects.find((obj) => obj.id === itemId);
    if (!item) return;

    const isCorrect = item.correctZone === zone;

    setDropped((prev) => ({ ...prev, [itemId]: zone }));

    if (!dropped[itemId] && isCorrect) {
      setAcertos((prev) => {
        const newCount = prev + 1;
        if (newCount >= acertosNecessarios) {
          setGameStatus("Ganhou");
        }
        return newCount;
      });
    } else if (!isCorrect && !dropped[itemId]) {
      setErrorCount((prev) => {
        const newCount = prev + 1;
        if (newCount >= 3) {
          setGameStatus("Perdeu");
        }
        return newCount;
      });
    }
  }

  /**
   * Função chamada quando o usuário completa um nível.
   *
   * Avança para o próximo nível, resetando a contagem de acertos.
   * Se o usuário completou todos os níveis, exibe um alerta congratulatório.
   */
  const nextLevel = () => {
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
    setGameStatus("Jogando");
  };

  return (
    <div className="game_container_jornada" >
      
      <Header
        className="level_jornada"
        level={levelIndex + 1}
        description={currentLevel.description}
      />
      
      <ZonesList 
      zones={zones} 
      onDrop={handleDrop} 
      backgroundUrl={backgroundUrl}
      />
      
      <p className="dica_jornada">{currentLevel.dica}</p>

      <div className="acertos_jornada">
        <p>
          Acertos: {acertos} / {acertosNecessarios}
        </p>
        <p>Erros: {errorCount} / 3</p>
      </div>
      
      {gameStatus === "Ganhou" && (
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
      {gameStatus === "Perdeu" && (
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
