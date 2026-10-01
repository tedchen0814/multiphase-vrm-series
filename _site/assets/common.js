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
['Icc_max', 'Maximum Core Current (ICCMAX)', '電源軌允許的最大電流'],
['VCC_CORE', 'Core Supply Voltage rail', 'CPU 核心電源軌'],
['VCC_GT', 'Graphics Supply Voltage rail', '內顯電源軌'],
['VCCSA', 'System Agent Supply Voltage rail', '系統代理電源軌'],
['VCCIN_AUX', 'Auxiliary Input Voltage rail', '輔助輸入電源軌，供晶片內部再轉換'],
['NTC', 'Negative Temperature Coefficient thermistor', '負溫度係數熱敏電阻，用於 DCR 溫度補償'],
['IMON', 'Current Monitor', '電流監控輸出訊號'],
['OCP', 'Over-Current Protection', '過電流保護'],
['OTP', 'Over-Temperature Protection', '過溫保護'],
['TMON', 'Temperature Monitor', '溫度監控輸出訊號'],
['QFN', 'Quad Flat No-lead package', '無引腳方形扁平封裝'],
['EMI', 'Electromagnetic Interference', '電磁干擾'],
['Qrr', 'Reverse Recovery Charge', '體二極體反向恢復電荷'],
['VCLK', 'SVID Clock', 'SVID 時脈線'],
['VDIO', 'SVID Data Input/Output', 'SVID 資料線'],
['ALERT#', 'Alert (active low)', 'SVID 警示線，VR 通知 CPU 狀態改變'],
['FIVR', 'Fully Integrated Voltage Regulator', 'Intel 晶片內整合穩壓器'],
['LDO', 'Low-Dropout Regulator', '低壓差線性穩壓器'],
['PDG', 'Platform Design Guide', 'Intel 平台設計指南（NDA 文件）'],
['EDS', 'External Design Specification', 'Intel 外部設計規格（NDA 文件）'],
['NDA', 'Non-Disclosure Agreement', '保密協議'],
['SVI2', 'Serial VID Interface 2', 'AMD 的 CPU–VRM 介面第 2 版'],
['SVI3', 'Serial VID Interface 3', 'AMD 的 CPU–VRM 介面第 3 版'],
['VRTT', 'Voltage Regulator Test Tool', 'Intel VR 負載暫態測試工具'],
['PGND', 'Power Ground', '功率地'],
['VR', 'Voltage Regulator', '電壓調節器，Intel 文件中指一個電源軌的穩壓電路'],
['MTL', 'Meteor Lake', 'Intel Core Ultra（第一代）平台代號'],
['ADL', 'Alder Lake', 'Intel 第 12 代平台代號'],
['RPL', 'Raptor Lake', 'Intel 第 13 代平台代號'],
['G-NAVP', 'Green Native Adaptive Voltage Positioning', 'Richtek 專有 AVP 控制架構'],
['R3', 'Robust Ripple Regulator', 'Renesas 專有調變架構'],
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
['SPS', 'Smart Power Stage', '智慧功率級：DrMOS 再整合電流與溫度感測'],
['Coss', 'Output Capacitance (of a MOSFET)', 'MOSFET 輸出電容，每次切換都要充放電'],
['DEM', 'Diode Emulation Mode', '二極體模擬模式：電感電流降到零就關低側，等同 DCM'],
['PS0', 'Power State 0', 'SVID 電源狀態 0：所有相全開'],
['PS1', 'Power State 1', 'SVID 電源狀態 1：只留一相'],
['PS2', 'Power State 2', 'SVID 電源狀態 2：單相二極體模擬（DCM）'],
['PS3', 'Power State 3', 'SVID 電源狀態 3：降低 VID、控制器低靜態電流'],
['PS4', 'Power State 4', 'SVID 電源狀態 4：最低功耗狀態'],
['PL1', 'Power Limit 1', 'Intel 長時間功耗上限（約等於 TDP）'],
['PL2', 'Power Limit 2', 'Intel 短時間（數十秒）功耗上限'],
['DCR', 'DC Resistance', '電感直流電阻'],
['I2C', 'Inter-Integrated Circuit', '雙線序列匯流排'],
['Qg', 'Gate Charge', 'MOSFET 閘極電荷'],
['SPM', 'Smart Phase Management', 'Richtek 的自動加減相功能（可經 I2C 設定門檻）']
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
/* ---------- per-phase buck loss model (shared by stations 01 and 06) ----------
p: {vin, vout, fsw kHz, L nH, rhs, rls, dcr mΩ, tsw ns (each edge), qg nC (HS+LS), vdrv V, coss pF, tdt ns, pq W}
N phases sharing I amps; dcm = allow diode emulation (pulse skipping) when the phase current is below ΔI/2 */
function buckLoss(p, N, I, dcm = false){
const f = p.fsw * 1e3, D = p.vout / p.vin, Iph = I / N;
const dI = (p.vin - p.vout) * D / (p.L * 1e-9 * f);
const Rpath = (D * p.rhs + (1 - D) * p.rls + p.dcr) * 1e-3;
let k = 1, irms2, iOff, iOn;
if (dcm && Iph < dI / 2){           // DCM: triangular pulses of peak dI, fired k·fsw times per second
k = Math.max(1e-6, 2 * Iph / dI);
irms2 = k * dI * dI / 3; iOff = dI; iOn = 0;
} else {
irms2 = Iph * Iph + dI * dI / 12; iOff = Iph + dI / 2; iOn = Math.max(0, Iph - dI / 2);
}
const fe = k * f;
const ph = {
cond: irms2 * Rpath,
sw: 0.5 * p.vin * (iOff + iOn) * p.tsw * 1e-9 * fe,
gate: p.qg * 1e-9 * p.vdrv * fe,
coss: 0.5 * p.coss * 1e-12 * p.vin * p.vin * fe,
dead: 0.7 * p.tdt * 1e-9 * fe * (iOff + Math.abs(Iph - dI / 2) * (k < 1 ? 0 : 1)),
q: p.pq
};
ph.total = ph.cond + ph.sw + ph.gate + ph.coss + ph.dead + ph.q;
const tot = {}; for (const key in ph) tot[key] = ph[key] * N;
const pout = p.vout * I;
return {N, I, Iph, D, dI, k, fe, dcm: k < 1, ph, tot, pout, eff: pout / (pout + tot.total), ton: D / f};
}
const LOSS_PARTS = [
['cond', '導通損耗 I²R', 'Conduction', 'var(--p1)'],
['sw', '切換損耗', 'Switching (V·I overlap)', 'var(--p2)'],
['gate', '閘極驅動', 'Gate drive Qg·V·f', 'var(--p3)'],
['coss', 'Coss 充放電', 'Output capacitance', 'var(--p5)'],
['dead', '死區體二極體', 'Dead-time body diode', 'var(--p6)'],
['q', '靜態損耗', 'Quiescent', 'var(--muted)']
];
