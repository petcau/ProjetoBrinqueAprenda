# Artes da atualização 0.6

Produzidas com a ferramenta integrada de geração de imagens. Referência de identidade: `Outfit - Reino dos Doces.png`, fornecida pela equipe. Os originais foram preservados.

Arquivos usados:

- `pixel-doces-danca-v6.png`: atlas 1536×1024 de oito poses, em células de 384×512. Substitui a folha anterior na fase 1. Amostra de transparência: 40,46% dos pixels com alfa zero.
- `pixel-doces-historia-v6.png`: oito poses de queda, aterrissagem, recuperação e guitarra, 1536×1024. Amostra de transparência: 33,92% com alfa zero. O renderizador usa limites e caminhos de recorte por pose para isolar as silhuetas adjacentes sem modificar a imagem original.
- `guitarra-doces-v6.png`: instrumento separado para a queda, quique e recolhimento; 1536×1024. Amostra de transparência: 69,90% com alfa zero.

As porcentagens foram amostradas a cada oito pixels, para controle técnico. As imagens são novas interpretações das referências, com o mesmo traje, e não um modelo 3D articulado.

## Prompt do atlas de dança

```text
Use case: stylized-concept / identity-preserving game animation asset.
Create ONE polished transparent PNG sprite atlas for Pixel, exactly EIGHT full-body dance poses in a strict FOUR COLUMNS x TWO ROWS grid. Landscape 1536x1024. Each cell exactly 384x512. Enforce a fully TRANSPARENT empty gutter of at least 30 pixels from EVERY cell edge. Each robot including ALL hair, guitar, clothes and shoes MUST be fully enclosed between x=30..354 and y=30..482 within their own cell. No part crosses any cell boundary. Same character scale, head size and foot baseline across ALL eight cells. Full body not chopped.
Reference 1 is the definitive CANDY OUTFIT: friendly nonbinary white-haired robot with glossy BLACK LED face, cyan plus eye and pink cheerful eye/smile, candy spiral headphones, pink/white icing-trimmed coat with little multicolor sprinkles, candy bows and translucent pastel crystal ribbons, white/pink robotic legs, chunky candy boots, white/pink CANDY electric guitar with a glowing pink/cyan SWIRL center and candy ornaments. Reproduce these costume and guitar identifiers in all poses. Premium clean anime game illustration matching the reference, clean solid contours and sharp facial features.
Poses top row left to right: 1 centered relaxed standing guitar ready, 2 gentle left strum, 3 happy heel lift guitar strum, 4 gentle right strum. Bottom row left to right: 5 small knee bend guitar strum, 6 sidestep left strum, 7 happy one-knee-up groove, 8 return centered strum. Controlled leg/arm motion, no huge jumps or cape spreads. Robot height INCLUDING hair about 425 pixels each cell. Keep the guitar moderately compact so it fits.
CRUCIAL: real transparent alpha zero outside silhouettes, clean antialiased edges, no white fringe, no rough speckles, no stray colored pixels, no grain, no outer glow haze, no background gradient, no shadows, no scenery, no text, no panel, no grid lines, no checkerboard. Each pose must be cleanly separated for animation. Stable consistent body proportions, clean readable child-friendly expressions.
```

## Prompt das poses da história

```text
Use case: stylized-concept. Production animation atlas for a children's rhythm-game cinematic. Create eight isolated FULL BODY poses of the SAME Pixel robot wearing the CANDY WORLD OUTFIT in the supplied reference. Exactly four columns by two rows, landscape 1536x1024. Same front three-quarter camera, proportions and character size. Each cell384x512 must contain only its OWN pose, wholly inside the cell with 24px transparent margins. Absolutely no silhouettes overlap cells.
Character: white tousled hair, glossy black robot LED face with cyan and pink expressive eyes, spiral candy headphones, white/pink icing-and-sprinkle outfit, bows, layered pastel crystalline coat ribbons, white/pink robotic legs and candy boots. Preserve the referenced costume, not default black coat. Premium clean anime game art, clean edges, no grain.
Pose order top left to right: 1 FALLING through air backwards, legs forward, both empty hands flailing, surprised eyes; 2 LANDED sitting on the ground, knees bent, empty hands bracing, dazed but safe friendly cartoon expression; 3 GETTING UP on one knee, empty hand pushing up, determined gentle face; 4 STANDING brushing dust off sleeve, BOTH HANDS EMPTY.
Bottom row left to right: 5 BENDING DOWN, one empty hand reaching toward ground to pick up the guitar, NO GUITAR in this pose; 6 HALF-KNEELING lifting the referenced pink/white spiral CANDY GUITAR off the ground; 7 STANDING adjusting the guitar strap and recomposing, guitar in hands; 8 CHEERFUL ready-to-play standing with candy guitar.
Poses1-5 must have ABSOLUTELY NO GUITAR and no guitar strap across hands. The guitar will be rendered as a separate prop. Poses6-8 hold the candy guitar consistent with reference. Full anatomy and clothing all visible; avoid sprawling horizontal silhouettes, fit every pose within its cell. Keep seated/falling poses lower than standing poses; never stretch their bodies to fill the height. All heads same size.
Real fully TRANSPARENT alpha background including all gaps. No floor, no ground shadow, no glow haze, no checkerboard, no text, no labels, no grid, no backdrop, no gradient. Every pixel outside silhouettes alpha zero.
```

## Prompt da guitarra

```text
Use case: stylized-concept / isolated game prop. Create a single beautiful CANDY electric GUITAR from the supplied Pixel candy outfit reference, with no person or hands. Side three-quarter view, oriented horizontally, neck pointing to the upper right by about 15 degrees. White/pink frosting-shaped guitar body, glowing pink-violet-cyan spiral circular center, small icing sprinkles, candy bows, pastel crystal star and heart pendants, dark fretboard with pink/cyan strings. SAME guitar identity as reference. Clean polished anime game rendering with precise smooth edges, joyful child-friendly design. Entire guitar and all pendants comfortably inside the image with generous empty margins. Opaque colored guitar, TRUE transparent alpha zero outside its silhouette. No backdrop, no gradient, no scenery, no shadow, no halo haze, no text, no labels, no checkerboard. Landscape PNG with only the guitar, ready to animate as a prop on the ground in a cutscene.
```
