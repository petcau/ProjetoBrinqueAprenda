import levels from "./fases.json"
import React, { useEffect, useState } from 'react';
import './game.css';

function Abaco() {
    const [valor, setValor] = useState(0);
    const [contas, setContas] = useState([0, 0, 0, 0, 0]);
    const [faseAtual, setFaseAtual] = useState(1);
    const [alvo, setAlvo] = useState(gerarNumeroAleatorio());
    const [mensagem, setMensagem] = useState('');
    const [mostrarAlvo, setMostrarAlvo] = useState(true);
    const [acertou, setAcertou] = useState(false);

    const linhasValores = [1, 5, 10, 50, 100];

    const atualizarAlvo = () => {
        const fase = levels.levels.find(level => level.id === faseAtual);
        if (fase){
            setAlvo(fase.alvo);
        }
    };
    useEffect(() => {
        atualizarAlvo();
    }, [faseAtual]);

    function gerarNumeroAleatorio() {
        return Math.floor(Math.random() * 500) + 1;
    }

    const verificarAcerto = () => {
        if (valor === alvo) {
            setMensagem('Parabéns! Você acertou! 🥳 ');
            setAcertou(true);
        } else if (valor < alvo) {
            setMensagem(`Faltam ${alvo - valor}. Tente novamente! 🤔`);
            setAcertou(false);
        } else {
            setMensagem(`Passou ${valor - alvo}. Tente novamente! 🤔`);
            setAcertou(false);
        }
    };

    const gerarNovoAlvo = () => {
        setAlvo(gerarNumeroAleatorio());
        setMensagem('');
        resetarAbaco();
    };

    const moverConta = (linhaIndex, direcao) => {
        const novasContas = [...contas];
        if (direcao === 'cima' && novasContas[linhaIndex] < 4) {
            novasContas[linhaIndex] += 1;
        } else if (direcao === 'baixo' && novasContas[linhaIndex] > 0) {
            novasContas[linhaIndex] -= 1;
        }
        
        setContas(novasContas);
        calcularTotal(novasContas);
        setMensagem('');
    };

    const calcularTotal = (contasAtuais) => {
        const total = contasAtuais.reduce((acc, qtd, index) => {
            return acc + (qtd * linhasValores[index]);
        }, 0);
        setValor(total);
    };

    const resetarAbaco = () => {
        setContas([0, 0, 0, 0, 0]);
        setValor(0);
        setMensagem('');
        setAcertou(false);
    };

    const proximaFase = () => {
        if (faseAtual < levels.levels.length){
            setFaseAtual(faseAtual + 1);
            setAcertou(false);
            resetarAbaco();
        } else {
            setMensagem("Parabéns! Você terminou todas as fases! 🤩 ");
        }
    };

    return (
        <main className="container">
            <div className="game-container-V">
                <h1 className="titulo">Ábacomania</h1>
                
                <div className="painel-controle">
                    <div className="valores">
                    {/*<div className="valor-atual">Seu valor: <strong>{valor}</strong></div>*/}
                    {mostrarAlvo && (
                            <div className="valor-alvo">Valor: <strong>{alvo}</strong></div>
                        )}
                        <div className="valor-alvo">Nivel: <strong>{faseAtual}</strong></div>
                    </div>
                    
                    
                
                {mensagem && (
                    <div className={`feedback ${valor === alvo ? 'acerto' : 'erro'}`}>
                        {mensagem}
                    </div>
                )}
                
                <div className="abaco">
                    {contas.map((qtdContas, linhaIndex) => (
                        <LinhaAbaco 
                            key={linhaIndex}
                            valorLinha={linhasValores[linhaIndex]}
                            qtdContas={qtdContas}
                            onClick={(direcao) => moverConta(linhaIndex, direcao)}
                        />
                    ))}
                </div>
                <div className="botoesContainer">
                        {/* <button onClick={() => setMostrarAlvo(!mostrarAlvo)}>
                            {mostrarAlvo ? ' Esconder' : ' Mostrar'}
                        </button>*/}
                        
                        <button onClick={verificarAcerto} className="verificar-botoes">
                             Verificar
                        </button>
                        {/*<button onClick={gerarNovoAlvo} className="novo-alvo">
                             Novo Alvo
                        </button>*/}
                        {/*<button onClick={resetarAbaco} className="resetar">
                             Resetar
                        </button>*/}
                        {acertou && (<button onClick={proximaFase} className="proxima-fase-botoes">
                            <div className="Invisible"></div>
                            Próxima Fase
                        </button>)}
                    </div>
                </div>
                
                <div className="instrucoes">
                    <p>Clique nos círculos para adicionar valores ao seu ábaco. Cada linha vale: 1, 5, 10, 50, 100. Tente alcançar o valor alvo mostrado acima!</p>
                </div>
            </div>
        </main>
    );
}

function LinhaAbaco({ valorLinha, qtdContas, onClick }) {
    return (
        <div className="linha-abaco">
            <div className="valor-linha">{valorLinha}</div>
            <div className="contas">
                {[...Array(4)].map((_, i) => (
                    <div 
                        key={i} 
                        className={`conta ${i < qtdContas ? 'ativo' : ''}`}
                        onClick={() => onClick(i < qtdContas ? 'baixo' : 'cima')}
                    />
                ))}
            </div>
            {/*<div className="barra"></div>  Faz aparecer uma barra entre o menu do ábaco*/}
            <div className="contas">
            {/* <div 
                    className={`conta ${qtdContas === 4 ? 'ativo' : ''}`}
                    onClick={() => onClick(qtdContas === 4 ? 'baixo' : 'cima')}
                />  Faz aparecer uma nova aba de informação ao lado dos menus aritiméticos*/}
            </div>
        </div>
    );
}

export default Abaco;