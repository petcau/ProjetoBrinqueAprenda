# Matemagica

Jogo feito em **HTML, CSS e JavaScript puro**.

Por ser estático, o jogo não passa pelo empacotador do portal: os arquivos dele
ficam fora desta pasta, em

    public/2025.2/Matemagica/

e são servidos exatamente como a equipe entregou. Esta pasta existe para manter
a estrutura `src/jogos/<semestre>/<Jogo>/` uniforme entre os dois tipos de jogo
e para guardar a documentação da equipe.

O portal encontra o jogo pela entrada registrada no catálogo,
`src/dados/jogos.js`. Não há componente React para este jogo — a tela de jogo
(`src/paginas/Jogar.jsx`) monta o iframe a partir do catálogo.

Para rodar só este jogo durante o desenvolvimento, abra
`public/2025.2/Matemagica/index.html` com a extensão **Live Server** do VS Code.
