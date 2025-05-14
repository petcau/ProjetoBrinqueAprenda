import { useState } from "react";

const palavraBase = "LEGARIA";
const palavrasValidas = ["ALEGRIA", "ALERGIA", "GALERIA", "REGALIA"];

export function useAnagrama() {
  const letras = palavraBase.split("");
  const [tentativa, setTentativa] = useState("");
  const [descobertas, setDescobertas] = useState([]);

  const adicionarLetra = (letra) => {
    setTentativa((t) => t + letra);
  };

  const resetarTentativa = () => {
    setTentativa("");
  };

  const enviarPalavra = () => {
    const palavra = tentativa.toUpperCase();
    if (palavrasValidas.includes(palavra) && !descobertas.includes(palavra)) {
      setDescobertas((d) => [...d, palavra]);
    }
    resetarTentativa();
  };

  return { letras, tentativa, descobertas, adicionarLetra, enviarPalavra };
}
