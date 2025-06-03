import './ZonaColocar.css'; 
function AreaColocar({ zoneName, onDrop }) {
  return (
    <div
      className="drop-zone"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const itemId = e.dataTransfer.getData("text/plain");
        onDrop(itemId, zoneName);
      }}
    >
    </div>
  );
}

export default AreaColocar;
