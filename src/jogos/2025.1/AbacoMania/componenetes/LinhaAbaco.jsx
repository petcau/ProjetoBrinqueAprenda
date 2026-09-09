import React from 'react';
import '../game.css';

function LinhaAbaco({ valorLinha, qtdContas, onMoverConta }) {
    const handleClick = (index) => {
        const direcao = index < qtdContas ? 'baixo' : 'cima';
        onMoverConta(direcao);
    };

    return (
        <div className="linha-abaco">
            <div className="valor-linha">{valorLinha}</div>
            <div className="contas">
                {[...Array(4)].map((_, i) => (
                    <div 
                        key={i} 
                        className={`conta ${i < qtdContas ? 'ativo' : ''}`}
                        onClick={() => handleClick(i)}
                    />
                ))}
            </div>
            <div className="barra"></div>
            <div className="contas">
                <div 
                    className={`conta ${qtdContas === 4 ? 'ativo' : ''}`}
                    onClick={() => onMoverConta(qtdContas === 4 ? 'baixo' : 'cima')}
                />
            </div>
        </div>
    );
}

export default LinhaAbaco;