import levels from "./fases.json"
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usarEscalaParaCaber } from '../../_comum/usarEscalaParaCaber';
import './game.css';
import somVitoriaSound from '../../../assets/Sons/somVitoria.mp3';
import somDerrotaSound from '../../../assets/Sons/somDerrota.mp3';

    //funções do ábaco, a parte que faz os arquivos se conectarem
function Abaco() {
    const [valor, setValor] = useState(0);
    const [contas, setContas] = useState([0, 0, 0, 0, 0]);
    const [faseAtual, setFaseAtual] = useState(1);
    const [mensagem, setMensagem] = useState('');
    const [acertou, setAcertou] = useState(false);

    const audioEvento = useRef(null);
    const navegar = useNavigate();

    // A mensagem aparece como janela por 3 segundos. O selo existe porque, ao
    // errar duas vezes com o mesmo texto, o estado nao muda e o React nao
    // re-renderiza — a janela nunca reapareceria.
    const [selo, setSelo] = useState(0);
    const avisar = (texto) => {
        setMensagem(texto);
        setSelo((s) => s + 1);
    };

    useEffect(() => {
        if (!mensagem) return undefined;
        const tempo = setTimeout(() => setMensagem(''), 3000);
        return () => clearTimeout(tempo);
    }, [mensagem, selo]);

    // Reduz o quadro de 1200x900 ate caber, sem mudar a composicao da equipe.
    const quadro = useRef(null);
    usarEscalaParaCaber(quadro, true);

    const linhasValores = [1, 5, 10, 50, 100];
    const alvo = levels.levels.find((level) => level.id === faseAtual)?.alvo ?? 0;

    //Função para checar se o valor está correto, de acordo com as marcações dos botões e setar os sons com o [Audio(somVitoriaSound)]
    const verificarAcerto = () => {
        if (valor === alvo) {
            avisar('Parabéns! Você acertou! 🥳 ');
            setAcertou(true);
            audioEvento.current = new Audio(somVitoriaSound);
            audioEvento.current.play();
        } else if (valor < alvo) {
            avisar(`Faltam ${alvo - valor}. Tente novamente! 🤔`);
            setAcertou(false);
            audioEvento.current = new Audio(somDerrotaSound);
            audioEvento.current.play();
        } else {
            avisar(`Passou ${valor - alvo}. Tente novamente! 🤔`);
            setAcertou(false);
            audioEvento.current = new Audio(somDerrotaSound);
            audioEvento.current.play();
        }
    };

    //Faz parte do código anterior, está aqui para relembrar algumas coisas se necessario utilizar novamente
    // const gerarNovoAlvo = () => {
    //     setAlvo(gerarNumeroAleatorio());
    //     setMensagem('');
    //     resetarAbaco();
    // };

    //Aqui é o que faz as contas funcionarem. Quando marca uma bolinha ela aumenta a quantidade do valor que será somado e comparado na função de comparação acima
    const moverConta = (linhaIndex, direcao) => {
        const novasContas = [...contas];
        if (direcao === 'cima' && novasContas[linhaIndex] < 9) {
            novasContas[linhaIndex] += 1;
        } else if (direcao === 'baixo' && novasContas[linhaIndex] > 0) {
            novasContas[linhaIndex] -= 1;
        }
        
        setContas(novasContas);
        calcularTotal(novasContas);
        setMensagem('');
    };
    //Aqui calcula a quantidade de bolinhas e multiplica pelo valor da linha escolhida, como 100 ou 50 ou 10
    const calcularTotal = (contasAtuais) => {
        const total = contasAtuais.reduce((acc, qtd, index) => {
            return acc + (qtd * linhasValores[index]);
        }, 0);
        setValor(total);
    };

    //Resetar as informações quando passa de nivel
    const resetarAbaco = () => {
        setContas([0, 0, 0, 0, 0]);
        setValor(0);
        setMensagem('');
        setAcertou(false);
    };
    //Passa para a proxima fase e reseta as informações
    const proximaFase = () => {
        if (faseAtual < levels.levels.length){
            setFaseAtual(faseAtual + 1);
            setAcertou(false);
            resetarAbaco();
        } else {
            avisar("Parabéns! Você terminou todas as fases! 🤩 ");
        }
    };

    //Parte principal do html que mostra as informações e chama algumas das funções como, [alvo] e [faseAtual]
    return (
        <main className="container">
            <div className="game-container-V" ref={quadro}>
                <button
                    className="botao-menu-abaco"
                    onClick={() => navegar("/jogo/abacomania")}
                >
                    Menu
                </button>

                <div className="valores">
                {/*<div className="valor-atual">Seu valor: <strong>{valor}</strong></div>*/}
                    <div className="valor-alvo">Nivel: <strong>{faseAtual}</strong></div>
                    <div className="valor-alvo valor-alvo-destaque">Valor: <strong>{alvo}</strong></div>
                </div>

                <h1 className="titulo">🎮 Ábacomania 🧠</h1>

                <div className="painel-controle">

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
                {/* Os botões que fazem as coisas funcionarem do código*/}
                <div className="botoesContainer">
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
                    <p>Clique nos círculos para adicionar valores ao seu ábaco. Cada linha vale: 1, 5, 10, 50, 100. Tente alcançar o valor alvo!</p>
                </div>
            </div>
        </main>
    );
}

//Aqui faz as bolinhas contarem como numeros, chamando uma função que calcula a quantidade que cada uma vale
function LinhaAbaco({ valorLinha, qtdContas, onClick }) {
    return (
        <div className="linha-abaco">
            <div className="valor-linha">{valorLinha}</div>
            <div className="contas">
                {[...Array(9)].map((_, i) => (
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
