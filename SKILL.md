---
name: claude-usage-card
description: Gera um cartão HTML local no estilo do painel de uso que o próprio Claude Code mostrava — sessões, mensagens, total de tokens, dias ativos, sequência atual e maior sequência, horário de pico, modelo favorito, mapa de calor das últimas semanas, aba por modelo, filtros Todos/30d/7d e uma comparação divertida com livros — lendo os transcripts do próprio computador; nada sai da máquina. Use quando a pessoa quiser ver o "cartão", o "painel de uso", as "estatísticas" ou o "resumo" do uso do Claude Code (por exemplo "mostra meu painel de uso", "quantas sessões/mensagens eu já tive", "minha sequência de dias", "meu modelo favorito", "mapa de calor do meu uso"), ou algo curto e bonito para compartilhar. Para análise detalhada (metas, projeções, insights, calendário completo), prefira a skill claude-usage-dashboard. Builds a local HTML usage card (sessions, messages, total tokens, active days, streaks, peak hour, favorite model, heatmap, per-model tab, All/30d/7d filters) from the user's own Claude Code transcripts.
---

# Cartão de consumo do Claude Code

Gera (ou atualiza) um `card.html` que abre direto no navegador, sem servidor e sem internet, a partir dos transcripts que o
Claude Code já guarda no computador da pessoa. O trabalho é feito por um script pronto (`scripts/build-card.js`): você só
prepara o ambiente, roda, confere o resultado e explica o que a pessoa está vendo. Não reescreva a contagem à mão.

## Antes de rodar

1. **Node.js** (versão 14 ou mais nova): `node --version`. Se não existir, explique em uma frase por que é preciso e
   **pergunte antes de instalar** (Windows `winget install OpenJS.NodeJS.LTS`; macOS `brew install node`; Linux o gerenciador
   da distro). O instalador "nativo" do Claude Code não traz o Node junto.
2. **Pasta dos transcripts**: normalmente `~/.claude/projects` (ou `$CLAUDE_CONFIG_DIR/projects`). O script descobre sozinho.

## Rodar

```bash
node <pasta-desta-skill>/scripts/build-card.js
```

`<pasta-desta-skill>` é a pasta onde está este `SKILL.md` (normalmente `~/.claude/skills/claude-usage-card`); use o caminho
absoluto, entre aspas se tiver espaços.

- Saída padrão: `~/claude-usage-card/card.html` e `dados/dias.json` (o histórico). `--out <pasta>` muda o lugar.
- `--projects-dir <pasta>` aponta os transcripts; `--open` abre o cartão no navegador; `--help` lista tudo.
- Primeira vez: lê todo o histórico. Depois relê só os **últimos 3 dias** e mantém os anteriores de `dados/dias.json`
  (o Claude Code apaga transcripts antigos, então esse arquivo é o arquivo morto da pessoa — sugira backup). `--full` relê tudo.

## Conferir antes de entregar

Leia o resumo que o script imprime e verifique a linha **`HTML: OK`** (ele compila e executa a página num navegador
simulado). Se aparecer `PROBLEMA`, não entregue: rode de novo com `--full` e, se persistir, avise a pessoa.

## O que explicar à pessoa

- **Dois estilos** (botão "Estilo" no topo): **Claude**, discreto, cinza e azul, parecido com o painel original; e
  **Nosso**, com contorno e as cores Rave. Há também modo claro/escuro. A escolha fica salva no navegador.
- **Visão Geral:** oito quadros e o mapa de calor das últimas 26 semanas (domingo a sábado; quanto mais forte o quadrado,
  mais tokens naquele dia; passe o mouse para ver o dia). **Modelos:** quanto de cada modelo foi usado, com entrada e saída.
  **Todos / 30d / 7d** filtram os quadros e as sequências (o mapa de calor mostra sempre as últimas semanas).
- **Estimativas, não cópia do painel original** — diga isso com clareza:
  - *Tokens* = entrada + saída de cada linha do transcript (sem cache; uma resposta aparece em várias linhas e todas
    contam). É a mesma "Contagem Claude Code" da skill `claude-usage-dashboard`.
  - *Mensagens* = linhas de mensagem do usuário e do assistente (sem repetir o mesmo uuid). *Sessões* = conversas distintas.
  - *Livros* são só uma brincadeira: ≈ 1,33 token por palavra.
- **Só este computador e só o Claude Code:** claude.ai, apps e outros computadores não aparecem.
- Nenhuma mensagem é lida para fora: o arquivo gerado não contém texto de conversas, só números e nomes de modelos.

## Crédito e licença

A skill é de Otávio Pelego, licença MIT (arquivo `LICENSE`). O rodapé do cartão traz uma linha de crédito; mantenha-a ao
entregar ou compartilhar a página. O link do site fica em `SITE_AUTOR`, no topo de `scripts/build-card.js`.

## Se algo der errado

- *"Não encontrei a pasta de transcripts"*: use `--projects-dir` com o caminho certo.
- *"Não achei nenhum uso"*: a pessoa ainda não usou o Claude Code nesse computador (ou os transcripts foram apagados).
- Cartão vazio ou números estranhos: rode com `--full` uma vez.
