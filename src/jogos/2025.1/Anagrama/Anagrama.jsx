// src/Anagrama.jsx
import { useRef, useState } from "react";
import TelaInicial from "./componenetes/Anagram.TelaInicial"; // <- import da tela inicial
import { useAnagrama } from "./componenetes/useAnagrama";
import AnagramaJogo from "./componenetes/AnagramaJogo";
import AnagramaHeader from "./componenetes/AnagramaHeader";
import { usarEscalaParaCaber } from "../../_comum/usarEscalaParaCaber";
import "./game.css";

function Anagrama() {
  const [iniciou, setIniciou] = useState(false);
  const anagrama = useAnagrama();

  // Reduz o tabuleiro ate caber, sem mudar nada da composicao da equipe.
  const quadro = useRef(null);
  usarEscalaParaCaber(quadro, iniciou);

  // Se não iniciou, mostra a tela inicial (passando a função para iniciar)
  if (!iniciou) {
    return <TelaInicial onIniciar={() => setIniciou(true)} />;
  }

  // Se iniciou, mostra o jogo
  return (
    <main className="container">
      <div className="game-container-anagrama" ref={quadro}>
        <AnagramaHeader nivel={anagrama.nivelAtual} aoVoltar={() => setIniciou(false)} />
        <AnagramaJogo {...anagrama} />
      </div>
    </main>
  );
}

export default Anagrama;
