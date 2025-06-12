// src/hooks/useAnagrama.js

// Importa os hooks do React
import { useState, useCallback } from "react";
// Importa os dados das palavras
import PalavrasData from "./Palavras.json";

// Hook personalizado que gerencia a lógica do jogo de anagramas
export function useAnagrama() {
  // Estado para armazenar o nível atual do jogo
  const [nivelAtual, setNivelAtual] = useState(0);
  // Palavra que o jogador está tentando formar
  const [tentativa, setTentativa] = useState("");
  // Lista de palavras já descobertas pelo jogador
  const [descobertas, setDescobertas] = useState([]);
  // Indica se o tempo da rodada acabou
  const [tempoEsgotado, setTempoEsgotado] = useState(false);

  // Dados da rodada atual com base no nível
  const rodada = PalavrasData.anagramas[nivelAtual];
  const palavraBase = rodada.palavraEmbaralhada; // Palavra embaralhada exibida ao jogador
  const palavrasValidas = rodada.palavrasValidas; // Lista de palavras corretas que podem ser formadas
  const letras = palavraBase.split(""); // Separa as letras da palavra embaralhada

  // Adiciona uma letra à tentativa atual (somente se o tempo não acabou)
  const adicionarLetra = (letra) => {
    if (!tempoEsgotado) {
      setTentativa((t) => t + letra);
    }
  };

  // Reseta a tentativa atual
  const resetarTentativa = () => setTentativa("");

  // Verifica se a palavra enviada é válida e toca o som correspondente
  const enviarPalavra = () => {
    if (tempoEsgotado) return;

    const palavra = tentativa.toUpperCase();

    // Se for válida e ainda não descoberta, adiciona à lista
    if (palavrasValidas.includes(palavra) && !descobertas.includes(palavra)) {
      const novas = [...descobertas, palavra];
      setDescobertas(novas);
      // Som de resposta correta
      new Audio("src/assets/Sons/respCorreta.mp3").play().catch(() => {});
    } else {
      // Som de resposta incorreta
      new Audio("src/assets/Sons/respErrada.mp3").play().catch(() => {});
    }

    resetarTentativa();
  };

  // Limpa a lista de descobertas
  const limparDescobertas = () => setDescobertas([]);

  // Marca que o tempo acabou
  const lidarComTempoEsgotado = () => setTempoEsgotado(true);

  // Reinicia o tempo e limpa estados
  const reiniciarTempo = () => {
    setTempoEsgotado(false);
    resetarTentativa();
    limparDescobertas();
  };

  // Avança para o próximo nível, se houver
  const proximoNivel = useCallback(() => {
    if (nivelAtual < PalavrasData.anagramas.length - 1) {
      setNivelAtual((n) => n + 1);
      resetarTentativa();
      limparDescobertas();
    }
  }, [nivelAtual]);

  // Retorna os dados e funções necessárias para o jogo
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
