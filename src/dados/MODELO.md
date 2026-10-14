# Como publicar um jogo no portal

Este guia é para as equipes da disciplina **Web1**. Publicar um jogo são
**3 passos**, e nenhum deles exige mexer nas telas do portal.

O portal monta tudo — rotas, cards, ficha do jogo, página da turma e créditos —
a partir de um arquivo só: [`src/dados/jogos.js`](./jogos.js). Se a sua entrada
estiver lá e correta, o jogo aparece.

---

## Antes de começar: qual é o seu caso?

O portal aceita jogos feitos das duas formas ensinadas na disciplina.

### Caso A — jogo em HTML, CSS e JavaScript puro

Os arquivos do jogo vão para `public/<semestre>/<NomeDoJogo>/`, e são servidos
exatamente como você entregou. Nada é reprocessado.

```
public/2026.1/MeuJogo/
├── index.html
├── style.css
├── script.js
└── assets/
```

**Regra que não pode ser quebrada:** todos os caminhos dentro do jogo precisam
ser **relativos** (`assets/foto.png`, `./style.css`). Caminhos que começam com
barra (`/assets/foto.png`) vão procurar na raiz do portal e dar erro 404.

Para desenvolver, abra o `index.html` do seu jogo com a extensão **Live Server**
do VS Code, como você já faz. Ele funciona sozinho — é essa autonomia que
permite publicá-lo sem reescrever nada.

### Caso B — jogo em React

Os arquivos vão para `src/jogos/<semestre>/<NomeDoJogo>/`, e o componente
principal precisa ter um `export default`.

```
src/jogos/2026.1/MeuJogo/
├── MeuJogo.jsx      <- export default MeuJogo
├── game.css
├── componentes/
└── game_assets/
```

**Regra que não pode ser quebrada:** no seu CSS, **não use nomes genéricos** de
classe como `.container`, `.card`, `.titulo`, `.menu`, nem regras em elemento
solto como `button { }` ou `img { }`. O CSS de todos os jogos React convive no
mesmo navegador, e um nome repetido faz o estilo de uma equipe sobrescrever o de
outra. Use um prefixo seu: `.meujogo-container`, `.meujogo-botao`.

Imagens e sons devem ser importados, nunca escritos como texto:

```jsx
import somAcerto from './game_assets/acerto.mp3';   // ✅ funciona publicado
new Audio(somAcerto).play();

new Audio('src/jogos/.../acerto.mp3').play();        // ❌ funciona só no seu PC
```

---

## Passo 1 — coloque os arquivos do jogo

Conforme o caso A ou B acima. Mantenha o nome da pasta igual ao nome do jogo,
sem espaços nem acentos: `TesouroAVista`, não `Tesouro à Vista`.

## Passo 2 — coloque a capa

Um arquivo em `public/capas/<slug-do-jogo>.webp`.

- Formato **WebP**, proporção **16:9**, idealmente **1200 × 675 px**
- Até 150 KB (o portal é usado em escolas, muitas com internet lenta)
- Mostre o jogo: a tela de título ou uma cena real, não um logotipo solto

Para converter e redimensionar, use o [Squoosh](https://squoosh.app).

## Passo 3 — acrescente a entrada no catálogo

Abra [`src/dados/jogos.js`](./jogos.js). Se a sua turma ainda não existe,
crie o bloco dela no **topo** da lista `TURMAS` (a mais recente vem primeiro):

```js
{
  semestre: '2026.1',
  disciplina: 'Web1',
  curso: 'Engenharia de Software',
  periodo: 'março a julho de 2026',
  jogos: [
    // as entradas dos jogos da turma vêm aqui
  ],
},
```

E dentro de `jogos`, a entrada do seu jogo. Copie este modelo:

```js
{
  // Vira o endereço do jogo: /jogo/meu-jogo
  // Só letras minúsculas, números e hífen. Sem acento e sem espaço.
  slug: 'meu-jogo',

  titulo: 'Meu Jogo',

  // Uma linha, com verbo no imperativo, que convida a jogar.
  subtitulo: 'Resolva os enigmas antes que o tempo acabe!',

  // 1 ou 2 frases. É o texto que aparece no card da home.
  sinopse: 'Um desafio de lógica em que cada fase pede uma estratégia nova.',

  // 1 parágrafo explicando como o jogo funciona, escrito para a criança
  // e para o professor. Aparece na ficha, em "Sobre o jogo".
  descricao: 'Em Meu Jogo, o jogador precisa... A cada fase...',

  // Uma frase final sobre o valor pedagógico. Aparece destacada na ficha.
  chamada: 'Uma forma leve de treinar raciocínio lógico e atenção!',

  capa: '/capas/meu-jogo.webp',

  // Quando o jogo ficou pronto, no formato ANO-MÊS.
  dataCriacao: '2026-07',

  // Faixa escolar do portal. Hoje todos os jogos usam o mesmo valor:
  // o acervo é indicado a partir do 4º ano do Ensino Fundamental.
  // Se um jogo futuro precisar de outra faixa, acrescente o código novo em
  // PUBLICOS e PUBLICOS_CURTO no fim de jogos.js.
  publicoAlvo: 'a-partir-4ano',

  // Áreas do jogo. Pode ser mais de uma. É o que faz o jogo aparecer na
  // barra de categorias da home e no filtro de /jogos. Valores possíveis:
  //   'matematica' 'portugues' 'ciencias' 'logica'
  //   'natureza'   'historia-geografia'   'tecnologia' É o que faz o jogo
  // aparecer na barra de categorias da home e no filtro de /jogos.
  categorias: ['matematica', 'logica'],

  // De 3 a 5 competências trabalhadas. São o que o professor lê para
  // decidir se leva o jogo para a aula — seja específico.
  // Bom: 'Multiplicação até 10'. Ruim: 'Matemática'.
  habilidades: [
    'Raciocínio lógico',
    'Resolução de problemas',
    'Atenção e concentração',
  ],

  // De 2 a 4 destaques do jogo, cada um com um emoji.
  caracteristicas: [
    { icone: '🧩', titulo: 'Fases progressivas', descricao: 'A dificuldade cresce a cada etapa vencida.' },
    { icone: '⏱️', titulo: 'Contra o relógio', descricao: 'Um cronômetro que dá ritmo à partida.' },
  ],

  // Nome completo de todos os integrantes da equipe.
  autores: ['Nome Sobrenome', 'Outro Nome Sobrenome'],

  // Caso A (HTML/JS puro) — caminho do index.html dentro de public/:
  jogo: { tipo: 'estatico', entrada: '/2026.1/MeuJogo/index.html' },

  // Caso B (React) — troque a linha acima por esta:
  // jogo: { tipo: 'react', carregar: () => import('../jogos/2026.1/MeuJogo/MeuJogo.jsx') },
},
```

---

## Testando antes de entregar

```bash
npm install     # só na primeira vez
npm run dev
```

Abra <http://localhost:5173> e confira:

- [ ] O card do seu jogo aparece na home, na sua turma
- [ ] A capa não está esticada nem cortada
- [ ] A ficha em `/jogo/seu-slug` mostra tudo: descrição, data, público, competências, autores
- [ ] O botão **JOGAR** abre o jogo e ele funciona do início ao fim
- [ ] O botão **Voltar** traz de volta para a ficha
- [ ] A página da sua turma lista o jogo e os nomes da equipe
- [ ] Reduzindo a janela até o tamanho de um celular, nada quebra

E rode o teste do projeto antes de abrir o Pull Request:

```bash
npm run build
```

Se der erro, a mensagem diz o arquivo e a linha. O erro mais comum é vírgula
faltando no catálogo.

---

## Entrega

Abra um **Pull Request** com um título no formato
`Turma 2026.1 — jogo Meu Jogo`. Quando ele for aprovado e integrado, o portal se
publica sozinho em <https://brinqueaprenda.com.br> em cerca de dois minutos.

## Erros mais comuns

| Sintoma | Causa provável |
|---|---|
| O jogo aparece em branco | Caminho absoluto (`/assets/...`) no jogo estático. Troque por relativo. |
| Funciona no `npm run dev` e quebra publicado | Caminho de imagem ou som escrito como texto em vez de `import`. |
| A capa aparece esticada | A imagem não está em 16:9. |
| O estilo de outro jogo mudou | Você usou um nome de classe genérico no CSS. Prefixe tudo. |
| `npm run build` reclama de token inesperado | Vírgula ou chave faltando na sua entrada do catálogo. |
| O card não aparece | O `slug` está repetido, ou a entrada ficou fora do array `jogos`. |
