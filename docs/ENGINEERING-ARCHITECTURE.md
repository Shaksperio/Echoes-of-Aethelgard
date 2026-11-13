# Echoes of Aethelgard — Arquitetura de Engenharia v1

**Status:** proposta aprovada para implementação incremental  
**Decisões de produto:** 3D completo · mundo híbrido · arquitetura primeiro  
**Branch de trabalho:** `engineering/3d-hybrid-architecture`  
**Base:** `main` (linha publicada no GitHub Pages)

## 1. Objetivo

Evoluir Echoes of Aethelgard para um action-RPG de fantasia sombria em 3D, com exploração interconectada, progressão Metroidvania e mundo híbrido: a campanha deve funcionar em modo solo sem depender de conexão; cooperação e recursos persistentes online serão opcionais e integrados por serviços de rede.

A arquitetura deve permitir evoluir o jogo sem descartar os sistemas que já existem. A migração será incremental, com versões jogáveis e verificáveis em cada etapa.

## 2. Estado real encontrado na base

A branch `main` contém a versão publicada e mais completa identificada nesta inspeção:

- Jogo 2D principal em `index.html`, `css/style.css` e `js/game.js` (aprox. 98 KB).
- Sete terras, castelos, Lordes, poderes de progressão, combate, armas/magias, equipamentos, familiar, mapa, santuários, baús, NPCs e salvamento local.
- Arte e lógica de gameplay ainda concentradas em um arquivo JavaScript grande; o estado do jogo é salvo no navegador.
- Protótipo Three.js separado em `3d/`, com uma pequena sequência de salas em primeira pessoa. Ele demonstra renderização 3D, HUD e ações básicas, mas não é um motor 3D completo, não contém o mundo das sete terras e usa Pointer Lock.
- `.github/workflows/deploy.yml` publica a branch `main` no GitHub Pages.
- Não foi identificado no jogo principal um backend de contas, persistência remota, mundo compartilhado ou multiplayer.

**Limites desta inspeção:** esta descrição é uma linha de base de código, não uma certificação de QA. Ainda não há evidência de testes automatizados de gameplay, física, colisão, rede ou compatibilidade móvel.

## 3. Governança de branches

O repositório informa `turbo` como branch padrão do GitHub, mas o README de `main` e o workflow de Pages confirmam que a publicação ocorre a partir de `main`. As duas branches divergiram (15 commits à frente em `main`, 3 commits exclusivos em `turbo`, na comparação desta fase).

Para esta fase:
- Usar `main` como base operacional porque é a linha publicada e contém o protótipo 3D atual.
- Trabalhar nesta branch isolada: `engineering/3d-hybrid-architecture`.
- Abrir PR direcionado a `main`; não fazer merge automático.
- Não sincronizar, resetar, rebasear ou substituir `turbo` nesta fase.
- Antes de qualquer futura alteração da branch padrão, decidir explicitamente como reconciliar a divergência com `turbo`.

## 4. Decisões arquiteturais

### 4.1 Cliente 3D

- Evoluir o protótipo Three.js para câmera **terceira pessoa**, adequada a combate corpo a corpo, exploração, leitura de animações e cooperação. Primeira pessoa permanece apenas como protótipo histórico até ser substituída.
- Renderização 3D com cenas, materiais, iluminação, sombras, partículas, animações esqueléticas e LOD.
- Separar renderização, simulação, entrada, áudio, UI e carregamento de conteúdo.
- Projetar controles para teclado/mouse, gamepad e toque; Pointer Lock não pode ser requisito universal.
- Avaliar uma biblioteca de física 3D (por exemplo, Rapier) por meio de uma prova técnica antes de adotá-la. Não misturar física customizada e biblioteca sem uma única autoridade de colisão.

### 4.2 Núcleo de jogo e domínio

Manter os conceitos e dados atuais, migrando-os para módulos independentes:

- `core/`: ciclo de jogo, relógio, eventos e estado de execução.
- `engine/`: renderer, câmera, cena, física, colisão e streaming de assets.
- `gameplay/`: jogador, inimigos, chefes, combate, habilidades, itens e interações.
- `world/`: mapa, regiões, salas, portais, checkpoints e regras de exploração.
- `progression/`: atributos, equipamentos, inventário, quests e desbloqueios.
- `ui/`: HUD, menus, mapa, inventário, diálogos e acessibilidade.
- `platform/`: armazenamento local, áudio, entrada, rede e telemetria técnica.
- `content/`: definições de regiões, entidades, itens, missões e encontros em dados versionados.

Os sete territórios, seus castelos, Lordes e poderes existentes devem ser preservados como conteúdo de domínio. A migração visual não deve renomear, apagar ou simplificar progressão já implementada sem decisão de produto.

### 4.3 Mundo híbrido: solo primeiro, coop opcional

- **Solo:** campanha completa executável localmente; movimento, combate e exploração não dependem de servidor.
- **Coop:** sessões online opcionais, com convites/entrada controlada e sincronização de jogadores, inimigos relevantes, chefes, eventos e estado de grupo.
- **Persistência:** separar save local do perfil/estado sincronizado. Definir política explícita de conflito, reconciliação e recuperação offline.
- **Autoridade:** cliente prevê movimento e resposta local; servidor valida ações relevantes para estado compartilhado, recompensas e economia. Nunca confiar no cliente para conceder itens/moeda ou concluir chefes em sessão compartilhada.
- **Rede:** mensagens versionadas, validação de esquema, limites de frequência, reconexão e tolerância a perda de pacotes. Não enviar transformações de cada frame ao banco de dados.
- **Sem online obrigatório:** indisponibilidade de rede não bloqueia iniciar ou continuar a campanha solo.

### 4.4 Backend — decisão condicionada a prova técnica

O backend ainda não existe no jogo principal. A proposta para uma futura fase online é:
- API de sessão/identidade e coordenação em Cloudflare Workers.
- Durable Objects para estado efêmero e coordenação autoritativa por sala/sessão.
- D1 para dados duráveis de conta, personagem, progresso e economia, com operações transacionais e persistência desacoplada do loop de simulação.
- R2 ou armazenamento estático equivalente para conteúdo/arte de grande porte, se necessário.
- WebSocket para sessões em tempo real.

Esta é uma direção proposta, não infraestrutura já implantada. Antes de criar recursos Cloudflare, definir modelo de dados, threat model, limites, custos, migrações, segredos e estratégia de recuperação. Nenhum segredo deve ser armazenado no cliente ou no repositório.

## 5. Contratos internos essenciais

Definir interfaces estáveis antes de migrar sistemas:

- `GameState`: estado serializável da campanha, separado de objetos de renderização.
- `EntityId`: identificador estável de jogador, NPC, inimigo, item ou objeto do mundo.
- `WorldDefinition`: regiões, salas, conexões, pontos de spawn e requisitos de habilidade.
- `AbilityDefinition`: custo, cooldown, regras e tags de travessia.
- `SaveRepository`: carregar, salvar, versionar e migrar saves locais.
- `SessionTransport`: enviar/receber mensagens de sessão sem acoplar gameplay a WebSocket.
- `AuthorityPolicy`: distingue ações locais, ações sincronizadas e ações validadas pelo servidor.

Dados persistentes devem ter `schemaVersion` e migrações testadas. Não persistir objetos Three.js, referências DOM ou estado transitório de frame.

## 6. Plano de execução por fases

### Fase 0 — Baseline e proteção (esta fase)
1. Congelar a base de trabalho em branch isolada derivada de `main`.
2. Registrar sistemas existentes e critérios de preservação.
3. Criar inventário de dependências e riscos do protótipo 3D.
4. Definir testes de fumaça para carregar a página, iniciar jogo, movimentar, atacar, trocar sala e salvar.
5. Nenhuma substituição do jogo publicado nesta fase.

### Fase 1 — Fundação modular
1. Introduzir módulos sem alterar o comportamento visível do jogo 2D.
2. Extrair definições de conteúdo e estado de save.
3. Criar contratos e testes unitários para progressão, inventário, habilidades e saves.
4. Adicionar validação de assets e verificações automatizadas no CI.

### Fase 2 — Vertical slice 3D em terceira pessoa
1. Criar uma cena jogável curta com Kaelen, câmera terceira pessoa e controles multi-input.
2. Implementar física, colisão, locomoção, esquiva, ataque e dano.
3. Adicionar um inimigo e uma arena de chefe para validar leitura visual e responsividade.
4. Validar performance em desktop e dispositivos móveis de referência.
5. Manter o jogo 2D publicado como fallback até aprovação do slice 3D.

### Fase 3 — Migração de sistemas e conteúdo
1. Migrar habilidades, armas, equipamentos, itens, inimigos, chefes e progressão.
2. Converter as sete terras em regiões 3D conectadas com streaming e pontos de retorno.
3. Preservar segredos, gates de habilidade, mapa, santuários e recompensas.
4. Migrar saves com compatibilidade/versionamento; não apagar saves antigos.

### Fase 4 — Solo robusto e coop experimental
1. Completar a campanha solo e persistência local antes de tornar coop requisito.
2. Prototipar sessão cooperativa isolada, com sincronização e reconexão.
3. Implementar validação de autoridade e proteção contra duplicação de recompensas.
4. Testar desconexão, latência, reconexão e divergência de saves.

### Fase 5 — Mundo persistente e lançamento
1. Expandir para regiões compartilhadas, grupos, eventos e economia somente após testes.
2. Instrumentar observabilidade sem coletar conteúdo pessoal desnecessário.
3. Fazer testes de carga, segurança, acessibilidade e compatibilidade.
4. Liberar gradualmente, com rollback e migrações reversíveis.

## 7. Critérios de aceite

Uma fase só pode ser considerada concluída quando:
- O jogo anterior continua acessível e suas funcionalidades não foram removidas por acidente.
- A campanha solo funciona sem rede.
- Não há regressões nos sistemas de progressão, mapa, inventário e salvamento.
- O slice 3D tem câmera terceira pessoa, colisão consistente e controles de desktop e toque.
- Testes automatizados e smoke tests passam; workflow de publicação verde não será confundido com QA de gameplay.
- Erros críticos, saves corrompidos, duplicação de recompensas e falhas de reconexão têm testes específicos.
- Mudanças são entregues em PR revisável, com escopo, riscos, resultados de testes e plano de rollback.

## 8. Riscos e decisões em aberto

- **Escopo 3D:** criar um mundo 3D completo exige produção de modelos, rigs, animações, materiais, áudio e ferramentas de conteúdo; o protótipo atual não cobre isso.
- **Performance:** sombras dinâmicas, cenários extensos e efeitos precisam de orçamento por dispositivo e níveis de qualidade.
- **Mobile:** controles e renderização devem ser desenhados para dispositivos modestos; não presumir que WebGL desktop funcione em todos os celulares.
- **Coop:** definir tamanho máximo de grupo, persistência de sessão, matchmaking/convites e regras de propriedade de progresso antes da implementação.
- **Física:** escolher biblioteca somente após benchmark e teste de integração.
- **Identidade:** escolher login/conta apenas quando o desenho de coop exigir; modo solo não deve depender de cadastro.

## 9. Próxima entrega de engenharia

A próxima PR de código deve começar pela **Fase 0 e Fase 1**: baseline automatizado, contratos de domínio e extração modular em passos pequenos. Não começar por uma reescrita integral de `js/game.js` nem por criar backend antes dos contratos e testes. O primeiro slice 3D será uma entrega posterior e isolada.
