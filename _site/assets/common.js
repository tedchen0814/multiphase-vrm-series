const NS = 'http://www.w3.org/2000/svg';
const $ = id => document.getElementById(id);
const fx = (v, d = 2) => (Math.abs(v) < 1e-9 ? 0 : v).toFixed(d);
const REDUCED = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const PH = k => `var(--p${(k % 8) + 1})`;   // phase colour, same in every page
function svgEl(tag, attrs, parent, text){
const e = document.createElementNS(NS, tag);
for (const a in attrs) e.setAttribute(a, attrs[a]);
if (text != null) e.textContent = text;
if (parent) parent.appendChild(e);
return e;
}
function segGroup(id, cb){
const g = $(id);
g.addEventListener('click', e => {
const b = e.target.closest('button[data-v]'); if (!b) return;
setSeg(id, b.dataset.v); cb(b.dataset.v);
});
}
function setSeg(id, v){ $(id).querySelectorAll('button[data-v]').forEach(o => o.setAttribute('aria-pressed', o.dataset.v === String(v))); }
function sliders(defs, P, box, onChange){
defs.forEach(d => {
const w = document.createElement('div'); w.className = 'param';
w.innerHTML = `<div class="top"><label for="p_${d.k}">${d.zh}<span class="en">${d.en}</span></label><output id="o_${d.k}"></output></div>
<input type="range" id="p_${d.k}" min="${d.min}" max="${d.max}" step="${d.step}">`;
box.appendChild(w);
$('p_' + d.k).addEventListener('input', e => { P[d.k] = parseFloat(e.target.value); onChange(d.k); sync(); });
});
function sync(){ defs.forEach(d => { $('p_' + d.k).value = P[d.k]; $('o_' + d.k).textContent = d.fmt(P[d.k]); }); }
sync();
return sync;
}
/* "nice" axis ticks between a and b */
function ticks(a, b, n = 5){
const span = b - a; if (!(span > 0)) return [a];
const raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw)));
const step = [1, 2, 2.5, 5, 10].map(s => s * mag).find(s => s >= raw) || 10 * mag;
const out = []; for (let v = Math.ceil(a / step - 1e-9) * step; v <= b + 1e-9; v += step) out.push(+v.toFixed(10));
return out;
}
/* simple x/y chart frame; returns scale functions and a clipped line() helper */
function chart(svg, o){
svg.innerHTML = '';
svg.setAttribute('viewBox', `0 0 ${o.W} ${o.H}`);
const iw = o.W - o.l - o.r, ih = o.H - o.t - o.b;
const lx = o.logx ? Math.log10 : v => v;
const X = v => o.l + (lx(v) - lx(o.x[0])) / (lx(o.x[1]) - lx(o.x[0])) * iw;
const Y = v => o.t + ih - (v - o.y[0]) / (o.y[1] - o.y[0]) * ih;
const cy = v => Math.min(o.y[1], Math.max(o.y[0], v));
(o.yt || ticks(o.y[0], o.y[1], o.ny || 4)).forEach(v => {
svgEl('line', {x1:o.l, x2:o.W - o.r, y1:Y(v), y2:Y(v), class:'grid'}, svg);
svgEl('text', {x:o.l - 6, y:Y(v) + 4, 'text-anchor':'end', class:'tick'}, svg, o.yf ? o.yf(v) : v);
});
(o.xt || ticks(o.x[0], o.x[1], o.nx || 6)).forEach(v => {
svgEl('line', {x1:X(v), x2:X(v), y1:o.t, y2:o.H - o.b, class:'grid'}, svg);
svgEl('text', {x:X(v), y:o.H - o.b + 15, 'text-anchor':'middle', class:'tick'}, svg, o.xf ? o.xf(v) : v);
});
svgEl('rect', {x:o.l, y:o.t, width:iw, height:ih, class:'frame'}, svg);
if (o.xlab) svgEl('text', {x:o.W - o.r, y:o.t - 6, 'text-anchor':'end', class:'axlab'}, svg, '→ ' + o.xlab);
if (o.ylab) svgEl('text', {x:o.l, y:o.t - 6, class:'axlab'}, svg, o.ylab);
const path = pts => pts.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(cy(p[1])).toFixed(1)).join('');
return {X, Y, iw, ih,
line(pts, attrs){ return svgEl('path', Object.assign({d:path(pts), fill:'none', 'stroke-width':2, 'stroke-linejoin':'round'}, attrs), svg); },
area(pts, base, attrs){
const d = path(pts) + `L${X(pts[pts.length - 1][0]).toFixed(1)} ${Y(base)}L${X(pts[0][0]).toFixed(1)} ${Y(base)}Z`;
return svgEl('path', Object.assign({d}, attrs), svg);
},
hline(v, attrs){ return svgEl('line', Object.assign({x1:o.l, x2:o.W - o.r, y1:Y(v), y2:Y(v)}, attrs), svg); },
vline(v, attrs){ return svgEl('line', Object.assign({x1:X(v), x2:X(v), y1:o.t, y2:o.H - o.b}, attrs), svg); },
text(x, y, s, attrs){ return svgEl('text', Object.assign({x:X(x), y:Y(y)}, attrs), svg, s); }
};
}
/* multiple-choice quiz: items = [{q, opts:[...], a:index, why}] */
function quiz(box, items){
items.forEach((it, qi) => {
const d = document.createElement('div'); d.className = 'q';
d.innerHTML = `<p>Q${qi + 1}. ${it.q}</p><div class="opts"></div><p class="fb" hidden></p>`;
const opts = d.querySelector('.opts'), fb = d.querySelector('.fb');
it.opts.forEach((o, i) => {
const b = document.createElement('button'); b.type = 'button'; b.innerHTML = o;
b.addEventListener('click', () => {
opts.querySelectorAll('button').forEach(x => x.classList.remove('right', 'wrong'));
b.classList.add(i === it.a ? 'right' : 'wrong');
fb.hidden = false; fb.innerHTML = (i === it.a ? '✓ 正確。' : '✗ 再想想。') + ' ' + it.why;
});
opts.appendChild(b);
});
box.appendChild(d);
});
}
/* abbreviation glossary: full English name + Chinese; used for <abbr> tooltips and the per-page table */
const ABBR = [
['VRM', 'Voltage Regulator Module', '電壓調節模組（CPU／GPU 供電電路）'],
['CPU', 'Central Processing Unit', '中央處理器'],
['GPU', 'Graphics Processing Unit', '圖形處理器'],
['MOSFET', 'Metal-Oxide-Semiconductor Field-Effect Transistor', '金氧半場效電晶體'],
['HS', 'High-Side (MOSFET)', '高側開關，接在輸入電壓與開關節點之間'],
['LS', 'Low-Side (MOSFET)', '低側開關，接在開關節點與地之間'],
['PWM', 'Pulse-Width Modulation', '脈波寬度調變'],
['RMS', 'Root Mean Square', '均方根值（代表發熱的等效電流）'],
['CCM', 'Continuous Conduction Mode', '連續導通模式：電感電流不歸零'],
['DCM', 'Discontinuous Conduction Mode', '非連續導通模式：輕載時電感電流歸零'],
['COT', 'Constant On-Time', '定導通時間控制'],
['MLCC', 'Multilayer Ceramic Capacitor', '積層陶瓷電容'],
['ESR', 'Equivalent Series Resistance', '等效串聯電阻'],
['ESL', 'Equivalent Series Inductance', '等效串聯電感'],
['AVP', 'Adaptive Voltage Positioning', '主動（適應性）電壓定位，即 Load-line 下垂'],
['VID', 'Voltage Identification', '電壓識別碼：CPU 要求的目標電壓'],
['SVID', 'Serial Voltage Identification', '序列式電壓識別匯流排（CPU 與 VRM 控制器間的三線介面）'],
['IMVP', 'Intel Mobile Voltage Positioning', 'Intel 行動平台核心供電規範'],
['RLL', 'Load-Line Resistance', 'Load-line 斜率（電壓隨電流下降的等效電阻）'],
['Icc,max', 'Maximum Core Current (ICCMAX)', '電源軌允許的最大電流'],
['IA', 'Intel Architecture (CPU cores)', 'CPU 核心電源軌（VCC_CORE）'],
['GT', 'Graphics Technology (integrated GPU)', '內顯電源軌（VCC_GT）'],
['SA', 'System Agent', '系統代理：記憶體控制器與 I/O（VCCSA）'],
['TDP', 'Thermal Design Power', '熱設計功耗'],
['ADL-P', 'Alder Lake-P', 'Intel 第 12 代行動處理器（P 系列，含 28W／45W SKU）'],
['ADL-N', 'Alder Lake-N', 'Intel 第 12 代低功耗處理器（N 系列）'],
['RPL-P', 'Raptor Lake-P', 'Intel 第 13 代行動處理器（P 系列）'],
['SP-CAP', 'Specialty Polymer Capacitor (Panasonic)', 'Panasonic 聚合物鋁電解電容系列名稱'],
['POSCAP', 'Polymer Organic Semiconductor Capacitor (Panasonic)', 'Panasonic 導電性高分子鉭電容系列名稱'],
['BGA', 'Ball Grid Array', '球柵陣列封裝'],
['PCB', 'Printed Circuit Board', '印刷電路板'],
['VCC_SENSE', 'Core Voltage Sense (pin)', 'CPU 提供給 VRM 遠端感測電壓的專用腳位'],
['fsw', 'Switching Frequency', '每相開關頻率'],
['fc', 'Crossover Frequency (loop bandwidth)', '控制迴路頻寬'],
['DrMOS', 'Driver-MOSFET', '驅動 IC 與高／低側 MOSFET 整合封裝'],
['SPS', 'Smart Power Stage', '智慧功率級：DrMOS 再整合電流與溫度感測']
];
/* wrap abbreviations in <abbr title> inside the given selectors, and fill a glossary table with the ones found */
function abbrify(tableBox, selectors = '.panel, .lede, footer'){
const found = new Set();
const keys = ABBR.map(a => a[0]).sort((a, b) => b.length - a.length);
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const re = new RegExp('(?<![A-Za-z_])(' + keys.map(esc).join('|') + ')(?![A-Za-z_])', 'g');
const full = Object.fromEntries(ABBR.map(a => [a[0], a]));
document.querySelectorAll(selectors).forEach(root => {
const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {acceptNode: n =>
n.parentElement.closest('abbr, script, style, svg, button, output, #abbrTable, #bigres, #badges, #formulas') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT});
const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
nodes.forEach(n => {
const t = n.nodeValue; re.lastIndex = 0; if (!re.test(t)) return;
re.lastIndex = 0; const frag = document.createDocumentFragment(); let last = 0, m;
while ((m = re.exec(t))){
frag.appendChild(document.createTextNode(t.slice(last, m.index)));
const a = document.createElement('abbr'); a.title = full[m[1]][1] + '｜' + full[m[1]][2]; a.textContent = m[1];
frag.appendChild(a); found.add(m[1]); last = m.index + m[1].length;
}
frag.appendChild(document.createTextNode(t.slice(last))); n.replaceWith(frag);
});
});
if (tableBox) tableBox.innerHTML = '<table class="tbl"><thead><tr><th>縮寫 Abbr.</th><th>完整英文名稱 Full name</th><th>中文說明</th></tr></thead><tbody>' +
ABBR.filter(a => found.has(a[0])).map(a => `<tr><td class="m">${a[0]}</td><td>${a[1]}</td><td>${a[2]}</td></tr>`).join('') + '</tbody></table>';
}
