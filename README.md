# claude-usage-card

**EN** — A [Claude Code](https://claude.com/claude-code) skill that builds a small, **local and private HTML card of your own
usage**, in the spirit of the usage panel Claude Code itself used to show: sessions, messages, total tokens, active days,
current and longest streak, peak hour, favorite model, a heatmap of the last weeks, a per-model tab, All / 30d / 7d filters
and a playful comparison with books. It reads the transcripts Claude Code already keeps on your machine; nothing is
uploaded anywhere.

**PT** — Uma skill do Claude Code que monta um **cartão HTML pequeno, local e privado do seu próprio uso**, no espírito do
painel que o próprio Claude Code mostrava: sessões, mensagens, total de tokens, dias ativos, sequência atual e maior,
horário de pico, modelo favorito, mapa de calor das últimas semanas, aba por modelo, filtros Todos/30d/7d e uma comparação
divertida com livros. Lê os transcripts que o Claude Code já guarda no seu computador; nada é enviado para fora.

> Need the detailed view (goals, projections, insights, full calendar, several computers)? See the sibling skill
> **[claude-usage-dashboard](https://github.com/OtavioPelego/claude-usage-dashboard)**. /
> Quer o detalhado (metas, projeções, insights, calendário completo, vários computadores)? Veja a skill irmã
> **claude-usage-dashboard**.

The UI is in **Brazilian Portuguese** for now (the skill can translate it on request). / A interface está em português do Brasil.

## Install / Instalar

```bash
git clone https://github.com/OtavioPelego/claude-usage-card.git ~/.claude/skills/claude-usage-card
```

On Windows (PowerShell): `git clone https://github.com/OtavioPelego/claude-usage-card.git $HOME\.claude\skills\claude-usage-card`.

## Use / Usar

Open Claude Code and ask, for example: *"mostra meu painel de uso do Claude Code"* or *"show my Claude Code usage card"*.
Claude checks that Node.js is installed, runs the script and gives you `~/claude-usage-card/card.html` — double-click it.
Or run it yourself (Node.js 14+):

```bash
node scripts/build-card.js                     # -> ~/claude-usage-card/
node scripts/build-card.js --out ./meu-cartao  # another folder
node scripts/build-card.js --full              # re-read the whole history
node scripts/build-card.js --open              # open it in your browser when done
```

## Two styles / Dois estilos

A button at the top switches the card style (and light/dark): **Claude** — quiet, grey and blue, close to the original panel;
**Rave** — outlined, with the Rave colors (lime, purple and blue). Your choice is saved in the browser. / Um botão no topo alterna o estilo
(e o modo claro/escuro); a escolha fica salva no navegador.

## Honest limits / Limites

- These numbers are **estimates, not a copy of Claude's own panel** (which does not publish its method). *Tokens* = input +
  output of every transcript line (no cache; a response appears in several lines and all count). *Messages* = user and
  assistant message lines (same uuid not repeated). *Sessions* = distinct conversations. Books: ≈ 1.33 tokens per word.
- Each run sees **the Claude Code of the computer it runs on**. claude.ai, the apps and other computers are not included.
- Claude Code **deletes old transcripts** after a while, so history starts from what still existed the first time you ran it.
  `dados/dias.json` keeps the days already recorded (back it up).
- The card needs **Node.js** to be generated (the generated page needs nothing).
- Tested on Windows; macOS/Linux should work (only Node's standard library is used).

## Privacy / Privacidade

The script only reads usage numbers, timestamps, session ids and model names from the transcripts, and the generated page
makes no network requests. The card contains **no conversation text and no project names**.

## Author and license / Autor e licença

Made by **Otávio Pelego** — *Site do Otávio Corrêa*: <https://otaviopelego.pages.dev> · GitHub:
[@OtavioPelego](https://github.com/OtavioPelego). Released under the **MIT License** ([`LICENSE`](LICENSE)): use, change and
share freely, just keep the copyright notice. The generated card carries a small credit line in its footer — please leave it
when you share the page. / Licença **MIT**: use, altere e compartilhe à vontade, só mantenha o aviso de autoria; o cartão
gerado traz um crédito discreto no rodapé — deixe-o ao compartilhar a página.

## Layout

```
claude-usage-card/
├── LICENSE                       # MIT
├── SKILL.md                      # instructions Claude follows
├── scripts/build-card.js         # reads transcripts, keeps the history, writes card.html
├── scripts/lib/leitor.js         # transcript reader (sessions, messages, tokens by model / hour)
└── assets/card.template.html     # the card (single file, no dependencies)
```
