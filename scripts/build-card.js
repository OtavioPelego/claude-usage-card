#!/usr/bin/env node
// Monta (ou atualiza) o cartão de consumo do Claude Code: sessões, mensagens, tokens, dias ativos, sequências, horário de
// pico, modelo favorito, mapa de calor e uma comparação com livros — no estilo do painel que o próprio Claude Code mostrava.
//
// Lê os transcripts locais (~/.claude/projects/**/*.jsonl), guarda o histórico em <saída>/dados/dias.json e gera
// <saída>/card.html com os dados embutidos (abre direto no navegador, sem servidor e sem internet). Nada é enviado para
// fora do computador; os transcripts são só lidos.
//
// Uso:
//   node build-card.js                        -> gera/atualiza em ~/claude-usage-card
//   node build-card.js --out <pasta>          -> outra pasta de saída
//   node build-card.js --projects-dir <pasta> -> outra pasta de transcripts (padrão: $CLAUDE_CONFIG_DIR/projects ou ~/.claude/projects)
//   node build-card.js --full                 -> relê todo o histórico (o padrão relê só os últimos 3 dias, se já existir histórico)
//   node build-card.js --open                 -> abre o cartão no navegador padrão quando terminar
const fs = require('fs');
const path = require('path');
const os = require('os');
const { lerTranscripts, mesclar, diaLocal, pad } = require('./lib/leitor.js');

const args = process.argv.slice(2);
const opt = nome => { const i = args.indexOf(nome); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null; };
if (args.includes('--help') || args.includes('-h')) {
  const ajuda = [];
  for (const l of fs.readFileSync(__filename, 'utf8').split('\n').slice(1)) { if (!l.startsWith('//')) break; ajuda.push(l.replace(/^\/\/ ?/, '')); }
  console.log(ajuda.join('\n'));
  process.exit(0);
}
const saida = path.resolve(opt('--out') || path.join(os.homedir(), 'claude-usage-card'));
const configDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const raizTranscripts = path.resolve(opt('--projects-dir') || path.join(configDir, 'projects'));
const diasJson = path.join(saida, 'dados', 'dias.json');
const htmlPath = path.join(saida, 'card.html');
const modeloPath = path.join(__dirname, '..', 'assets', 'card.template.html');
// Crédito no rodapé (licença MIT: manter o aviso de autoria). Preencha SITE_AUTOR para o nome virar link; vazio = só texto.
const SITE_AUTOR = 'https://otaviopelego.pages.dev';
const CREDITO = 'Gerado com a skill <code>claude-usage-card</code> · Otávio Pelego' +
  (SITE_AUTOR ? ' (<a href="' + SITE_AUTOR + '" target="_blank" rel="noopener">Site do Otávio Corrêa</a>)' : ' (Site do Otávio Corrêa)');
const hoje = diaLocal(new Date());

let antigos = [];
try { antigos = JSON.parse(fs.readFileSync(diasJson, 'utf8')); if (!Array.isArray(antigos)) antigos = []; } catch (e) { antigos = []; }

// Sem --full e com histórico gravado: relê só os últimos 3 dias (os anteriores já estão gravados e não mudam).
let desde = '0000-00-00';
if (!args.includes('--full') && antigos.length) {
  const ult = new Date(antigos[antigos.length - 1].d + 'T00:00:00');
  ult.setDate(ult.getDate() - 3);
  desde = diaLocal(ult);
}

if (!fs.existsSync(raizTranscripts)) {
  console.error(`\n  Não encontrei a pasta de transcripts do Claude Code: ${raizTranscripts}\n` +
    '  Ela existe depois que você usa o Claude Code neste computador. Se ela fica em outro lugar,\n' +
    '  use --projects-dir <pasta> (ou defina CLAUDE_CONFIG_DIR).\n');
  process.exit(2);
}

(async () => {
  const { lista, nArq, nLidos } = await lerTranscripts({ raiz: raizTranscripts, desde });
  const dias = mesclar(antigos, lista);
  if (!dias.length) {
    console.error('\n  Não achei nenhum uso do Claude Code nos transcripts.\n  Use o Claude Code um pouco e rode de novo.\n');
    process.exit(3);
  }
  fs.mkdirSync(path.dirname(diasJson), { recursive: true });
  fs.writeFileSync(diasJson, JSON.stringify(dias));

  const modelo = fs.readFileSync(modeloPath, 'utf8');
  for (const marca of ['{{DADOS}}', '{{CREDITO}}']) if (!modelo.includes(marca)) { console.error(`  O modelo do cartão não tem o ponto de inserção ${marca}.`); process.exit(4); }
  const gerado = (() => { const a = new Date(); return `${diaLocal(a)} ${pad(a.getHours())}:${pad(a.getMinutes())}`; })();
  const dados = 'window.CARD = ' + JSON.stringify({ gerado, hoje, dias }) + ';';
  // split/join em vez de replace: o texto dos dados poderia conter "$&" e outros padrões especiais do replace
  fs.writeFileSync(htmlPath, modelo.split('{{CREDITO}}').join(CREDITO).split('{{DADOS}}').join(dados));

  // ---------- confere o HTML gerado (sem precisar de navegador) ----------
  let htmlOk = true, htmlMsg = '';
  try {
    const vm = require('vm');
    const html = fs.readFileSync(htmlPath, 'utf8');
    const blocos = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).filter(s => s.trim());
    blocos.forEach((codigo, i) => new vm.Script(codigo, { filename: `card.html <script #${i + 1}>` }));
    if (/<script[^>]*\bsrc=/.test(html)) throw new Error('sobrou um <script src> que depende de arquivo externo');
    // Teste de fumaça: executa a página num "navegador" simulado. Só ReferenceError/SyntaxError valem como defeito.
    const simulado = () => {
      const p = new Proxy(function () {}, {
        get: (t, k) => k === Symbol.toPrimitive ? () => '' : k === Symbol.iterator ? function* () {} : k === 'length' ? 0 : k === 'then' ? undefined : p,
        set: () => true, apply: () => p, construct: () => p
      });
      return p;
    };
    const ctx = { console: { log() {}, warn() {}, error() {} }, localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
      matchMedia: () => simulado(), requestAnimationFrame: () => 0, setTimeout: () => 0, clearTimeout() {}, addEventListener() {},
      getComputedStyle: () => simulado(), innerWidth: 1280, innerHeight: 800, navigator: {}, location: {},
      document: new Proxy(simulado(), { get: (t, k) => k === 'querySelectorAll' ? () => [simulado()] : t[k] }),
      Event: function () {}, Node: function () {}, Element: function () {}, HTMLElement: function () {}, CSS: {} };
    ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx;
    vm.createContext(ctx);
    let fumaca = 'a página executou até o fim';
    try { blocos.forEach((codigo, i) => vm.runInContext(codigo, ctx, { filename: `card.html <script #${i + 1}>`, timeout: 8000 })); }
    catch (e) {
      if (e && (e.name === 'ReferenceError' || e.name === 'SyntaxError')) throw new Error(`a página quebra ao carregar (${e.name}: ${e.message}) — ela abriria em branco`);
      fumaca = `executou até onde o navegador simulado permitiu (${e && e.name})`;
    }
    htmlMsg = `${blocos.length} bloco(s) de script compilam · teste de carregamento: ${fumaca} · dados embutidos, sem arquivos externos`;
  } catch (e) { htmlOk = false; htmlMsg = e.message; }

  // ---------- resumo ----------
  const fmtT = n => n >= 1e6 ? (n / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' M' : Math.round(n / 1e3).toLocaleString('pt-BR') + ' k';
  const totalP = dias.reduce((a, r) => a + r.p, 0), totalM = dias.reduce((a, r) => a + r.m, 0);
  const sess = new Set(); dias.forEach(r => r.s.forEach(x => sess.add(x)));
  console.log(`\n  Transcripts: ${nArq} arquivo(s) em ${raizTranscripts}`);
  console.log(`  Leitura: ${nLidos} arquivo(s) nesta rodada, ${desde === '0000-00-00' ? 'histórico completo' : 'só desde ' + desde + ' (os anteriores vêm de dados/dias.json)'}`);
  console.log(`  Dias no histórico: ${dias.length}  (${dias[0].d} a ${dias[dias.length - 1].d})`);
  console.log(`  Sessões: ${sess.size} · mensagens: ${totalM.toLocaleString('pt-BR')} · tokens (entrada + saída por linha, ESTIMATIVA): ${fmtT(totalP)}`);
  console.log(`\n  HTML: ${htmlOk ? 'OK — ' : 'PROBLEMA — '}${htmlMsg}`);
  console.log(`  Histórico: ${diasJson}\n  Cartão:    ${htmlPath}\n`);

  if (args.includes('--open') && htmlOk) {
    const { spawn } = require('child_process');
    const [cmd, cargs] = process.platform === 'win32' ? ['cmd', ['/c', 'start', '""', htmlPath]]
      : process.platform === 'darwin' ? ['open', [htmlPath]] : ['xdg-open', [htmlPath]];
    try { spawn(cmd, cargs, { detached: true, stdio: 'ignore' }).on('error', () => console.log('  (não consegui abrir sozinho — abra o arquivo acima com dois cliques)')).unref(); } catch (e) { /* segue sem abrir */ }
  }
  if (!htmlOk) process.exit(5);
})().catch(e => { console.error('\n  Erro inesperado: ' + (e && e.stack || e) + '\n'); process.exit(1); });
