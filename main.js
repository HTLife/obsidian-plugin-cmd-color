const { Plugin } = require('obsidian');
const { ViewPlugin, Decoration } = require('@codemirror/view');
const { RangeSetBuilder } = require('@codemirror/state');

const LANGS = ['cmd', 'command'];
// One token = a run of whitespace, OR a word that keeps quoted parts together
// (so  --name="hello world"  stays a single argument).
const TOKEN_RE = /\s+|(?:"(?:[^"\\]|\\.)*"?|'[^']*'?|[^\s"'])+/g;
const N_COLORS = 8;

// Split one line into colored pieces. `state.idx` is the argument position,
// carried across lines that end with a backslash.
function tokenizeLine(line, state) {
  const out = [];
  if (line.trim().startsWith('#')) {
    out.push({ from: 0, to: line.length, cls: 'rc-comment' });
    state.idx = 0;
    return out;
  }
  for (const m of line.matchAll(TOKEN_RE)) {
    const tok = m[0];
    const from = m.index, to = from + tok.length;
    if (/^\s+$/.test(tok)) { out.push({ from, to, cls: null }); continue; }
    if (tok === '\\') { out.push({ from, to, cls: 'rc-cont' }); continue; }
    const cls = ['rc', `rc-${state.idx % N_COLORS}`];
    if (state.idx === 0) cls.push('rc-cmd');
    if (tok.startsWith('-')) cls.push('rc-flag');
    out.push({ from, to, cls: cls.join(' ') });
    state.idx++;
  }
  if (!line.trimEnd().endsWith('\\')) state.idx = 0;
  return out;
}

// ---- Reading view / Live Preview (cursor outside block) ----
function render(source, el) {
  const pre = el.createEl('pre', { cls: 'rainbow-cmd' });
  const code = pre.createEl('code');
  const state = { idx: 0 };
  for (const line of source.split('\n')) {
    for (const p of tokenizeLine(line, state)) {
      const text = line.slice(p.from, p.to);
      if (p.cls) code.createSpan({ cls: p.cls, text });
      else code.appendText(text);
    }
    code.appendText('\n');
  }
  const btn = pre.createEl('button', { cls: 'rc-copy', text: 'Copy' });
  btn.onclick = () => navigator.clipboard.writeText(source);
}

// ---- Editor (Source mode / Live Preview with cursor inside block) ----
const OPEN_RE = /^\s*(`{3,}|~{3,})\s*([^\s`]*)/;

function buildDecorations(view) {
  const builder = new RangeSetBuilder();
  const doc = view.state.doc;
  let fence = null;          // { ch, len, ours } while inside a fenced block
  let state = { idx: 0 };
  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    const m = OPEN_RE.exec(line.text);
    if (!fence) {
      if (m) {
        fence = { ch: m[1][0], len: m[1].length, ours: LANGS.includes(m[2].toLowerCase()) };
        state = { idx: 0 };
      }
      continue;
    }
    if (m && m[1][0] === fence.ch && m[1].length >= fence.len && line.text.trim() === m[1]) {
      fence = null;          // closing fence
      continue;
    }
    if (!fence.ours) continue;
    for (const p of tokenizeLine(line.text, state)) {
      if (p.cls) builder.add(line.from + p.from, line.from + p.to, Decoration.mark({ class: p.cls }));
    }
  }
  return builder.finish();
}

const rainbowEditor = ViewPlugin.fromClass(class {
  constructor(view) { this.decorations = buildDecorations(view); }
  update(u) { if (u.docChanged) this.decorations = buildDecorations(u.view); }
}, { decorations: v => v.decorations });

module.exports = class CmdColor extends Plugin {
  onload() {
    for (const lang of LANGS) this.registerMarkdownCodeBlockProcessor(lang, render);
    this.registerEditorExtension(rainbowEditor);
  }
};
