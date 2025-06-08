import ZonaColocar from "./ZonaColocar";

/**
 * Renderiza uma lista de zonas de soltura para um jogo.
 *
 * @componente
 * @param {Object} props
 * @param {string[]} props.zones - Array com os nomes das zonas a serem exibidas.
 * @param {function} props.onDrop - Função chamada quando um item é solto em uma zona.
 * @param {string} props.backgroundUrl - URL da imagem de fundo para cada zona.
 * @returns {JSX.Element} A lista renderizada de zonas.
 */
const ZonesList = ({ zones, onDrop, backgroundUrl, allObjects, droppedItems}) => (
  <div className="zones">
    {zones.map((zone) => (
      <ZonaColocar 
        key={zone} 
        zoneName={zone} 
        onDrop={onDrop}
        backgroundUrl={backgroundUrl}
        allObjects={allObjects}
        droppedItems={droppedItems}
      />
    ))}
  </div>
);

export default ZonesList;
