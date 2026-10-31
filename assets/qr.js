(function () {
'use strict';
var box = document.querySelector('.final-cta .desk-alt');
var btn = document.querySelector('.final-cta a[data-cta="final"]');
if (!box || !btn || !window.matchMedia) return;
var wide = window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)');
var ECC = [0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28];
var BLOCKS = [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8];
function mul(x, y) {
var z = 0;
for (var i = 7; i >= 0; i--) {
z = (z << 1) ^ ((z >>> 7) * 0x11d);
z ^= ((y >>> i) & 1) * x;
}
return z;
}
function rsDivisor(degree) {
var res = [], root = 1, i, j;
for (i = 0; i < degree - 1; i++) res.push(0);
res.push(1);
for (i = 0; i < degree; i++) {
for (j = 0; j < res.length; j++) {
res[j] = mul(res[j], root);
if (j + 1 < res.length) res[j] ^= res[j + 1];
}
root = mul(root, 2);
}
return res;
}
function rsRemainder(data, div) {
var res = div.map(function () { return 0; });
data.forEach(function (b) {
var f = b ^ res.shift();
res.push(0);
for (var i = 0; i < div.length; i++) res[i] ^= mul(div[i], f);
});
return res;
}
function rawModules(v) {
var r = (16 * v + 128) * v + 64;
if (v >= 2) {
var na = Math.floor(v / 7) + 2;
r -= (25 * na - 10) * na - 55;
if (v >= 7) r -= 36;
}
return r;
}
function alignPositions(v, size) {
if (v === 1) return [];
var n = Math.floor(v / 7) + 2;
var step = Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2;
var res = [6];
for (var pos = size - 7; res.length < n; pos -= step) res.splice(1, 0, pos);
return res;
}
var ALNUM = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
function segments(text) {
var segs = [], re = /[0-9A-Z $%*+\-.\/:]{16,}/g, last = 0, m;
while ((m = re.exec(text))) {
if (m.index > last) segs.push({ an: false, s: text.slice(last, m.index) });
segs.push({ an: true, s: m[0] });
last = m.index + m[0].length;
}
if (last < text.length) segs.push({ an: false, s: text.slice(last) });
return segs;
}
function countBits(an, v) { return an ? (v < 10 ? 9 : 11) : (v < 10 ? 8 : 16); }
function codewords(segs) {
var v, cap, need;
for (v = 1; v <= 20; v++) {
cap = (Math.floor(rawModules(v) / 8) - ECC[v] * BLOCKS[v]) * 8;
need = 0;
segs.forEach(function (g) {
var n = g.s.length;
need += 4 + countBits(g.an, v) + (g.an ? 11 * (n >> 1) + 6 * (n & 1) : 8 * n);
});
if (need <= cap) break;
}
if (v > 20) return null;
var bits = [];
function put(val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
segs.forEach(function (g) {
var n = g.s.length, i;
put(g.an ? 2 : 4, 4);
put(n, countBits(g.an, v));
if (g.an) {
for (i = 0; i + 1 < n; i += 2) put(ALNUM.indexOf(g.s.charAt(i)) * 45 + ALNUM.indexOf(g.s.charAt(i + 1)), 11);
if (n & 1) put(ALNUM.indexOf(g.s.charAt(n - 1)), 6);
} else {
for (i = 0; i < n; i++) put(g.s.charCodeAt(i) & 0xff, 8);
}
});
put(0, Math.min(4, cap - bits.length));
put(0, (8 - bits.length % 8) % 8);
for (var pad = 0xec; bits.length < cap; pad ^= 0xec ^ 0x11) put(pad, 8);
var data = [], i, j;
for (i = 0; i < bits.length; i += 8) {
var b = 0;
for (j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
data.push(b);
}
var nb = BLOCKS[v], ec = ECC[v], raw = Math.floor(rawModules(v) / 8);
var nShort = nb - raw % nb, shortLen = Math.floor(raw / nb);
var div = rsDivisor(ec), blocks = [], k = 0;
for (i = 0; i < nb; i++) {
var dat = data.slice(k, k + shortLen - ec + (i < nShort ? 0 : 1));
k += dat.length;
var e = rsRemainder(dat, div);
if (i < nShort) dat.push(0);
blocks.push(dat.concat(e));
}
var out = [];
for (i = 0; i < blocks[0].length; i++) {
for (j = 0; j < nb; j++) {
if (i !== shortLen - ec || j >= nShort) out.push(blocks[j][i]);
}
}
return { v: v, cw: out };
}
function bit(x, i) { return ((x >>> i) & 1) !== 0; }
function masked(k, x, y) {
switch (k) {
case 0: return (x + y) % 2 === 0;
case 1: return y % 2 === 0;
case 2: return x % 3 === 0;
case 3: return (x + y) % 3 === 0;
case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
case 5: return x * y % 2 + x * y % 3 === 0;
case 6: return (x * y % 2 + x * y % 3) % 2 === 0;
default: return ((x + y) % 2 + x * y % 3) % 2 === 0;
}
}
function qrMatrix(text) {
var enc = codewords(segments(text));
if (!enc) return null;
var v = enc.v, n = v * 4 + 17, m = [], fn = [], x, y, i, j, dx, dy;
for (y = 0; y < n; y++) {
m.push([]); fn.push([]);
for (x = 0; x < n; x++) { m[y].push(false); fn[y].push(false); }
}
function set(px, py, dark) { m[py][px] = dark; fn[py][px] = true; }
for (i = 0; i < n; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
[[3, 3], [n - 4, 3], [3, n - 4]].forEach(function (p) {
for (dy = -4; dy <= 4; dy++) {
for (dx = -4; dx <= 4; dx++) {
var d = Math.max(Math.abs(dx), Math.abs(dy)), xx = p[0] + dx, yy = p[1] + dy;
if (xx >= 0 && xx < n && yy >= 0 && yy < n) set(xx, yy, d !== 2 && d !== 4);
}
}
});
var al = alignPositions(v, n), na = al.length;
for (i = 0; i < na; i++) {
for (j = 0; j < na; j++) {
if ((i === 0 && j === 0) || (i === 0 && j === na - 1) || (i === na - 1 && j === 0)) continue;
for (dy = -2; dy <= 2; dy++) {
for (dx = -2; dx <= 2; dx++) set(al[i] + dx, al[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
}
}
}
function format(mask) {
var data = (1 << 3) | mask, rem = data, k;
for (k = 0; k < 10; k++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
var bits = ((data << 10) | rem) ^ 0x5412;
for (k = 0; k <= 5; k++) set(8, k, bit(bits, k));
set(8, 7, bit(bits, 6));
set(8, 8, bit(bits, 7));
set(7, 8, bit(bits, 8));
for (k = 9; k < 15; k++) set(14 - k, 8, bit(bits, k));
for (k = 0; k < 8; k++) set(n - 1 - k, 8, bit(bits, k));
for (k = 8; k < 15; k++) set(8, n - 15 + k, bit(bits, k));
set(8, n - 8, true);
}
format(0);
if (v >= 7) {
var rem = v;
for (i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
var vb = (v << 12) | rem;
for (i = 0; i < 18; i++) {
var a = n - 11 + i % 3, b = Math.floor(i / 3);
set(a, b, bit(vb, i));
set(b, a, bit(vb, i));
}
}
var cw = enc.cw, bi = 0;
for (var right = n - 1; right >= 1; right -= 2) {
if (right === 6) right = 5;
for (var vert = 0; vert < n; vert++) {
for (j = 0; j < 2; j++) {
x = right - j;
y = ((right + 1) & 2) === 0 ? n - 1 - vert : vert;
if (!fn[y][x] && bi < cw.length * 8) {
m[y][x] = bit(cw[bi >>> 3], 7 - (bi & 7));
bi++;
}
}
}
}
function applyMask(k) {
for (y = 0; y < n; y++) {
for (x = 0; x < n; x++) if (!fn[y][x] && masked(k, x, y)) m[y][x] = !m[y][x];
}
}
function penalty() {
var p = 0, dark = 0, t, a, b, run, prev, line, s, at;
for (y = 0; y < n; y++) {
for (x = 0; x < n; x++) {
if (m[y][x]) dark++;
if (x < n - 1 && y < n - 1 && m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) p += 3;
}
}
for (t = 0; t < 2; t++) {
for (a = 0; a < n; a++) {
run = 0; prev = null; line = '';
for (b = 0; b < n; b++) {
var cell = t ? m[b][a] : m[a][b];
line += cell ? '1' : '0';
if (cell === prev) { run++; if (run === 5) p += 3; else if (run > 5) p++; }
else { run = 1; prev = cell; }
}
s = '0000' + line + '0000';
for (at = s.indexOf('1011101'); at >= 0; at = s.indexOf('1011101', at + 1)) {
if (s.slice(at - 4, at) === '0000' || s.slice(at + 7, at + 11) === '0000') p += 40;
}
}
}
return p + Math.max(0, Math.ceil(Math.abs(dark * 20 - n * n * 10) / (n * n)) - 1) * 10;
}
var best = 0, bestP = Infinity;
for (var k = 0; k < 8; k++) {
applyMask(k);
format(k);
var p = penalty();
if (p < bestP) { bestP = p; best = k; }
applyMask(k);
}
applyMask(best);
format(best);
return m;
}
function qrUrl() {
var u;
try { u = new URL(btn.getAttribute('href'), location.href); } catch (e) { return null; }
var text = u.searchParams.get('text') || '';
var at = text.search(/\. Я [сз] krepko\.es\//);
if (at < 0) return null;
var msg = (box.getAttribute('data-hi') || '') + text.slice(at);
return 'https://wa.me' + u.pathname + '?text=' + encodeURIComponent(msg).replace(/%2F/g, '/');
}
function svg(m) {
var n = m.length, q = 1, d = '';
for (var y = 0; y < n; y++) {
for (var x = 0; x < n; x++) {
if (!m[y][x]) continue;
var w = 1;
while (x + w < n && m[y][x + w]) w++;
d += 'M' + (x + q) + ' ' + (y + q) + 'h' + w + 'v1h-' + w + 'z';
x += w - 1;
}
}
var s = n + 2 * q;
return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + s + ' ' + s +
'" shape-rendering="crispEdges" focusable="false"><path fill="currentColor" d="' + d + '"/></svg>';
}
function draw() {
if (!wide.matches || box.classList.contains('is-on')) return;
var url = qrUrl();
var m = url && qrMatrix(url);
if (!m) return;
var code = document.createElement('span');
code.className = 'desk-alt__qr';
code.setAttribute('aria-hidden', 'true');
code.innerHTML = svg(m);
var note = document.createElement('span');
note.className = 'desk-alt__t';
note.textContent = box.getAttribute('data-t') || '';
box.appendChild(code);
box.appendChild(note);
box.hidden = false;
box.classList.add('is-on');
}
draw();
if (wide.addEventListener) wide.addEventListener('change', draw);
else if (wide.addListener) wide.addListener(draw);
})();
