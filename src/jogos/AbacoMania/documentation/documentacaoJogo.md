<table style="width: 100%;">
  <tr>
    <td style="vertical-align: middle; padding-right: 10px;">
      <h1 style="margin: 0;">Documento do Jogo</h1>
    </td>
    <td style="vertical-align: middle; text-align: right;">
      <img src="../../../assets/UNEB-logo.png" width="200">
    </td>
  </tr>
</table>

## lógica do jogo
- Painel de controle pra lógica de funcionamento do jogo:

        <main className="container">
            <div className="game-container-V">
                <h1 className="titulo">Abaco Mania</h1>
                
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
                    <p>Clique nas contas para movê-las para cima ou para baixo</p>
                    <p>Cada linha vale: 1, 5, 10, 50, 100</p>
                    <p>Tente alcançar o valor alvo mostrado acima!</p>
                </div>


## Componentes ( React )
Adição de funções básicas como as de modificação do painel de controle ".painel-de-controle" ou com os botões no geral, mudando a formatação de acordo com a necessidade que se pede.
Sobre o design, a cor de background completa e divide ela em 2 partes para que tenhoa um degradê de cores somente por formato estético.

## Design imagens

Ábaco quando tem seu resultado certo:

<img src="../game_assets/AbacoAcerto.png" width="500" height="400">

Ábaco quando tem seu resultado errado:

<img src="../game_assets/AbacoErro.png" width="500" height="400">