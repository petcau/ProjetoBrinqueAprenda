import { useState } from "react";
import PalavrasData from "./Palavras.json";

export function useAnagrama() {
  const rodada = PalavrasData.anagramas[0]; //  lógica de nível
  const palavraBase = rodada.palavraEmbaralhada;
  const palavrasValidas = rodada.palavrasValidas;

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

  const limparDescobertas = () => {
    setDescobertas([]);
  };

  return {
    letras,
    tentativa,
    descobertas,
    palavrasValidas,
    adicionarLetra,
    resetarTentativa,
    enviarPalavra,
    limparDescobertas,
  };
}
