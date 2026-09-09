// src/Anagrama.jsx
import { useState } from "react";
import TelaInicial from "./componenetes/Anagram.TelaInicial"; // <- import da tela inicial
import { useAnagrama } from "./componenetes/useAnagrama";
import AnagramaJogo from "./componenetes/AnagramaJogo";
import AnagramaHeader from "./componenetes/AnagramaHeader";
import "./game.css";

function Anagrama() {
  const [iniciou, setIniciou] = useState(false);
  const anagrama = useAnagrama();

  // Se não iniciou, mostra a tela inicial (passando a função para iniciar)
  if (!iniciou) {
    return <TelaInicial onIniciar={() => setIniciou(true)} />;
  }

  // Se iniciou, mostra o jogo
  return (
    <main className="container">
      <div className="game-container-anagrama">
        <AnagramaHeader nivel={anagrama.nivelAtual} />
        <AnagramaJogo {...anagrama} />
      </div>
    </main>
  );
}

export default Anagrama;
