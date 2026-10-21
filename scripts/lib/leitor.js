'use strict';
// Leitura dos transcripts do Claude Code para o cartão de consumo. Só LÊ os arquivos.
// Devolve, por dia: sessões, mensagens, tokens (entrada + saída, contados POR LINHA do transcript), tokens por modelo
// (entrada e saída) e tokens por hora do dia.
//
// Definições (estimativas — o Claude Code não publica a conta exata do painel dele):
//   tokens    = entrada + saída de cada linha do transcript que traz "usage" (uma resposta aparece em várias linhas e todas
//               contam; sem cache) — a mesma "Contagem Claude Code" da skill claude-usage-dashboard.
//   mensagens = linhas de mensagem do usuário ou do assistente (type = user | assistant), sem repetir o mesmo uuid
//               (conversas retomadas copiam linhas antigas para o arquivo novo).
//   sessões   = sessionId distintos que aparecem no dia.
const fs = require('fs');
const path = require('path');

const pad = n => String(n).padStart(2, '0');
const diaLocal = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function* jsonls(dir) {
  let entradas = [];
  try { entradas = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
  for (const e of entradas) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* jsonls(p);
    else if (e.name.endsWith('.jsonl')) yield p;
  }
}

// Lê o arquivo em pedaços e separa as linhas SÓ por "\n". Não use readline: ele também quebra em U+2028/U+2029, que podem
// aparecer dentro de um texto do transcript e partiriam uma linha de JSON em duas (a linha inteira seria perdida).
async function* linhasDe(arq) {
  let resto = '';
  for await (const pedaco of fs.createReadStream(arq, { encoding: 'utf8' })) {
    const partes = (resto + pedaco).split('\n');
    resto = partes.pop();
    for (const l of partes) yield l;
  }
  if (resto) yield resto;
}

const TIPO_MSG = /"type"\s*:\s*"(?:user|assistant)"/;

// desde: 'AAAA-MM-DD' (só relê arquivos mexidos desde então e só conta dias a partir dele); '0000-00-00' = tudo
async function lerTranscripts({ raiz, desde = '0000-00-00' }) {
  const desdeMs = desde === '0000-00-00' ? 0 : new Date(desde + 'T00:00:00').getTime();
  const dias = {};
  const vistos = new Set();
  let nArq = 0, nLidos = 0;

  for (const arq of jsonls(raiz)) {
    nArq++;
    try { if (fs.statSync(arq).mtimeMs < desdeMs) continue; } catch (e) { continue; }
    try {
      for await (const linha of linhasDe(arq)) {
        if (!TIPO_MSG.test(linha)) continue;
        let r;
        try { r = JSON.parse(linha); } catch (e) { continue; }
        if ((r.type !== 'user' && r.type !== 'assistant') || !r.timestamp) continue;
        const dt = new Date(r.timestamp);
        if (isNaN(dt)) continue;
        const dia = diaLocal(dt);
        if (dia < desde) continue;
        const d = dias[dia] || (dias[dia] = { sessoes: new Set(), mensagens: 0, entrada: 0, saida: 0, modelos: {}, horas: {} });

        if (r.sessionId) d.sessoes.add(String(r.sessionId).slice(0, 12));
        if (!r.uuid || !vistos.has(r.uuid)) { if (r.uuid) vistos.add(r.uuid); d.mensagens++; }

        const u = r.message && r.message.usage;
        if (u) {
          const e = u.input_tokens || 0, o = u.output_tokens || 0;
          d.entrada += e; d.saida += o;
          const modelo = r.message.model || '?';
          if (modelo !== '<synthetic>') {
            const m = d.modelos[modelo] || (d.modelos[modelo] = [0, 0]);
            m[0] += e; m[1] += o;
          }
          const h = pad(dt.getHours());
          d.horas[h] = (d.horas[h] || 0) + e + o;
        }
      }
      nLidos++;
    } catch (e) { console.warn(`  (pulei ${path.basename(arq)}: ${e.message})`); }
  }

  // formato gravado: um objeto simples por dia (sem Set), pronto para JSON
  const lista = Object.keys(dias).sort().map(dia => {
    const d = dias[dia];
    return { d: dia, s: [...d.sessoes], m: d.mensagens, p: d.entrada + d.saida, e: d.entrada, o: d.saida, mod: d.modelos, h: d.horas };
  });
  return { lista, nArq, nLidos };
}

// substitui só os dias que foram relidos; o resto (dias que sumiram dos transcripts) fica como estava
function mesclar(antigos, novos) {
  const dias = new Set(novos.map(r => r.d));
  return antigos.filter(r => !dias.has(r.d)).concat(novos).sort((a, b) => a.d.localeCompare(b.d));
}

module.exports = { lerTranscripts, mesclar, diaLocal, pad };
