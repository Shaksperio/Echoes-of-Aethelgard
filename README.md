# Echoes of Aethelgard

**Metroidvania 3D Arcane-Punk** inspirado em Castlevania: Symphony of the Night, com mundo, personagens e sistemas originais.

## Jogar online (GitHub Pages)

Depois de ativar o GitHub Pages (veja abaixo), o jogo fica disponível em:

**https://shaksperio.github.io/Echoes-of-Aethelgard/**

### Como ativar o GitHub Pages (uma vez só)

1. Vá em **Settings** do repositório
2. No menu lateral, clique em **Pages**
3. Em **Source**, escolha **GitHub Actions**
4. Pronto. O workflow já está configurado e vai publicar automaticamente a cada push na `main`.

Você também pode ir em **Actions** e rodar o workflow **Deploy to GitHub Pages** manualmente.

---

## Como jogar localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/Shaksperio/Echoes-of-Aethelgard.git
   cd Echoes-of-Aethelgard
   ```
2. Suba um servidor local:
   ```bash
   python -m http.server 8080
   ```
3. Acesse http://localhost:8080
4. Clique em **Entrar em Aethelgard** e depois clique na tela para capturar o mouse.

## Controles

| Ação | Tecla |
|------|-------|
| Mover | WASD / Setas |
| Pular / Pulo Duplo | Espaço |
| Dash | Shift |
| Atacar (Lâmina Etérea) | Clique esquerdo ou F |
| Salvar / Curar | E (perto do Pilar de Salvamento) |
| Olhar | Mouse |

## O que já existe no protótipo

- 3 áreas conectadas (Hall de Entrada, Corredor das Sombras, Antecâmara do Lorde)
- Sistema de vida e Éter
- Dash com consumo de Éter
- Pulo Duplo (colete o cristal ciano na plataforma lateral)
- Combate corpo-a-corpo
- Inimigos com IA simples (esqueletos e rastejadores de cristal)
- Pilar de Salvamento + respawn
- Transição entre salas
- HUD e mensagens de feedback

## Personagens (conceito)

- **Kaelen** — Protagonista (braço e espada de energia azul)
- **Elara** — Eco-Vigilante / guia
- **Malakor** — Arquiteto do Vazio (antagonista final)

## GitHub Actions

O workflow `.github/workflows/deploy.yml` publica o site no GitHub Pages automaticamente a cada push na branch `main`.

Projeto em desenvolvimento ativo.
