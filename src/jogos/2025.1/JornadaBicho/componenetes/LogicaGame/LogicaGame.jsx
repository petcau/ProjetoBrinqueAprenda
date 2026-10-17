import { useState, useEffect, useRef } from "react";
import { levels } from "../../game_assets/Levels-Itens.json";
import Header from "./Header";
import Controls from "./ControlesLevel";
import ItemsList from "./ListaItens";
import ZonesList from "./ListaZonas";
import somVitoriaSound from "../../../../../assets/Sons/somVitoria.mp3";
import somDerrotaSound from "../../../../../assets/Sons/somDerrota.mp3";
import somErroSound from "../../../../../assets/Sons/respErrada.mp3";
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
  // A janela de fim some sozinha em 3s. Precisa de estado proprio: apagar o
  // gameStatus junto esconderia tambem os botoes de Proximo Nivel / Tentar
  // novamente, que dependem dele.
  const [mostrarAviso, setMostrarAviso] = useState(false);

  const [dropped, setDropped] = useState({});
  const [shuffledItems, setShuffledItems] = useState([]);
  const currentLevel = levels[levelIndex];
  const currentLevelItems = levels[levelIndex].items;
  const [somAtivo, setSomAtivo] = useState(true);
  const SoundRef = useRef(null);

  // O botao de mudo so controlava a musica de fundo: vitoria e derrota
  // tocavam mesmo com o som desligado. Passam todos por aqui.
  function tocar(som) {
    if (!somAtivo) return;
    new Audio(som).play().catch(() => {});
  }

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
  const errosMaximos = levels[levelIndex].errosMaximos;

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
  function handleDrop(itemId, zone, e) {

    const item = objects.find((obj) => obj.id === itemId);
    if (!item) return;

    // Onde a crianca soltou, em coordenadas do proprio cenario.
    //
    // O jogo e reduzido por transform: scale() para caber na tela. O
    // getBoundingClientRect devolve a caixa JA escalada e o clientX e
    // coordenada de tela, mas o x/y sera aplicado como `left`/`top` DENTRO do
    // container escalado, onde 1px de CSS vale `escala` px na tela. Sem
    // dividir, o bicho cai longe de onde foi solto, e o desvio cresce conforme
    // se afasta do canto superior esquerdo. Comparar a caixa pintada com a de
    // layout da a escala sem depender de onde ela foi aplicada — e da 1
    // quando nao ha escala nenhuma.
    const dropZone = e.currentTarget;
    const rect = dropZone.getBoundingClientRect();
    const escalaX = rect.width / dropZone.offsetWidth || 1;
    const escalaY = rect.height / dropZone.offsetHeight || 1;

    const x = (e.clientX - rect.left) / escalaX;
    const y = (e.clientY - rect.top) / escalaY;

    // Bicho que JA esta no cenario: so muda de lugar. Nao conta acerto de
    // novo nem erro, senao arrastar para arrumar a cena mexeria no placar.
    if (dropped[itemId]) {
      if (dropped[itemId].zone !== zone) return;
      setDropped((prev) => ({
        ...prev,
        [itemId]: { ...prev[itemId], x: x, y: y },
      }));
      return;
    }

    if (gameStatus !== "Jogando") {
      return;
    }

    const isCorrect = item.correctZone === zone;

    if (isCorrect) {

      // Marca o item como dropado na zona correta
      setDropped((prev) => ({
        ...prev,
        [itemId]: { zone: zone, x: x, y: y },
      }));

      // Atualiza a contagem de acertos
      setAcertos((prev) => {
        const newCount = prev + 1;
        if (newCount >= acertosNecessarios) {
          setGameStatus("Ganhou");
          tocar(somVitoriaSound);

        }
        return newCount;
      });
    } else {
      // som a cada bicho errado, nao so quando o nivel acaba
      tocar(somErroSound);

      setErrorCount((prev) => {
        const newCount = prev + 1;
        if (newCount >= errosMaximos) {
          setGameStatus("Perdeu");
          tocar(somDerrotaSound);
        }
        return newCount;
      });
    }
  }

  const unplacedItems = objects.filter(obj => !dropped[obj.id]);

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

  useEffect(() => {
  if (SoundRef.current) {
    if (somAtivo) {
      SoundRef.current.play().catch(() => {});
    } else {
      SoundRef.current.pause();
    }
  }
}, [somAtivo]);

  // A janela de fim de nível fica 3 segundos e some sozinha.
  useEffect(() => {
    if (gameStatus !== "Ganhou" && gameStatus !== "Perdeu") {
      setMostrarAviso(false);
      return undefined;
    }
    setMostrarAviso(true);
    const tempo = setTimeout(() => setMostrarAviso(false), 3000);
    return () => clearTimeout(tempo);
  }, [gameStatus, levelIndex]);

  return (
    <div className="game_container_jornada">
      <audio
        ref={SoundRef}
        src="/JornadaBicho/sons_para_iplementar//Mr-jornada.mp3"
        autoPlay
        loop
        preload="auto"
        style={{ display: "none" }}
      />

<button className="audio_jornada" onClick={() => setSomAtivo(!somAtivo)}>
  {somAtivo ? "🔇" : "🔊"}
</button>

      {/* Segunda barra: nivel e descricao a esquerda, acertos e erros a
          direita. Os acertos ficavam la embaixo, depois da dica; juntar os
          dois numa linha so deixa o placar sempre a vista. */}
      <div className="barra2_jornada">
        {/* sem description: ela saiu da barra e virou destaque acima do jogo */}
        <Header className="level_jornada" level={levelIndex + 1} />

        <div className="acertos_jornada">
          <p>
            Acertos: {acertos} / {acertosNecessarios}
          </p>
          <p>Erros: {errorCount} / {errosMaximos}</p>
        </div>
      </div>

      <h3 className="destaque_desc_jornada">{currentLevel.description}</h3>

      <ZonesList
        zones={zones}
        onDrop={handleDrop}
        backgroundUrl={backgroundUrl}
        allObjects={objects}
        droppedItems={dropped}
      />

      <p className="dica_jornada">{currentLevel.dica}</p>

      {mostrarAviso && gameStatus === "Ganhou" && (
        <div className="game_won_jornada">
          <p className="texto_venceu_jornada">
            Parabéns! Vocês venceu este nível!
          </p>
        </div>
      )}
      {mostrarAviso && gameStatus === "Perdeu" && (
        <div className="game_over_jornada">
          <p className="texto_perdeu">Você perdeu! Muitos erros.</p>
        </div>
      )}

      <Controls
        className="Controles_jornada"
        onNext={nextLevel}
        onPrevious={previousLevel}
        levelIndex={levelIndex}
        totalLevels={levels.length}
        gameStatus={gameStatus}
        onReset={resetLevel}
      />

      <ItemsList objects={unplacedItems} onDrop={handleDrop} />

    </div>
  );
}

export default GameLogic;
