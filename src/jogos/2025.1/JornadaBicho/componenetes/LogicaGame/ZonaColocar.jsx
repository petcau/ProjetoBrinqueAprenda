
/**
 * Renderiza uma área de soltura (drop zone) com imagem de fundo personalizável.
 *
 * @componente
 * @param {Object} props
 * @param {string} props.zoneName - Nome ou identificador único para a zona de soltura.
 * @param {function} props.onDrop - Função callback chamada quando um item é solto. Recebe o ID do item e o nome da zona como argumentos.
 * @param {string} props.backgroundUrl - URL da imagem de fundo da zona de soltura.
 *
 * @exemplo
 * <AreaColocar
 *   zoneName="zona-1"
 *   onDrop={(itemId, zone) => handleDrop(itemId, zone)}
 *   backgroundUrl="/imagens/fundo.png"
 * />
 */
function AreaColocar({ zoneName, onDrop, backgroundUrl, allObjects, droppedItems }) {
  // Verifica se a URL do background foi fornecida
  const itemsInThisZoneIds = Object.keys(droppedItems).filter(
    itemId => droppedItems[itemId].zone === zoneName
  );

  const itemsToRender = allObjects.filter(obj =>
    itemsInThisZoneIds.includes(obj.id)
  );

  // O Levels-Itens.json guarda o fundo sem a barra inicial
  // ("JornadaBicho/ZonasJornadaBicho/casa.png"). Num endereco como
  // /jogar/jornada-dos-bichos o navegador resolve isso para
  // /jogar/JornadaBicho/... e a imagem nao aparece. Como o portal e SPA e
  // devolve o index.html para qualquer caminho desconhecido, a resposta vem
  // com status 200 e a falha passa despercebida. Os bichos ja usam a barra
  // (src={`/JornadaBicho/${item.image}`}); aqui fica igual.
  const fundo = backgroundUrl?.startsWith('/')
    ? backgroundUrl
    : `/${backgroundUrl}`;

  return (
    <div
      className={`drop-zone ${zoneName}`}
      style={{ 
      backgroundImage: `url(${fundo})`,
      backgroundSize: "cover",
      backgroundPosition: "center" 
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const itemId = e.dataTransfer.getData("text/plain");
        onDrop(itemId, zoneName, e);
      }}
    >
      {itemsToRender.map(item => {
        
        const posicao = droppedItems[item.id];
        
        return (
        <img 
          key={item.id}
          src={`/JornadaBicho/${item.image}`}
          alt={item.name}
          className="dropped-item-in-zone"
          /* Arrastavel para a crianca poder arrumar a cena depois de acertar.
             Solta de novo na mesma zona, o handleDrop so muda a posicao. */
          draggable
          onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)}
          /* O tamanho sai daqui e passa a vir do CSS (.dropped-item-in-zone):
             estilo em linha vence qualquer regra de folha, entao enquanto
             ficasse aqui nao haveria como ajustar o bicho no cenario sem
             mexer neste arquivo. Posicao continua em linha porque e calculada
             a cada soltura. */
          style={{
            objectFit: "contain",
            top: `${posicao.y}px`,
            left: `${posicao.x}px`,
        }}
        />
      );
    })}
    </div>
  );
}

export default AreaColocar;
