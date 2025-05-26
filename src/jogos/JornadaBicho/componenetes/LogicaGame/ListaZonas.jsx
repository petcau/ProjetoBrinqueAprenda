import ZonaColocar from "./ZonaColocar";

/**
 * Componente que renderiza uma lista de zonas de drop.
 *
 * Renderiza um elemento div com a classe "zones" e
 * um componente ZonaColocar para cada zona passada
 * como propriedade.
 *
 * @param {string[]} zones - Uma lista de nomes de zonas.
 * @param {function} onDrop - Fun o chamada quando um item   colocado em uma zona.
 * @returns {JSX.Element} O JSX do componente.
 */
const ZonesList = ({ zones, onDrop }) => (
  <div className="zones">
    {zones.map((zone) => (
      <ZonaColocar key={zone} zoneName={zone} onDrop={onDrop} />
    ))}
  </div>
);

export default ZonesList;