# Echoes of Aethelgard

Metroidvania 2D de fantasia sombria Arcane Punk, com mundo, personagens e sistemas originais. O jogo roda direto no navegador.

**Jogar:** https://shaksperio.github.io/Echoes-of-Aethelgard/

Sete terras, cada uma com um castelo e um Lord, da Vila Ferrugem até o Trono do Vazio.
Cada Lord derrotado concede um poder que abre caminhos nas terras anteriores.

O protótipo 3D em primeira pessoa continua disponível em [/3d/](https://shaksperio.github.io/Echoes-of-Aethelgard/3d/).

## Controles

| Ação | Teclas |
| --- | --- |
| Mover | A / D ou setas |
| Pular | Espaço ou W (segure para pular mais alto) |
| Atacar | J ou Z |
| Magia | K ou X |
| Dash | L ou C |
| Ação (santuário, baú, portal) | E ou Enter |
| Poção | Q |
| Mapa / viagem entre santuários | M |
| Pausa | P |

No celular, os botões de toque aparecem abaixo do jogo.

## Publicação

O workflow `.github/workflows/deploy.yml` publica o site no GitHub Pages a cada push na `main`.
Em Settings → Pages, a fonte deve ser **GitHub Actions**.

## Estrutura

- `index.html`, `css/style.css`, `js/game.js`: o jogo 2D
- `assets/`: artes dos personagens e chefes
- `3d/`: protótipo 3D anterior (Three.js)
