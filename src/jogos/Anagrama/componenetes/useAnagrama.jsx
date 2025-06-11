// src/hooks/useAnagrama.js
import { useState, useCallback } from "react";
import PalavrasData from "./Palavras.json";

export function useAnagrama() {
  const [nivelAtual, setNivelAtual] = useState(0);
  const [tentativa, setTentativa] = useState("");
  const [descobertas, setDescobertas] = useState([]);
  const [tempoEsgotado, setTempoEsgotado] = useState(false);

  const rodada = PalavrasData.anagramas[nivelAtual];
  const palavraBase = rodada.palavraEmbaralhada;
  const palavrasValidas = rodada.palavrasValidas;
  const letras = palavraBase.split("");

  const adicionarLetra = (letra) => {
    if (!tempoEsgotado) {
      setTentativa((t) => t + letra);
    }
  };

  const resetarTentativa = () => setTentativa("");

  const enviarPalavra = () => {
    if (tempoEsgotado) return;
    const palavra = tentativa.toUpperCase();

    if (palavrasValidas.includes(palavra) && !descobertas.includes(palavra)) {
      const novas = [...descobertas, palavra];
      setDescobertas(novas);
      new Audio("src/assets/Sons/respCorreta.mp3").play().catch(() => {});
    } else {
      new Audio("src/assets/Sons/respErrada.mp3").play().catch(() => {});
    }

    resetarTentativa();
  };

  const limparDescobertas = () => setDescobertas([]);

  const lidarComTempoEsgotado = () => setTempoEsgotado(true);

  const reiniciarTempo = () => {
    setTempoEsgotado(false);
    resetarTentativa();
    limparDescobertas();
  };

  const proximoNivel = useCallback(() => {
    if (nivelAtual < PalavrasData.anagramas.length - 1) {
      setNivelAtual((n) => n + 1);
      resetarTentativa();
      limparDescobertas();
    }
  }, [nivelAtual]);

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
    proximoNivel,
    tempoEsgotado,
    lidarComTempoEsgotado,
    reiniciarTempo,
  };
}