\# Guia de Personalização para Educadores



Este guia explica como você pode facilmente adicionar, remover ou modificar as fases do jogo "Palavras Mágicas" para adequá-lo às suas necessidades pedagógicas.



\## O Arquivo de Níveis



Toda a configuração das fases do jogo está centralizada no arquivo: `game\_assets/data/niveis.json`.



Este é um arquivo de texto simples que você pode editar com qualquer editor de texto básico (como o Bloco de Notas no Windows ou o TextEdit no Mac).



\## Estrutura de uma Fase



Cada fase do jogo é representada por um bloco de texto dentro de colchetes `{}`. Veja um exemplo:



```json

{

&nbsp; "nivel": 1,

&nbsp; "palavra": "BOLA",

&nbsp; "imagem": "../game\_assets/images/bola.png",

&nbsp; "som\_sucesso": "../game\_assets/sounds/success.mp3"

}

```



Cada fase tem 4 partes:



1\.  \*\*`nivel`\*\*: O número da fase. Deve ser sequencial (1, 2, 3, ...).

2\.  \*\*`palavra`\*\*: A palavra que a criança precisa formar. \*\*Use letras maiúsculas e sem acentos\*\* para garantir a compatibilidade.

3\.  \*\*`imagem`\*\*: O caminho para o arquivo de imagem correspondente à palavra. As imagens devem ser colocadas na pasta `game\_assets/images/`.

4\.  \*\*`som\_sucesso`\*\*: O caminho para um arquivo de som que tocará quando a criança acertar a palavra (opcional). Os sons devem ser colocados na pasta `game\_assets/sounds/`.



\## Como Adicionar uma Nova Fase



1\.  \*\*Prepare seus arquivos:\*\*

&nbsp;   -   Escolha uma imagem para a nova palavra (ex: `flor.png`) e coloque-a na pasta `game\_assets/images/`.

&nbsp;   -   (Opcional) Escolha um som e coloque-o na pasta `game\_assets/sounds/`.



2\.  \*\*Edite o arquivo `niveis.json`:\*\*

&nbsp;   -   Vá até o final do arquivo, antes do `]` de fechamento.

&nbsp;   -   Adicione uma vírgula `,` após o último `}`.

&nbsp;   -   Copie e cole um novo bloco de fase e altere os valores.



\*\*Exemplo:\*\* Para adicionar a palavra "FLOR" como a fase 5:



```json

\[

&nbsp; {

&nbsp;   "nivel": 1,

&nbsp;   "palavra": "BOLA",

&nbsp;   "imagem": "../game\_assets/images/bola.png",

&nbsp;   "som\_sucesso": "../game\_assets/sounds/success.mp3"

&nbsp; },

&nbsp; {

&nbsp;   "nivel": 2,

&nbsp;   "palavra": "GATO",

&nbsp;   "imagem": "../game\_assets/images/gato.png",

&nbsp;   "som\_sucesso": "../game\_assets/sounds/success.mp3"

&nbsp; },

&nbsp; {

&nbsp;   "nivel": 3,

&nbsp;   "palavra": "SOL",

&nbsp;   "imagem": "../game\_assets/images/sol.png",

&nbsp;   "som\_sucesso": "../game\_assets/sounds/success.mp3"

&nbsp; },

&nbsp; {

&nbsp;   "nivel": 4,

&nbsp;   "palavra": "CASA",

&nbsp;   "imagem": "../game\_assets/images/casa.png",

&nbsp;   "som\_sucesso": "../game\_assets/sounds/success.mp3"

&nbsp; },

&nbsp; {

&nbsp;   "nivel": 5,

&nbsp;   "palavra": "FLOR",

&nbsp;   "imagem": "../game\_assets/images/flor.png",

&nbsp;   "som\_sucesso": "../game\_assets/sounds/success.mp3"

&nbsp; }

]

```



\*\*Importante:\*\* Certifique-se de que todos os blocos de fase, exceto o último, terminem com uma vírgula `,`.



\## Como Remover uma Fase



Simplesmente apague o bloco de texto correspondente à fase que você deseja remover, incluindo o `{` e `}`. Lembre-se de ajustar as vírgulas para que não haja uma vírgula após o último bloco.



Pronto! Ao salvar o arquivo `niveis.json`, o jogo será automaticamente atualizado com as novas fases na próxima vez que for carregado.

