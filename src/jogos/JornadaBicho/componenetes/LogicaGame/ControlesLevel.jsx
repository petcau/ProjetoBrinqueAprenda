/**
 * Componente que renderiza botões de navegação que se adaptam ao estado do jogo.
 *
 * @param {object} props
 * @param {function} props.onPrevious - Função para ir ao nível anterior.
 * @param {function} props.nextLevel - Função para ir ao próximo nível.
 * @param {function} props.onReset - Função para reiniciar o nível.
 * @param {boolean} props.isFirst - Verdadeiro se for o primeiro nível.
 * @param {boolean} props.isLast - Verdadeiro se for o último nível.
 * @param {string} props.gameStatus - O estado atual do jogo ('playing', 'Ganhou', 'Perdeu').
 */
const Controls = ({
  onPrevious,
  onNext,
  onReset,
  isFirst,
  isLast,
  gameStatus,
}) => {
  /**
   * Renderiza o conteúdo dos botões de navegação com base no estado do jogo.
   * Caso o jogador tenha vencido o nível, renderiza um botão para ir ao próximo nível
   * ou uma mensagem de parabéns se for o último nível.
   * Caso o jogador tenha perdido, renderiza um botão para tentar novamente.
   * Caso o jogador esteja jogando, renderiza botões para ir ao nível anterior e ao próximo nível.
   */
  const renderContent = () => {
    switch (gameStatus) {
      // Caso o jogador tenha vencido o nível
      case "Ganhou":
        if (isLast) {
          return (
            <p className="texto_final_jornada">
              Você completou todos os níveis!
            </p>
          );
        }
        return (
          <button className="botton_proximo_nivel" onClick={onNext}>
            Próximo Nível
          </button>
        );

      // Caso o jogador tenha perdido
      case "Perdeu":
        return (
          <button className="botton_tentar_novamente" onClick={onReset}>
            Tentar Novamente
          </button>
        );

      // Caso padrão: o jogador está jogando
      default:
        return (
          <>
            <button
              className="NAnterior"
              onClick={onPrevious}
              disabled={isFirst}
            >
              Nível Anterior
            </button>

            <button className="botton_proximo_nivel" onClick={onNext} disabled>
              Próximo Nível
            </button>
          </>
        );
    }
  };

  return <div className="Controles_JornadaPA">{renderContent()}</div>;
};

export default Controls;
