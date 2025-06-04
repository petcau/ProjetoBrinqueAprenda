import React, { useState, useEffect } from 'react';
import '../CSS/Semaforo.css';
// Importe apenas as imagens das luzes
import luzVermelha from '../game_assets/luz_vermelha.png';
import luzAmarela from '../game_assets/luz_verde.png';
import luzVerde from '../game_assets/luz_amarela.png';

export default function Semaforo({ onComplete }) {
  const [corAtiva, setCorAtiva] = useState('vermelho');
  const [contagem, setContagem] = useState(6);

  useEffect(() => {
    const timer = setInterval(() => {
      setContagem(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete]);

  useEffect(() => {
    if (contagem > 4) {
      setCorAtiva('vermelho');
    } else if (contagem > 2) {
      setCorAtiva('amarelo');
    } else {
      setCorAtiva('verde');
    }
  }, [contagem]);

  return (
    <div className="semaforo-container">
      <div className="semaforo-body"> {/* Corpo em CSS */}
        <div className="luz-container">
          <img 
            src={luzVermelha} 
            alt="Luz vermelha" 
            className={`luz vermelho ${corAtiva === 'vermelho' ? 'ativo' : ''}`} 
          />
        </div>
        <div className="luz-container">
          <img 
            src={luzAmarela} 
            alt="Luz amarela" 
            className={`luz amarelo ${corAtiva === 'amarelo' ? 'ativo' : ''}`} 
          />
        </div>
        <div className="luz-container">
          <img 
            src={luzVerde} 
            alt="Luz verde" 
            className={`luz verde ${corAtiva === 'verde' ? 'ativo' : ''}`} 
          />
        </div>
      </div>
      <div className="contagem-texto">{contagem}s</div>
    </div>
  );
}