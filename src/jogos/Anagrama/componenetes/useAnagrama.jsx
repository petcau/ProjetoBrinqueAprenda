import { useState, useEffect, useCallback } from "react";
import PalavrasData from "./Palavras.json";

export function useAnagrama() {
  const [nivelAtual, setNivelAtual] = useState(0);
  const [tentativa, setTentativa] = useState("");
  const [descobertas, setDescobertas] = useState([]);

  const rodada = PalavrasData.anagramas[nivelAtual];
  const palavraBase = rodada.palavraEmbaralhada;
  const palavrasValidas = rodada.palavrasValidas;
  const letras = palavraBase.split("");

  const adicionarLetra = (letra) => {
    setTentativa((t) => t + letra);
  };

  const resetarTentativa = () => {
    setTentativa("");
  };

  const enviarPalavra = () => {
    const palavra = tentativa.toUpperCase();
    if (palavrasValidas.includes(palavra) && !descobertas.includes(palavra)) {
      const novas = [...descobertas, palavra];
      setDescobertas(novas);
    }
    resetarTentativa();
  };

  const limparDescobertas = () => {
    setDescobertas([]);
  };

const proximoNivel = useCallback(() => {
  if (nivelAtual < PalavrasData.anagramas.length - 1) {
    setNivelAtual((n) => n + 1);
    setTentativa("");
    setDescobertas([]);
  }
}, [nivelAtual]); // ✅ Apenas `nivelAtual` é necessário

  // Quando todas forem descobertas, avança o nível automaticamente
    useEffect(() => {
      if (
        palavrasValidas.length > 0 &&
        descobertas.length === palavrasValidas.length
      ) {
        const timer = setTimeout(proximoNivel, 1500); // pequeno delay
        return () => clearTimeout(timer);
      }
    }, [descobertas, palavrasValidas,proximoNivel]);

  return {
    letras,
    tentativa,
    descobertas,
    palavrasValidas,
    nivelAtual,
    adicionarLetra,
    resetarTentativa,
    enviarPalavra,
    limparDescobertas,
  };
}
