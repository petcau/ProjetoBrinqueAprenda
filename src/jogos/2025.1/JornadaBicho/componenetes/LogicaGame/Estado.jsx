import { useState } from "react";
import MenuJornada from "../MenuJornada";

function useEstado() {
  const [estado, setEstado] = useState(true);
  
  return [estado, setEstado];
}

function Estado() {
  const [estado, setEstado] = useEstado();

  return (
    <MenuJornada estado={estado} setEstado={setEstado} />
  );
}

export default Estado;