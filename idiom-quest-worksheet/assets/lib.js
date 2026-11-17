/* ===== 成語動畫：繪圖工具庫（idiom-animation） =====
   座標系：1280×720。所有繪圖函式回傳 SVG 字串，以 (x,y) 為腳底中心。
   T＝整體時間（秒），A＝某事件發生後經過的秒數（<0 表示還沒發生）。 */
const W = 1280, H = 720;
const OL = '#2b2233';
const FONTF = `'Noto Sans TC','Iansui','Microsoft JhengHei','PingFang TC',sans-serif`;
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = v => { v = cl(v); return v * v * (3 - 2 * v); };
const lerp = (a, b, u) => a + (b - a) * u;
const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
function mix(c1, c2, u) { const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)); const A = p(c1), B = p(c2); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * u).toString(16).padStart(2, '0')).join(''); }
const f1 = v => (typeof v === 'number' ? +v.toFixed(2) : v);
/* 關鍵影格：kf(A,[[0,值],[1,值],...]) */
function kf(t, k) {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) { const u = ease((t - k[i - 1][0]) / (k[i][0] - k[i - 1][0])); return lerp(k[i - 1][1], k[i][1], u); }
  return k[k.length - 1][1];
}
/* 彈出縮放（帶一點回彈） */
function popS(a, d = .38) { if (a <= 0) return 0; if (a >= d) return 1; const x = a / d - 1, c = 2.2; return 1 + (c + 1) * x * x * x + c * x * x; }
const g = (tf, inner, extra = '') => `<g transform="${tf}" ${extra}>${inner}</g>`;
const tr = (x, y, s = 1, r = 0) => `translate(${f1(x)} ${f1(y)}) rotate(${f1(+r)}) scale(${f1(+s)})`;
const op = (o, inner) => o <= 0 ? '' : (o >= 1 ? inner : `<g opacity="${o.toFixed(3)}">${inner}</g>`);
const fadeIn = (A, d = .4) => cl(A / d);
const showAt = (A, inner, d = .35) => A < 0 ? '' : op(fadeIn(A, d), inner);

/* ===== 文字 ===== */
function txt(x, y, s, size, fill = '#fff', stroke = OL, sw = null, anchor = 'middle', weight = 900) {
  sw = sw == null ? size * .2 : sw;
  return `<text x="${f1(x)}" y="${f1(y)}" font-size="${size}" font-family="${FONTF}" font-weight="${weight}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" paint-order="stroke" text-anchor="${anchor}" dominant-baseline="central">${s}</text>`;
}
function pop(x, y, s, A, size = 48, fill = '#fff', stroke = OL, rot = 0) {
  if (A < 0) return ''; const k = popS(A); return g(tr(x, y, k, rot + (1 - k) * -20), txt(0, 0, s, size, fill, stroke));
}
/* 狀聲詞：逐字彈跳 */
function sfx(x, y, s, A, size = 60, fill = '#FFE14D', rot = -8, life = 99) {
  if (A < 0 || A > life) return ''; const n = [...s]; let o = '';
  const fade = A > life - .3 ? cl((life - A) / .3) : 1;
  n.forEach((ch, i) => {
    const a = A - i * .08; if (a < 0) return; const k = popS(a, .3);
    o += g(tr(x + (i - (n.length - 1) / 2) * size * 1.02, y + Math.sin(A * 9 + i * 1.7) * 5, k, rot + Math.sin(A * 6 + i) * 6), txt(0, 0, ch, size, fill, OL, size * .24));
  });
  return op(fade, o);
}
/* 對話框／想法泡泡（inner 以框中心為原點） */
function bubble(x, y, w, h, inner, A, tx = 0, ty = null, fill = '#fff') {
  if (A < 0) return ''; const k = popS(A); ty = ty == null ? h / 2 + 40 : ty;
  const r = 26, L = -w / 2, R = w / 2, Tp = -h / 2, B = h / 2;
  return g(tr(x, y, k), `<path d="M${L + r} ${Tp} H${R - r} Q${R} ${Tp} ${R} ${Tp + r} V${B - r} Q${R} ${B} ${R - r} ${B} H${tx + 18} L${tx} ${ty} L${tx - 14} ${B} H${L + r} Q${L} ${B} ${L} ${B - r} V${Tp + r} Q${L} ${Tp} ${L + r} ${Tp} Z" fill="${fill}" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/>${inner}`);
}
function thought(x, y, w, h, inner, A, tx = -60, ty = null, fill = '#fff') {
  if (A < 0) return ''; const k = popS(A); ty = ty == null ? h / 2 + 70 : ty;
  let o = `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${Math.min(w, h) / 2.2}" fill="${fill}" stroke="${OL}" stroke-width="5"/>`;
  o += `<circle cx="${tx * .55}" cy="${h / 2 + 22}" r="14" fill="${fill}" stroke="${OL}" stroke-width="4"/><circle cx="${tx}" cy="${ty - 8}" r="8" fill="${fill}" stroke="${OL}" stroke-width="3.5"/>`;
  return g(tr(x, y, k), o + inner);
}

/* ===== 背景與自然物 ===== */
let _gid = 0;
function bg(c1, c2) { const id = 'bg' + (c1 + c2).replace(/[^0-9a-z]/gi, ''); return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="1280" height="720" fill="url(#${id})"/>`; }
function rays(cx, cy, T, c1, c2, n = 18, sp = 8) {
  let o = `<rect width="1280" height="720" fill="${c1}"/>`;
  for (let i = 0; i < n; i++) { const a0 = (i / n) * Math.PI * 2 + T * sp / 100, a1 = a0 + Math.PI / n; if (i % 2) continue;
    o += `<path d="M${cx} ${cy} L${cx + Math.cos(a0) * 1600} ${cy + Math.sin(a0) * 1600} L${cx + Math.cos(a1) * 1600} ${cy + Math.sin(a1) * 1600}Z" fill="${c2}"/>`; }
  return o;
}
function dots(T, col = '#fff', o = .25, gap = 90, r = 7) {
  let s = ''; for (let y = 0; y < 760; y += gap) for (let x = (y / gap % 2) * gap / 2; x < 1320; x += gap) s += `<circle cx="${x}" cy="${(y + T * 12) % 760}" r="${r}"/>`;
  return `<g fill="${col}" opacity="${o}">${s}</g>`;
}
function star(x, y, r, col = '#FFE14D', rot = 0, sw = 4) {
  let p = ''; for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * .48 : r; p += `${f1(Math.cos(a) * rr)},${f1(Math.sin(a) * rr)} `; }
  return g(tr(x, y, 1, rot), `<polygon points="${p}" fill="${col}" stroke="${OL}" stroke-width="${sw}" stroke-linejoin="round"/>`);
}
function sparkles(cx, cy, R, T, n = 8, col = '#fff') {
  let o = ''; for (let i = 0; i < n; i++) { const a = i / n * 6.283 + T * .4, k = .5 + .5 * Math.sin(T * 5 + i * 2);
    o += g(tr(cx + Math.cos(a) * R, cy + Math.sin(a) * R * .6, k, T * 60), `<path d="M0 -16 L4 -4 L16 0 L4 4 L0 16 L-4 4 L-16 0 L-4 -4Z" fill="${col}"/>`); }
  return o;
}
function heart(x, y, s, col = '#ff5a7a') { return g(tr(x, y, s), `<path d="M0 18 C-30 -4 -26 -30 -8 -30 C0 -30 0 -22 0 -18 C0 -22 0 -30 8 -30 C26 -30 30 -4 0 18Z" fill="${col}" stroke="${OL}" stroke-width="4" stroke-linejoin="round"/>`); }
function cloud(x, y, s = 1, col = '#fff') { return g(tr(x, y, s), `<path d="M-90 20 Q-110 -20 -60 -26 Q-50 -66 0 -58 Q40 -80 66 -36 Q112 -36 100 10 Q100 30 70 30 H-70 Q-96 30 -90 20Z" fill="${col}" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/>`); }
function sun(x, y, s, T) {
  let r = ''; for (let i = 0; i < 12; i++) { const a = i * 30 + T * 20; r += g(`rotate(${a})`, `<rect x="-6" y="-92" width="12" height="26" rx="6" fill="#ffb703" stroke="${OL}" stroke-width="3"/>`); }
  return g(tr(x, y, s), r + `<circle r="58" fill="#FFE14D" stroke="${OL}" stroke-width="6"/><circle cx="-20" cy="-6" r="6" fill="${OL}"/><circle cx="20" cy="-6" r="6" fill="${OL}"/><path d="M-18 14 Q0 30 18 14" stroke="${OL}" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="-34" cy="12" r="8" fill="#ff9aa8" opacity=".7"/><circle cx="34" cy="12" r="8" fill="#ff9aa8" opacity=".7"/>`);
}
function moon(x, y, s) { return g(tr(x, y, s), `<path d="M10 -60 A60 60 0 1 0 50 40 A48 48 0 1 1 10 -60Z" fill="#fff2a8" stroke="${OL}" stroke-width="5"/>`); }
function ground(y, c1 = '#8fd16a', c2 = '#6fb84c') { return `<rect x="0" y="${y}" width="1280" height="${720 - y}" fill="${c1}"/><rect x="0" y="${y}" width="1280" height="14" fill="${c2}"/><line x1="0" y1="${y}" x2="1280" y2="${y}" stroke="${OL}" stroke-width="5"/>`; }
function floor(y, c = '#e9c48f', line = '#c99a5c') {
  let s = `<rect x="0" y="${y}" width="1280" height="${720 - y}" fill="${c}"/><line x1="0" y1="${y}" x2="1280" y2="${y}" stroke="${OL}" stroke-width="5"/>`;
  for (let x = 0; x < 1280; x += 160) s += `<line x1="${x}" y1="${y}" x2="${x - 60}" y2="720" stroke="${line}" stroke-width="3"/>`; return s;
}
function windowBox(x, y, w = 200, h = 160, sky = '#9fd8ff', T = 0, rain = 0) {
  let o = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${sky}" stroke="${OL}" stroke-width="7" rx="8"/>`;
  if (rain) for (let i = 0; i < 14; i++) { const rx = x + 10 + rnd(i) * (w - 20), ry = y + ((rnd(i + 9) * h + T * 260) % h); o += `<line x1="${rx}" y1="${ry}" x2="${rx - 5}" y2="${Math.min(y + h - 4, ry + 16)}" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`; }
  o += `<line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h}" stroke="${OL}" stroke-width="6"/><line x1="${x}" y1="${y + h / 2}" x2="${x + w}" y2="${y + h / 2}" stroke="${OL}" stroke-width="6"/>`;
  return o;
}
function flower(x, y, s = 1, col = '#ff6b9a', grow = 1, T = 0, i = 0) {
  if (grow <= 0) return ''; const sw = Math.sin(T * 2 + i) * 4;
  let pet = ''; for (let k = 0; k < 6; k++) pet += g(`rotate(${k * 60})`, `<ellipse cx="0" cy="-20" rx="12" ry="18" fill="${col}" stroke="${OL}" stroke-width="3.5"/>`);
  return g(tr(x, y, s * grow, sw), `<path d="M0 0 V-80" stroke="#3f9a3a" stroke-width="7"/><path d="M0 -36 Q22 -50 30 -34 Q14 -26 0 -36Z" fill="#59b54a" stroke="${OL}" stroke-width="3"/><path d="M0 -50 Q-22 -64 -30 -48 Q-14 -40 0 -50Z" fill="#59b54a" stroke="${OL}" stroke-width="3"/>` + g('translate(0 -92)', pet + `<circle r="11" fill="#FFE14D" stroke="${OL}" stroke-width="3.5"/>`));
}
function tree(x, y, s = 1, col = '#5cc05a') { return g(tr(x, y, s), `<rect x="-16" y="-110" width="32" height="110" fill="#a8693c" stroke="${OL}" stroke-width="5"/><circle cx="0" cy="-160" r="70" fill="${col}" stroke="${OL}" stroke-width="6"/><circle cx="-50" cy="-120" r="44" fill="${col}" stroke="${OL}" stroke-width="6"/><circle cx="50" cy="-120" r="44" fill="${col}" stroke="${OL}" stroke-width="6"/><path d="M-48 -122 a44 44 0 0 1 96 0" fill="${col}"/>`); }
function bulb(x, y, s, A) { // 想通了的燈泡
  if (A < 0) return ''; const k = popS(A), glow = .5 + .5 * Math.sin(A * 10);
  let r = ''; for (let i = 0; i < 8; i++) r += g(`rotate(${i * 45})`, `<rect x="-4" y="-${86 + glow * 8}" width="8" height="22" rx="4" fill="#FFE14D" stroke="${OL}" stroke-width="2.5"/>`);
  return g(tr(x, y, s * k), r + `<circle r="44" fill="#FFF27a" stroke="${OL}" stroke-width="5"/><rect x="-20" y="38" width="40" height="26" rx="6" fill="#bbb" stroke="${OL}" stroke-width="5"/><path d="M-12 10 Q0 -14 12 10" stroke="#ffb703" stroke-width="5" fill="none"/>`);
}
function shadow(x, y, w) { return `<ellipse cx="${x}" cy="${y + 4}" rx="${w}" ry="${w * .14}" fill="#000" opacity=".15"/>`; }

/* ===== 人物（Q 版小孩） =====
   kid(x,y,s,T,{hair:'boy'|'girl'|'bun', skin, shirt, pants, face:'smile'|'happy'|'wow'|'think'|'sad'|'angry'|'proud'|'scared',
                L, R（手臂角度：0 下垂、90 水平、170 舉高；左右各自）, wave, flip, bob, blink, look:[dx,dy], hat, prop}) */
function arm(sx, sy, ang, col, skin, side) {
  const a = (ang * side) * Math.PI / 180, L = 72;
  const ex = sx + Math.sin(a) * L, ey = sy + Math.cos(a) * L;
  return `<line x1="${sx}" y1="${sy}" x2="${f1(ex)}" y2="${f1(ey)}" stroke="${OL}" stroke-width="30" stroke-linecap="round"/><line x1="${sx}" y1="${sy}" x2="${f1(ex)}" y2="${f1(ey)}" stroke="${col}" stroke-width="20" stroke-linecap="round"/><circle cx="${f1(ex)}" cy="${f1(ey)}" r="14" fill="${skin}" stroke="${OL}" stroke-width="5"/>`;
}
function face(o, T) {
  const f = o.face || 'smile', [lx, ly] = o.look || [0, 0];
  const bl = o.blink === false ? 1 : ((T * 1.0 + (o.seed || 0)) % 3.2 < .12 ? .1 : 1);
  let e = '', m = '', br = '';
  const ex = 26, ey = -8;
  if (f === 'happy' || f === 'proud') { e = `<path d="M${-ex - 12} ${ey + 4} Q${-ex} ${ey - 12} ${-ex + 12} ${ey + 4}" stroke="${OL}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M${ex - 12} ${ey + 4} Q${ex} ${ey - 12} ${ex + 12} ${ey + 4}" stroke="${OL}" stroke-width="6" fill="none" stroke-linecap="round"/>`; }
  else if (f === 'wow' || f === 'scared') { e = [-ex, ex].map(x => `<circle cx="${x}" cy="${ey - 2}" r="17" fill="#fff" stroke="${OL}" stroke-width="5"/><circle cx="${x + lx}" cy="${ey - 2 + ly}" r="7" fill="${OL}"/>`).join(''); }
  else { e = [-ex, ex].map(x => `<ellipse cx="${x + lx}" cy="${ey + ly}" rx="8" ry="${11 * bl}" fill="${OL}"/><circle cx="${x + lx + 3}" cy="${ey + ly - 4}" r="${3 * bl}" fill="#fff"/>`).join(''); }
  if (f === 'smile') m = `<path d="M-14 22 Q0 34 14 22" stroke="${OL}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  if (f === 'happy' || f === 'proud') m = `<path d="M-18 18 Q0 44 18 18Z" fill="#e8505b" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/>`;
  if (f === 'wow') m = `<ellipse cx="0" cy="${30}" rx="${12 + Math.sin(T * 3) * 1.5}" ry="${18}" fill="#7a2230" stroke="${OL}" stroke-width="5"/>`;
  if (f === 'scared') m = `<path d="M-16 30 q4 -8 8 0 q4 8 8 0 q4 -8 8 0 q4 8 8 0" stroke="${OL}" stroke-width="5" fill="none" stroke-linecap="round" transform="translate(-8 0)"/>`;
  if (f === 'think') m = `<path d="M-6 26 Q4 22 12 28" stroke="${OL}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  if (f === 'sad') m = `<path d="M-14 30 Q0 18 14 30" stroke="${OL}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  if (f === 'angry') { m = `<path d="M-14 30 Q0 20 14 30" stroke="${OL}" stroke-width="6" fill="none" stroke-linecap="round"/>`; br = `<path d="M-40 -32 L-14 -22 M40 -32 L14 -22" stroke="${OL}" stroke-width="7" stroke-linecap="round"/>`; }
  if (f === 'think') br = `<path d="M-38 -30 Q-26 -38 -14 -30 M14 -34 Q26 -40 38 -32" stroke="${OL}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  if (f === 'wow' || f === 'scared') br = `<path d="M-42 -40 Q-26 -50 -12 -42 M12 -42 Q26 -50 42 -40" stroke="${OL}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  const ck = `<circle cx="-42" cy="16" r="10" fill="#ff9aa8" opacity=".75"/><circle cx="42" cy="16" r="10" fill="#ff9aa8" opacity=".75"/>`;
  return ck + e + m + br;
}
function hair(o) {
  const c = o.hairCol || '#3b2a20';
  if (o.hair === 'girl') return `<path d="M-64 6 Q-72 -70 0 -70 Q72 -70 64 6 Q56 -30 30 -40 Q0 -20 -30 -42 Q-56 -30 -64 6Z" fill="${c}" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/><circle cx="-70" cy="-30" r="22" fill="${c}" stroke="${OL}" stroke-width="5"/><circle cx="70" cy="-30" r="22" fill="${c}" stroke="${OL}" stroke-width="5"/><circle cx="-58" cy="-42" r="8" fill="${o.bow || '#ff5a7a'}" stroke="${OL}" stroke-width="3"/><circle cx="58" cy="-42" r="8" fill="${o.bow || '#ff5a7a'}" stroke="${OL}" stroke-width="3"/>`;
  if (o.hair === 'bun') return `<circle cx="0" cy="-74" r="22" fill="${c}" stroke="${OL}" stroke-width="5"/><path d="M-64 0 Q-70 -68 0 -66 Q70 -68 64 0 Q50 -34 0 -40 Q-50 -34 -64 0Z" fill="${c}" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/>`;
  if (o.hair === 'bald') return '';
  return `<path d="M-64 -4 Q-70 -72 0 -70 Q66 -72 64 -4 Q56 -34 34 -38 L24 -26 L14 -40 Q-10 -30 -34 -40 Q-56 -30 -64 -4Z" fill="${c}" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/>`;
}
function kid(x, y, s, T, o = {}) {
  const skin = o.skin || '#ffdcc0', shirt = o.shirt || '#4aa3ff', pants = o.pants || '#3b4a7a';
  const bob = o.bob ? Math.abs(Math.sin(T * (o.bob === true ? 6 : o.bob))) * 8 : 0;
  let L = o.L ?? 12, R = o.R ?? 12;
  if (o.wave) R = 150 + Math.sin(T * 10) * 18;
  if (o.cheer) { L = 160 + Math.sin(T * 9) * 10; R = 160 + Math.sin(T * 9 + 1) * 10; }
  let body = '';
  body += o.skirt ? `<path d="M-30 -96 L-52 -40 H52 L30 -96Z" fill="${pants}" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/><rect x="-28" y="-44" width="16" height="44" rx="8" fill="${skin}" stroke="${OL}" stroke-width="5"/><rect x="12" y="-44" width="16" height="44" rx="8" fill="${skin}" stroke="${OL}" stroke-width="5"/>`
    : `<rect x="-30" y="-60" width="24" height="60" rx="10" fill="${pants}" stroke="${OL}" stroke-width="5"/><rect x="6" y="-60" width="24" height="60" rx="10" fill="${pants}" stroke="${OL}" stroke-width="5"/>`;
  body += `<ellipse cx="-18" cy="-2" rx="20" ry="9" fill="${OL}"/><ellipse cx="18" cy="-2" rx="20" ry="9" fill="${OL}"/>`;
  body += arm(-34, -132, L, shirt, skin, -1) + arm(34, -132, R, shirt, skin, 1);
  body += `<path d="M-40 -146 Q0 -158 40 -146 L46 -60 H-46Z" fill="${shirt}" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/>`;
  if (o.prop) body += o.prop;
  const head = `<circle r="66" fill="${skin}" stroke="${OL}" stroke-width="6"/>` + hair(o) + face(o, T) + (o.hat || '');
  const tilt = o.tilt || 0;
  const inner = body + g(`translate(0 -214) rotate(${tilt})`, head) + (o.front || '');
  return shadow(x, y, 60 * s) + g(tr(x, y - bob * s, s) + (o.flip ? ' scale(-1 1)' : ''), inner);
}
/* 大人（較高）：同 kid 參數，多 glasses、beard */
function adult(x, y, s, T, o = {}) {
  const inner = kid(0, 0, 1, T, Object.assign({}, o, { flip: false, front: (o.glasses ? `<g transform="translate(0 -222)"><circle cx="-26" cy="0" r="18" fill="none" stroke="${OL}" stroke-width="5"/><circle cx="26" cy="0" r="18" fill="none" stroke="${OL}" stroke-width="5"/><line x1="-8" y1="0" x2="8" y2="0" stroke="${OL}" stroke-width="5"/></g>` : '') + (o.beard ? `<path d="M-40 -190 Q0 -120 40 -190 Q0 -170 -40 -190Z" fill="${o.hairCol || '#3b2a20'}" stroke="${OL}" stroke-width="4"/>` : '') + (o.front || '') }));
  return g(tr(x, y, s * 1.12) + (o.flip ? ' scale(-1 1)' : '') + ' scale(1 1.1)', inner);
}
/* 帽子 */
const HAT = {
  top: (c = '#2b2233', band = '#e8505b') => `<g transform="translate(0 -60)"><rect x="-70" y="-6" width="140" height="16" rx="8" fill="${c}" stroke="${OL}" stroke-width="5"/><rect x="-44" y="-90" width="88" height="88" rx="6" fill="${c}" stroke="${OL}" stroke-width="5"/><rect x="-44" y="-26" width="88" height="16" fill="${band}" stroke="${OL}" stroke-width="4"/></g>`,
  crown: () => `<g transform="translate(0 -62)"><path d="M-44 0 L-50 -50 L-22 -26 L0 -60 L22 -26 L50 -50 L44 0Z" fill="#FFD23F" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/></g>`,
  beret: (c = '#e8505b') => `<g transform="translate(-6 -58) rotate(-12)"><ellipse cx="0" cy="0" rx="64" ry="22" fill="${c}" stroke="${OL}" stroke-width="5"/><circle cx="0" cy="-22" r="7" fill="${c}" stroke="${OL}" stroke-width="4"/></g>`,
};

/* ===== 動物 ===== */
function duck(x, y, s, T, o = {}) { // 小鴨
  const c = o.col || '#FFD23F', bob = Math.abs(Math.sin(T * 7 + (o.seed || 0))) * 5 * (o.walk ? 1 : 0);
  const inner = `<ellipse cx="0" cy="-40" rx="50" ry="38" fill="${c}" stroke="${OL}" stroke-width="5"/><path d="M30 -60 Q60 -70 52 -36" fill="${c}" stroke="${OL}" stroke-width="5"/><circle cx="-30" cy="-92" r="32" fill="${c}" stroke="${OL}" stroke-width="5"/><path d="M-58 -92 L-82 -86 L-58 -78Z" fill="#ff9f1c" stroke="${OL}" stroke-width="4" stroke-linejoin="round"/><circle cx="-38" cy="-98" r="6" fill="${OL}"/><circle cx="-36" cy="-100" r="2" fill="#fff"/><path d="M-10 -46 Q14 -30 30 -48" stroke="${OL}" stroke-width="4" fill="none"/><path d="M-14 -4 v6 h-12 M10 -4 v6 h-12" stroke="#ff9f1c" stroke-width="6" stroke-linecap="round"/>` + (o.hat || '') + (o.face === 'sad' ? `<path d="M-46 -112 l12 4" stroke="${OL}" stroke-width="4"/>` : '');
  return shadow(x, y, 40 * s) + g(tr(x, y - bob, s) + (o.flip ? ' scale(-1 1)' : ''), inner);
}
function tiger(x, y, s, T, o = {}) { // 站立的老虎／獅子；o.roar 0~1 張嘴、o.claw 0~1 舉爪
  const lion = o.kind === 'lion', c = lion ? '#f2b84b' : '#ff9a2e', roar = o.roar ?? 0, claw = o.claw ?? 0;
  const wob = Math.sin(T * 14) * 6 * claw;
  const paw = (side) => { const a = (40 + claw * 110 + (side > 0 ? wob : -wob)) * side, rad = a * Math.PI / 180, ex = side * 40 + Math.sin(rad) * 80, ey = -150 - Math.cos(rad) * -80 * -1;
    const px = side * 40 + Math.sin(rad) * 80, py = -150 + Math.cos(rad) * 80;
    let cls = ''; if (claw > .3) for (let i = -1; i <= 1; i++) cls += `<path d="M${f1(px + i * 10)} ${f1(py - 18)} l${-3 + i * 3} -18 l6 16" fill="#fff" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>`;
    return `<line x1="${side * 40}" y1="-150" x2="${f1(px)}" y2="${f1(py)}" stroke="${OL}" stroke-width="40" stroke-linecap="round"/><line x1="${side * 40}" y1="-150" x2="${f1(px)}" y2="${f1(py)}" stroke="${c}" stroke-width="30" stroke-linecap="round"/><circle cx="${f1(px)}" cy="${f1(py)}" r="24" fill="${c}" stroke="${OL}" stroke-width="5"/>` + cls; };
  let o2 = '';
  o2 += `<path d="M60 -50 Q140 -60 120 -150" stroke="${OL}" stroke-width="20" fill="none" stroke-linecap="round"/><path d="M60 -50 Q140 -60 120 -150" stroke="${c}" stroke-width="12" fill="none" stroke-linecap="round"/>`;
  o2 += `<rect x="-44" y="-70" width="34" height="70" rx="14" fill="${c}" stroke="${OL}" stroke-width="5"/><rect x="10" y="-70" width="34" height="70" rx="14" fill="${c}" stroke="${OL}" stroke-width="5"/>`;
  o2 += `<ellipse cx="0" cy="-110" rx="62" ry="72" fill="${c}" stroke="${OL}" stroke-width="5"/><ellipse cx="0" cy="-100" rx="34" ry="46" fill="#fff4dc"/>`;
  if (!lion) o2 += `<path d="M-60 -130 h22 M-62 -100 h20 M60 -130 h-22 M62 -100 h-20" stroke="${OL}" stroke-width="7" stroke-linecap="round"/>`;
  o2 += paw(-1) + paw(1);
  let hd = '';
  if (lion) { for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283; hd += `<circle cx="${f1(Math.cos(a) * 70)}" cy="${f1(Math.sin(a) * 66)}" r="30" fill="#c76b1f" stroke="${OL}" stroke-width="4"/>`; } }
  hd += `<circle cx="-50" cy="-52" r="20" fill="${c}" stroke="${OL}" stroke-width="5"/><circle cx="50" cy="-52" r="20" fill="${c}" stroke="${OL}" stroke-width="5"/><ellipse cx="0" cy="0" rx="72" ry="66" fill="${c}" stroke="${OL}" stroke-width="6"/>`;
  if (!lion) hd += `<path d="M-12 -64 v18 M0 -66 v22 M12 -64 v18 M-70 -10 h18 M70 -10 h-18 M-68 10 h16 M68 10 h-16" stroke="${OL}" stroke-width="6" stroke-linecap="round"/>`;
  hd += `<ellipse cx="0" cy="22" rx="40" ry="30" fill="#fff4dc"/>`;
  const ang = roar > .3;
  hd += ang ? `<path d="M-40 -26 L-14 -16 M40 -26 L14 -16" stroke="${OL}" stroke-width="7" stroke-linecap="round"/><circle cx="-26" cy="-6" r="7" fill="${OL}"/><circle cx="26" cy="-6" r="7" fill="${OL}"/>` : `<ellipse cx="-26" cy="-8" rx="7" ry="10" fill="${OL}"/><ellipse cx="26" cy="-8" rx="7" ry="10" fill="${OL}"/>`;
  hd += `<path d="M-10 6 h20 l-10 10z" fill="${OL}"/>`;
  const mh = 4 + roar * 34;
  hd += `<path d="M-28 22 Q0 ${22 + mh * 1.3} 28 22 Q0 ${30} -28 22Z" fill="#7a2230" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/>`;
  if (roar > .2) hd += `<path d="M-22 24 l6 ${10 * roar} l6 ${-10 * roar} M10 24 l6 ${10 * roar} l6 ${-10 * roar}" fill="#fff" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>`;
  o2 += g('translate(0 -220)', hd);
  const sh = roar > .5 ? Math.sin(T * 30) * 2 : 0;
  return shadow(x, y, 70 * s) + g(tr(x + sh, y, s) + (o.flip ? ' scale(-1 1)' : ''), o2);
}
function crab(x, y, s, T, o = {}) {
  const sn = o.snap ? Math.abs(Math.sin(T * 8)) : 0; const c = '#ff5a4a';
  const pinch = (side) => g(`translate(${side * 92} -90) rotate(${side * (-20 - sn * 20)})`, `<path d="M0 0 C${side * 10} -60 ${side * 50} -60 ${side * 40} -20 L${side * 20} -24 Z" fill="${c}" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/><path d="M0 0 C${side * 40} -10 ${side * 50} -30 ${side * 40} -14" fill="${c}" stroke="${OL}" stroke-width="5"/>`);
  let legs = ''; for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) legs += `<path d="M${sd * 40} ${-30 - i * 8} l${sd * 40} ${10 + i * 6} l${sd * 10} 26" stroke="${OL}" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M${sd * 40} ${-30 - i * 8} l${sd * 40} ${10 + i * 6} l${sd * 10} 26" stroke="${c}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  const inner = legs + `<line x1="-40" y1="-60" x2="-90" y2="-92" stroke="${OL}" stroke-width="14" stroke-linecap="round"/><line x1="40" y1="-60" x2="90" y2="-92" stroke="${OL}" stroke-width="14" stroke-linecap="round"/>` + pinch(-1) + pinch(1) +
    `<ellipse cx="0" cy="-46" rx="70" ry="42" fill="${c}" stroke="${OL}" stroke-width="6"/><line x1="-20" y1="-80" x2="-24" y2="-108" stroke="${OL}" stroke-width="5"/><line x1="20" y1="-80" x2="24" y2="-108" stroke="${OL}" stroke-width="5"/><circle cx="-24" cy="-114" r="13" fill="#fff" stroke="${OL}" stroke-width="4"/><circle cx="24" cy="-114" r="13" fill="#fff" stroke="${OL}" stroke-width="4"/><circle cx="-22" cy="-112" r="5" fill="${OL}"/><circle cx="22" cy="-112" r="5" fill="${OL}"/><path d="M-36 -128 l22 8 M36 -128 l-22 8" stroke="${OL}" stroke-width="5" stroke-linecap="round"/><path d="M-16 -36 Q0 -46 16 -36" stroke="${OL}" stroke-width="5" fill="none"/>`;
  return shadow(x, y, 80 * s) + g(tr(x, y - Math.abs(Math.sin(T * 6)) * 6 * (o.snap ? 1 : 0), s), inner);
}
function rabbit(x, y, s, T, o = {}) {
  const c = o.col || '#fff';
  return g(tr(x, y, s), `<ellipse cx="-16" cy="-120" rx="12" ry="40" fill="${c}" stroke="${OL}" stroke-width="5" transform="rotate(-10 -16 -120)"/><ellipse cx="16" cy="-120" rx="12" ry="40" fill="${c}" stroke="${OL}" stroke-width="5" transform="rotate(10 16 -120)"/><ellipse cx="-16" cy="-118" rx="5" ry="26" fill="#ffb3c4" transform="rotate(-10 -16 -118)"/><ellipse cx="16" cy="-118" rx="5" ry="26" fill="#ffb3c4" transform="rotate(10 16 -118)"/><ellipse cx="0" cy="-30" rx="40" ry="32" fill="${c}" stroke="${OL}" stroke-width="5"/><circle cx="0" cy="-70" r="34" fill="${c}" stroke="${OL}" stroke-width="5"/><circle cx="-12" cy="-74" r="5" fill="${OL}"/><circle cx="12" cy="-74" r="5" fill="${OL}"/><path d="M-5 -62 h10 l-5 6z" fill="#ff7a9a"/><circle cx="-22" cy="-60" r="6" fill="#ffb3c4"/><circle cx="22" cy="-60" r="6" fill="#ffb3c4"/>`);
}
function dove(x, y, s, T, i = 0) {
  const fl = Math.sin(T * 14 + i) * 30;
  return g(tr(x, y, s), `<ellipse cx="0" cy="0" rx="34" ry="20" fill="#fff" stroke="${OL}" stroke-width="4"/><circle cx="30" cy="-12" r="14" fill="#fff" stroke="${OL}" stroke-width="4"/><path d="M42 -12 l12 4 l-12 4z" fill="#ff9f1c" stroke="${OL}" stroke-width="3"/><circle cx="33" cy="-15" r="3" fill="${OL}"/>` + g(`rotate(${-fl})`, `<path d="M-6 -6 Q-30 -50 -50 -40 Q-36 -10 -6 -6Z" fill="#fff" stroke="${OL}" stroke-width="4"/>`));
}

/* ===== 道具 ===== */
function box(x, y, w, h, col = '#d9a066', label = '') {
  return `<rect x="${x - w / 2}" y="${y - h}" width="${w}" height="${h}" fill="${col}" stroke="${OL}" stroke-width="6" rx="4"/><path d="M${x - w / 2} ${y - h} l-24 -26 h${w} l24 26" fill="#c98b4f" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/>` + (label ? txt(x, y - h / 2, label, 30, OL, 'none', 0) : '');
}
function rocket(x, y, s, T, fire = 0) { // 紙箱太空船
  let fl = ''; if (fire > 0) for (let i = -1; i <= 1; i++) { const k = (.8 + .3 * Math.sin(T * 30 + i)) * fire; fl += g(tr(i * 34, 4, k), `<path d="M-16 0 Q0 90 16 0Z" fill="#ff7b1c" stroke="${OL}" stroke-width="4"/><path d="M-8 0 Q0 50 8 0Z" fill="#FFE14D"/>`); }
  return g(tr(x, y, s), fl + `<path d="M-90 0 L-130 40 L-90 30Z M90 0 L130 40 L90 30Z" fill="#e8505b" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/><rect x="-90" y="-170" width="180" height="170" fill="#d9a066" stroke="${OL}" stroke-width="6" rx="4"/><path d="M-90 -170 L0 -270 L90 -170Z" fill="#e8505b" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/><circle cx="0" cy="-110" r="36" fill="#9fd8ff" stroke="${OL}" stroke-width="6"/><path d="M-60 -40 h30 M30 -40 h30" stroke="${OL}" stroke-width="5"/>` + star(0, -200, 16, '#FFE14D', 0, 3));
}
function wand(x, y, s, r, T, sparkle = 0) {
  return g(tr(x, y, s, r), `<rect x="-6" y="-80" width="12" height="80" rx="4" fill="${OL}"/><rect x="-6" y="-80" width="12" height="16" fill="#fff" stroke="${OL}" stroke-width="3"/>` + (sparkle ? sparkles(0, -90, 30 * sparkle, T, 5, '#FFE14D') : ''));
}
function table(x, y, w = 260, col = '#e8505b') { return `<rect x="${x - w / 2}" y="${y - 110}" width="${w}" height="24" rx="6" fill="#8d5a34" stroke="${OL}" stroke-width="5"/><rect x="${x - w / 2 + 10}" y="${y - 86}" width="${w - 20}" height="70" fill="${col}" stroke="${OL}" stroke-width="5"/><path d="M${x - w / 2 + 10} ${y - 16} v16 M${x + w / 2 - 10} ${y - 16} v16" stroke="${OL}" stroke-width="10"/>`; }
function easel(x, y, s, art) { // 畫架，art 為 200×150 的畫面內容（原點左上）
  return g(tr(x, y, s), `<path d="M-90 0 L-40 -300 M90 0 L40 -300 M0 0 L0 -260" stroke="#8d5a34" stroke-width="14" stroke-linecap="round"/><rect x="-120" y="-280" width="240" height="180" fill="#fff" stroke="${OL}" stroke-width="6" rx="4"/>` + g('translate(-110 -270) scale(1.1)', art) + `<rect x="-130" y="-104" width="260" height="16" rx="6" fill="#8d5a34" stroke="${OL}" stroke-width="5"/>`);
}
function bottle(x, y, s, T, pour = 0) { // 寶特瓶澆花器
  let drops = ''; if (pour) for (let i = 0; i < 7; i++) { const u = (T * 1.6 + i / 7) % 1; drops += `<circle cx="${-70 - i % 3 * 12 - u * 20}" cy="${10 + u * 110}" r="6" fill="#5cc8ff" stroke="${OL}" stroke-width="2"/>`; }
  return g(tr(x, y, s, -35 * pour), `<rect x="-36" y="-120" width="72" height="120" rx="20" fill="#bfeaff" fill-opacity=".85" stroke="${OL}" stroke-width="5"/><rect x="-36" y="-80" width="72" height="30" fill="#5cc05a" stroke="${OL}" stroke-width="4"/><rect x="-16" y="-142" width="32" height="24" rx="4" fill="#4aa3ff" stroke="${OL}" stroke-width="5"/><g fill="${OL}"><circle cx="-8" cy="-148" r="2.5"/><circle cx="4" cy="-150" r="2.5"/><circle cx="10" cy="-146" r="2.5"/></g><rect x="-30" y="-110" width="10" height="70" rx="5" fill="#fff" opacity=".6"/>`) + g(tr(x, y, s), drops);
}
function sockPuppet(x, y, s, T, col = '#ff6b9a') {
  const m = Math.abs(Math.sin(T * 6)) * 14;
  return g(tr(x, y, s), `<path d="M-40 0 V-120 Q-40 -170 10 -170 Q60 -170 60 -120 V-40 Q60 0 30 0Z" fill="${col}" stroke="${OL}" stroke-width="6"/><path d="M-40 -20 h100" stroke="#fff" stroke-width="10"/><path d="M-40 -36 h100" stroke="#fff" stroke-width="6"/><circle cx="0" cy="-140" r="14" fill="#fff" stroke="${OL}" stroke-width="4"/><circle cx="32" cy="-140" r="14" fill="#fff" stroke="${OL}" stroke-width="4"/><circle cx="2" cy="-138" r="6" fill="${OL}"/><circle cx="34" cy="-138" r="6" fill="${OL}"/><path d="M40 -${108 - m / 2} q22 ${m / 2} 0 ${m}" fill="#7a2230" stroke="${OL}" stroke-width="4"/><path d="M-10 -180 q10 -20 20 0 q10 -20 20 0" stroke="#FFE14D" stroke-width="8" fill="none" stroke-linecap="round"/>`);
}
function burger(x, y, s) { return g(tr(x, y, s), `<path d="M-50 0 h100 v-12 h-100z" fill="#e0a052" stroke="${OL}" stroke-width="4"/><rect x="-54" y="-24" width="108" height="14" rx="6" fill="#7a3e1d" stroke="${OL}" stroke-width="4"/><path d="M-56 -26 q14 -10 28 0 q14 -10 28 0 q14 -10 28 0 q14 -10 28 0" fill="#5cc05a" stroke="${OL}" stroke-width="4"/><path d="M-50 -30 Q-50 -76 0 -76 Q50 -76 50 -30Z" fill="#f1b45a" stroke="${OL}" stroke-width="4"/><g fill="#fff"><ellipse cx="-16" cy="-56" rx="4" ry="2.5"/><ellipse cx="10" cy="-62" rx="4" ry="2.5"/><ellipse cx="24" cy="-48" rx="4" ry="2.5"/></g>`); }
function firework(x, y, A, col = '#ff5a7a', R = 120) {
  if (A < 0) return ''; if (A < .5) { const yy = y + (1 - A / .5) * 320; return `<circle cx="${x}" cy="${yy}" r="7" fill="#FFE14D"/>`; }
  const u = cl((A - .5) / 1.2), r = ease(u) * R, o2 = 1 - cl((A - 1.6) / .8); let s = '';
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; s += `<line x1="${f1(x + Math.cos(a) * r * .4)}" y1="${f1(y + Math.sin(a) * r * .4)}" x2="${f1(x + Math.cos(a) * r)}" y2="${f1(y + Math.sin(a) * r)}" stroke="${col}" stroke-width="8" stroke-linecap="round"/><circle cx="${f1(x + Math.cos(a) * r * 1.08)}" cy="${f1(y + Math.sin(a) * r * 1.08)}" r="5" fill="#FFE14D"/>`; }
  return op(o2, s);
}
function kite(x, y, s, T, kind = 'square', col = '#ff5a7a') {
  const sw = Math.sin(T * 2 + x) * 8; let body;
  if (kind === 'fish') body = `<path d="M-70 0 Q0 -60 60 0 Q0 60 -70 0Z" fill="${col}" stroke="${OL}" stroke-width="5"/><path d="M60 0 l40 -36 v72z" fill="${col}" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/><circle cx="-36" cy="-6" r="10" fill="#fff" stroke="${OL}" stroke-width="4"/><circle cx="-38" cy="-6" r="4" fill="${OL}"/><path d="M-10 -24 q10 24 0 48 M14 -24 q10 24 0 48" stroke="${OL}" stroke-width="4" fill="none"/>`;
  else body = `<path d="M0 -60 L46 0 L0 70 L-46 0Z" fill="${col}" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/><path d="M0 -60 V70 M-46 0 H46" stroke="${OL}" stroke-width="3"/>`;
  let tail = `<path d="M0 70 q20 30 0 60 q-20 30 0 60" stroke="${OL}" stroke-width="3" fill="none"/>`;
  if (kind === 'fish') tail = '';
  return g(tr(x, y, s, sw), body + tail);
}
function mic(x, y, s, r = 0) { return g(tr(x, y, s, r), `<rect x="-6" y="0" width="12" height="60" rx="5" fill="${OL}"/><circle cx="0" cy="-8" r="18" fill="#bbb" stroke="${OL}" stroke-width="5"/>`); }
function notes(x, y, T, n = 5, col = '#9b5de5') {
  let o = ''; for (let i = 0; i < n; i++) { const u = (T * .5 + i / n) % 1; o += op(Math.sin(u * Math.PI), g(tr(x + Math.sin(u * 6 + i) * 40 + i * 30, y - u * 180, 1, Math.sin(T * 3 + i) * 15), `<path d="M0 0 V-40 l26 -8 v34" stroke="${OL}" stroke-width="5" fill="none"/><ellipse cx="-6" cy="0" rx="10" ry="8" fill="${col}" stroke="${OL}" stroke-width="4"/><ellipse cx="20" cy="-14" rx="10" ry="8" fill="${col}" stroke="${OL}" stroke-width="4"/>`)); }
  return o;
}
function bread(x, y, s, kind = 'bear') {
  const ear = kind === 'bear' ? `<circle cx="-34" cy="-46" r="16" fill="#e0a052" stroke="${OL}" stroke-width="4"/><circle cx="34" cy="-46" r="16" fill="#e0a052" stroke="${OL}" stroke-width="4"/>` : kind === 'cat' ? `<path d="M-40 -30 L-34 -66 L-12 -44Z M40 -30 L34 -66 L12 -44Z" fill="#e0a052" stroke="${OL}" stroke-width="4" stroke-linejoin="round"/>` : `<path d="M-20 -40 L-30 -90 L-6 -46Z M20 -40 L30 -90 L6 -46Z" fill="#e0a052" stroke="${OL}" stroke-width="4" stroke-linejoin="round"/>`;
  return g(tr(x, y, s), ear + `<ellipse cx="0" cy="-20" rx="50" ry="40" fill="#e0a052" stroke="${OL}" stroke-width="5"/><ellipse cx="0" cy="-8" rx="18" ry="12" fill="#f6d39a"/><circle cx="-16" cy="-28" r="5" fill="${OL}"/><circle cx="16" cy="-28" r="5" fill="${OL}"/><circle cx="0" cy="-12" r="4" fill="${OL}"/>`);
}
function plate(x, y, w = 160) { return `<ellipse cx="${x}" cy="${y}" rx="${w / 2}" ry="${w / 9}" fill="#fff" stroke="${OL}" stroke-width="5"/>`; }
/* 點點畫（獨樹一格用） */
function dotArt(seed = 0, scale = 1) {
  const cols = ['#ff5a7a', '#FFD23F', '#4aa3ff', '#5cc05a', '#9b5de5', '#ff9f1c']; let o = '';
  for (let i = 0; i < 70; i++) { const a = rnd(i + seed) * 6.283, r = Math.sqrt(rnd(i * 3 + seed)) * 60; o += `<circle cx="${f1(100 + Math.cos(a) * r * 1.3)}" cy="${f1(72 + Math.sin(a) * r)}" r="${f1((4 + rnd(i * 7) * 6) * scale)}" fill="${cols[i % 6]}"/>`; }
  for (let i = 0; i < 26; i++) o += `<circle cx="${f1(14 + i * 7)}" cy="${f1(130 + Math.sin(i) * 4)}" r="4" fill="#5cc05a"/>`;
  return o;
}
function plainArt() { return `<rect width="200" height="150" fill="#dff3ff"/><circle cx="160" cy="34" r="20" fill="#ff5a4a"/><path d="M40 120 V80 L80 50 L120 80 V120Z" fill="#ffd9a8" stroke="${OL}" stroke-width="3"/><rect x="70" y="95" width="20" height="25" fill="#8d5a34"/><rect y="120" width="200" height="30" fill="#8fd16a"/>`; }

/* ===== 成語卡（字旁附注音） ===== */
function zyCol(z, x, y, size) { // 直排注音：z 例 'ㄑㄧˊ'
  if (!z) return ''; const light = z[0] === '˙'; let base = z.replace(/[ˊˇˋ˙]/g, ''), tone = (z.match(/[ˊˇˋ]/) || [''])[0];
  const n = [...base].length, fs = size * .27, lh = fs * 1.02, top = y - (n * lh) / 2 + lh / 2;
  let o = light ? txt(x, top - lh * .9, '˙', fs, OL, 'none', 0, 'middle', 700) : '';
  [...base].forEach((c, i) => o += txt(x, top + i * lh, c, fs, OL, 'none', 0, 'middle', 700));
  if (tone) o += txt(x + fs * .75, top + (n - 1) * lh - lh * .55 + (n === 1 ? -fs * .1 : 0), tone, fs * .9, OL, 'none', 0, 'middle', 700);
  return o;
}
/* idiomCard(x,y,中文,注音陣列,主色,字級,A, 高亮字索引陣列) */
function idiomCard(x, y, word, zy, col, size, A, hi = []) {
  if (A < 0) return ''; const k = popS(A); const ch = [...word], cw = size * 1.45, w = ch.length * cw + size * .7, h = size * 1.6;
  let o = `<rect x="${-w / 2 + 6}" y="${-h / 2 + 8}" width="${w}" height="${h}" rx="${h * .3}" fill="${OL}" opacity=".25"/><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${h * .3}" fill="#fff" stroke="${OL}" stroke-width="6"/><rect x="${-w / 2 + 10}" y="${-h / 2 + 10}" width="${w - 20}" height="${h - 20}" rx="${h * .25}" fill="none" stroke="${col}" stroke-width="5" stroke-dasharray="14 10"/>`;
  ch.forEach((c, i) => {
    const cx = -w / 2 + size * .35 + cw * i + cw * .42, on = hi.includes(i);
    if (on) o += `<rect x="${cx - size * .62}" y="${-size * .7}" width="${size * 1.48}" height="${size * 1.4}" rx="14" fill="${col}" opacity=".22"/>`;
    o += txt(cx, 4, c, size, on ? col : col, OL, size * .1);
    o += zyCol(zy && zy[i], cx + size * .66, 4, size);
  });
  return g(tr(x, y, k, (1 - k) * -8), o);
}
/* 黃底圓角標籤 */
function badge(x, y, s, A, col = '#ffb703', size = 34, fg = '#fff') {
  if (A < 0) return ''; const w = [...s].length * size * 1.05 + size * 1.4, k = popS(A);
  return g(tr(x, y, k), `<rect x="${-w / 2}" y="${-size * .9}" width="${w}" height="${size * 1.8}" rx="${size * .9}" fill="${col}" stroke="${OL}" stroke-width="5"/>` + txt(0, 2, s, size, fg, fg === OL ? 'none' : OL, fg === OL ? 0 : size * .1, 'middle', 700));
}
/* 蓋章：記起來！ */
function stamp(x, y, s, A, label, col) {
  if (A < 0) return ''; const k = A < .25 ? lerp(2.2, 1, ease(A / .25)) : 1, o = cl(A / .2);
  return op(o, g(tr(x, y, k * s, -8), `<rect x="-170" y="-58" width="340" height="116" rx="22" fill="${col}" stroke="${OL}" stroke-width="7"/><rect x="-156" y="-44" width="312" height="88" rx="16" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="12 8"/>` + txt(0, 4, label, 60, '#fff', OL, 10)));
}
/* 多行說明文字框（逐字出現） */
function textBox(x, y, w, lines, A, col = '#fff', size = 44, typing = true) {
  if (A < 0) return ''; const h = lines.length * size * 1.45 + size * .9, k = popS(A);
  let o = `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="26" fill="${col}" stroke="${OL}" stroke-width="6"/>`;
  let cnt = 0;
  lines.forEach((ln, i) => {
    const chars = [...ln]; const shown = typing ? chars.slice(0, Math.max(0, Math.floor((A - .2) * 13) - cnt)).join('') : ln; cnt += chars.length;
    o += txt(0, -h / 2 + size * .45 + size * .72 + i * size * 1.45, shown || ' ', size, OL, 'none', 0);
  });
  return g(tr(x, y, k), o);
}
/* 句子：關鍵成語用彩色膠囊突顯；parts=[{s:'文字'},{s:'成語',c:'#色'}] */
function sentence(x, y, parts, A, size = 40, maxW = 1100) {
  if (A < 0) return ''; let all = []; parts.forEach(p => [...p.s].forEach(c => all.push({ c, col: p.c })));
  const perLine = Math.floor(maxW / (size * 1.05)), lines = []; for (let i = 0; i < all.length; i += perLine) lines.push(all.slice(i, i + perLine));
  let o = ''; const n = Math.floor(A * 10);
  lines.forEach((ln, li) => {
    const lw = ln.length * size * 1.05, x0 = -lw / 2;
    ln.forEach((ch, i) => {
      const idx = li * perLine + i; if (idx > n) return; const cx = x0 + i * size * 1.05 + size * .52, cy = li * size * 1.6;
      if (ch.col) o += `<rect x="${f1(cx - size * .56)}" y="${f1(cy - size * .66)}" width="${f1(size * 1.12)}" height="${f1(size * 1.32)}" rx="8" fill="${ch.col}"/>`;
      o += txt(cx, cy, ch.c, size, ch.col ? '#fff' : OL, ch.col ? OL : 'none', ch.col ? size * .12 : 0);
    });
  });
  return g(tr(x, y - (lines.length - 1) * size * .8, 1), o);
}
/* 只有頭（放在窗戶、車內等） */
function kidHead(x, y, s, T, o = {}) { return g(tr(x, y, s) + (o.flip ? ' scale(-1 1)' : ''), `<circle r="66" fill="${o.skin || '#ffdcc0'}" stroke="${OL}" stroke-width="6"/>` + hair(o) + face(o, T) + (o.hat || '')); }
/* 房間背景 */
function room(wall = '#dff1ff', fl = '#e9c48f', y = 560) { return `<rect width="1280" height="720" fill="${wall}"/>` + floor(y, fl); }
function grassField(T, sky1 = '#8fd3ff', sky2 = '#e3f6ff', y = 560) { return bg(sky1, sky2) + cloud(220 + Math.sin(T * .3) * 30, 120, .9) + cloud(1000 - Math.sin(T * .25) * 30, 90, .7) + ground(y); }
