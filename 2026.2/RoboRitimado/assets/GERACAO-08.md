# Arte da versão 0.8

Ferramenta: image_gen integrada, modo padrão. Nenhum gerador via API/CLI foi utilizado. Arquivos gerados foram copiados para assets/; os originais de referência não foram sobrescritos. Os palcos, holofotes e desenhos LED das expressões são gráficos Canvas do jogo, com cores e intensidade ajustáveis em tempo real.

## Fundos: precise-object-edit

Referências: reino-dos-doces.png e brinquedolandia.png da 0.6; Fase - Castelo Invernal.png e Fase - Paraíso.png da pasta Backgrounds - Fases disponibilizada pela usuária.

Saídas: doces-v08.png, brinquedos-v08.png, gelo-v08.png, ceu-v08.png.

Prompt comum (com o tema de cada imagem):

> Use case: precise-object-edit. Edit target is the supplied game background. Produce a polished wide 16:9 background for a children's rhythm game age 5–11. Preserve the EXACT environmental identity, architecture, composition, camera, perspective, theme and recognizable principal landmarks of the supplied image. This is a subtle cleanup, NOT a redesign. Remove about one third of tiny floating decorations, sharp streaks and duplicated props. In particular, in the RIGHTMOST 35% of the screen, behind a future dancing character, simplify small details and reduce contrast and bright highlights, preserving visible scenic layers with smooth atmospheric depth; retain that environment, never replace it with a blank solid area. Keep left area richly themed. The distant portal may remain, softly luminous. Preserve the foreground floor perspective. Replace harsh sparkling floor reflections by softer broad reflections. Keep rich color but controlled brightness, soft lighting, clearly separated large forms and exquisite finished illustration. No character, no text, no UI, no newly added stage.

Temas inseridos: candy mountains with icing, candy cane arches, luminous portal and musical bridges, pink lilac cyan palette; toy castle, toy train and bridges, building blocks, colorful floating toy islands; winter castle, aurora, blue lilac snowy bridges, crystalline portal and ice; white gold celestial islands with bridges and waterfalls, luminous portal, blue sky and soft clouds.

## Outfits novos: identity-preserve

Referências exatas: Personagem/Outfits - Pixel/Outfit - Castelo Invernal.png e Outfit - Paraíso.png. Saídas: pixel-gelo-v08.png e pixel-ceu-v08.png, com transparência RGBA.

Gelo, prompt final:

> Use the supplied image as an exact identity and outfit reference. Create one single intact full body game sprite of Pixel, wearing the identical approved ice crystal outfit, headphones, hair, boots, and ice crystal guitar. Preserve reference proportions and details. Standing upright on both feet, three-quarter front, both hands holding guitar at waist, balanced and ready to dance, friendly black LED visor. Fully visible complete body including boots and antennas, centered on a genuinely transparent background, 6% empty margin around silhouette. Polished anime illustration matching reference. No scenery, no layout, no panels, no separate body parts, no cast shadow, no text.

Paraíso, prompt final:

> Use the supplied image as the exact identity and approved outfit reference. Create one single intact full body game sprite of Pixel, wearing the identical white and gold celestial outfit, white tousled hair, headphones with antennas, long layered white gold coat, constellation ornaments, white mechanical legs, celestial white gold boots and star guitar with golden orbit rings. Preserve the reference proportions and details. Standing upright, feet apart on both boots, three-quarter front, BOTH hands holding guitar at waist, balanced, relaxed and ready to dance, black LED visor. Whole body including soles and hair tips fully in frame with 6% empty margin. Polished anime illustration in the same reference style. Genuinely transparent background. No scenery, no panels, no separate body parts, no text, no floor shadow.

## Aparências preservadas

pixel-doces-danca-v6.png, pixel-brinquedos-danca-v4.png, pixel-padrao-v1.png e os desenhos da cutscene não foram alterados. O cenário de menu orbithop-v07.png foi recuperado exatamente do commit d03dcc9. As texturas de roupa originais são usadas no renderizador, sem remontagem de membros. Somente a área interna do visor recebe desenhos LED dinâmicos.
