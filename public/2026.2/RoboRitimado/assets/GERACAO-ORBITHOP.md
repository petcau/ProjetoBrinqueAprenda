# OrbitHop e Pixel padrão — assets do menu 0.5

Criados com a ferramenta integrada de geração de imagens, sem CLI/API. Originais da equipe preservados. As referências definem a identidade; os sprites são novas interpretações com oito poses, não um modelo articulado.

- `orbithop-city-v1.png`: cenário de OrbitHop sem o personagem; derivado da concept art aprovada.
- `pixel-padrao-v1.png`: atlas de oito poses do outfit padrão, 1536 × 1024, com transparência real. Amostra a cada quatro pixels: 46,22% de alfa zero. Limites individuais das poses registrados em `front.js`.
- Referências de personagem: `Apresentação Pixel.png` e `Pixel em Palco.png`, fornecidas pelo usuário.

## Prompt do cenário

```text
Use case: precise-object-edit. Edit target: the provided OrbitHop city concept. Remove ONLY the large foreground Pixel robot guitarist, their guitar, dangling ribbons and their contact shadow/reflection from the right side. Reconstruct the plaza, city buildings and reflections plausibly behind the removed character. Preserve the exact premium anime environment style, ivory ceramic architecture, blue-violet sunset, selective pink/cyan light accents, monumental circular gateway on the left middle distance, elevated curved transit lines, landscaped terraces and wide calm foreground plaza. Keep the same 16:9 camera, composition and refined low-clutter aesthetic. This image is a full-screen animated game menu/cutscene background; the character will be rendered separately. No new characters, no text, no labels, no interface, no extra particles, no large foreground objects. Background should be fully opaque.
```

## Prompt dos sprites

```text
Use case: stylized-concept / identity-preserving animation asset.
Create a TRUE TRANSPARENT PNG GAME SPRITE ATLAS of Pixel in their EXACT DEFAULT OUTFIT, based on the attached definitive turnaround and performance reference. 8 full-body poses in a precise uniform FOUR COLUMNS by TWO ROWS grid, landscape 1536x1024. Each pose isolated with at least 8 percent clear transparent margins within its equal cell, same head size, similar height, feet baseline and three-quarter-front camera. All hair, coat tails, guitar and boots entirely inside own cell; no overlap. Not a presentation sheet.
Identity: friendly nonbinary musical robot, glossy black LED face with cyan plus-sign eye and pink happy eye/smile, tousled layered white hair, circular pink/cyan headphones with upright bunny antenna fins and bunny symbol, black tall collar, white cropped jacket with angular pink/violet shoulders, black exposed mechanical torso, white/black robotic arms, black fingerless gloves, asymmetric black-and-white long coat tails and pink pixel-patterned ribbon straps, baggy asymmetric white-and-black trousers, chunky white/black/pink high-top SNEAKERS (not heels), dangling bunny keychain. Hold the white five-point STAR electric guitar with pink face rim, cyan bevel, black neck and bunny decal, same guitar in every pose. Do not transfer candy/toy/armor costumes.
Sequence left to right top then bottom: 1 relaxed standing guitar idle, 2 gentle lean left strum, 3 gentle lean right strum, 4 guitar angled upward preparing a power chord, 5 strong full strum feet apart casting a portal (no external VFX, only pose), 6 pointing forward with one hand while holding guitar to teach, 7 cautious stepping forward toward portal, 8 surprised slightly crouched landing holding guitar.
Premium clean polished anime game illustration faithful to supplied references. Rich but controlled pink/cyan/violet highlights, articulated mechanical hands, consistent proportions and clothing. ENTIRE background fully TRANSPARENT ALPHA including gaps between arms, legs, guitar and ribbons. No floor, shadow, checkerboard, backdrop, color panel, labels, typography, borders or grid lines. All pixels outside character silhouettes alpha zero.
```

## Prompt de extração do fundo

```text
Use case: background-extraction. Edit target: the supplied atlas of EIGHT Pixel default-outfit robot guitarist poses. Remove ALL purple/gray/pink gradient BACKGROUND and replace it with real transparent alpha everywhere, including between legs, arms, guitar and ribbons. Preserve the eight characters EXACTLY, their positions, poses, colors, contours, dimensions and all outfit details. Do NOT redraw, move, resize or add anything. Preserve all white hair, black clothing, bright cyan/pink trim and white star guitars. Outside the character silhouettes must be fully transparent alpha zero. No floor, no glow haze, no shadow, no colored backdrop, no checkerboard, no text. Transparent PNG game sprite cutout with same 1536x1024 atlas composition.
```
