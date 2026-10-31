(function () {
'use strict';
var root = document.documentElement;
var LANG = ((root && root.getAttribute('lang')) || '').slice(0, 2);
var UK = LANG === 'uk';
var ES = LANG === 'es';
var STOP = {};
('на для при про под над без из от до за по как что где или и а но это ' +
'мне мой моя мои все еще уже там тут его ее их не да ' +
'хочу хочет хотим нужно нужен нужна нужны надо необходимо требуется ' +
'подскажите помогите скажите вопрос ситуация случай ' +
'испания испании испанию испанией')
.split(' ').forEach(function (w) { STOP[w] = 1; });
if (UK) {
('із зі від під над про для без як що де або та але це мені мій моя мої ' +
'всі все ще вже там тут його її їх не так чи коли ' +
'хочу хоче хочемо треба потрібно потрібен потрібна потрібні необхідно ' +
'підкажіть допоможіть скажіть питання ситуація випадок ' +
'іспанія іспанії іспанію іспанією')
.split(' ').forEach(function (w) { STOP[w] = 1; });
}
if (ES) {
('de del la las el los lo un una unos unas y e o u a al en con por para ante ' +
'su sus mi mis que como sobre necesito quiero españa')
.split(' ').forEach(function (w) { STOP[w] = 1; });
}
var SUFFIXES = ['иями', 'ями', 'ами', 'ого', 'его', 'ому', 'ему', 'ыми', 'ими',
'ах', 'ях', 'ов', 'ев', 'ей', 'ий', 'ый', 'ая', 'яя', 'ое', 'ее', 'ую', 'юю',
'ам', 'ям', 'ом', 'ем', 'ы', 'и', 'а', 'я', 'о', 'е', 'у', 'ю', 'ь', 'й'];
if (UK) {
SUFFIXES = ['иями', 'ього', 'ьому',
'ями', 'ами', 'ого', 'его', 'ому', 'ему', 'ыми', 'ими', 'іми', 'ові', 'еві', 'єві',
'ах', 'ях', 'ов', 'ев', 'ей', 'ий', 'ый', 'ая', 'яя', 'ое', 'ее', 'ую', 'юю',
'ам', 'ям', 'ом', 'ем', 'єм', 'ою', 'ею', 'єю', 'ої', 'ій', 'ім', 'ів', 'їв',
'их', 'іх', 'им',
'ы', 'и', 'і', 'ї', 'а', 'я', 'о', 'е', 'є', 'у', 'ю', 'ь', 'й'];
}
var LATIN = { 'á': 'a', 'à': 'a', 'â': 'a', 'ä': 'a', 'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i', 'ó': 'o', 'ò': 'o', 'ô': 'o', 'ö': 'o',
'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u', 'ñ': 'n', 'ç': 'c' };
function norm(s) {
return (s || '').toLowerCase().replace(/ё/g, 'е').replace(/['’ʼ`]/g, '')
.replace(/[áàâäéèêëíìîïóòôöúùûüñç]/g, function (c) { return LATIN[c]; });
}
function stem(w) {
for (var i = 0; i < SUFFIXES.length; i++) {
var s = SUFFIXES[i];
if (w.length - s.length >= 4 && w.slice(-s.length) === s) {
w = w.slice(0, w.length - s.length);
break;
}
}
if (UK && w.length >= 6 && w.slice(-3) === 'іст') {
w = w.slice(0, -3) + 'ост';
}
return w;
}
function tokenize(s) {
var parts = norm(s).split(/[^0-9a-zа-яіїєґ]+/);
var out = [];
for (var i = 0; i < parts.length; i++) {
if (parts[i].length >= 2 && !STOP[parts[i]]) out.push(parts[i]);
}
return out;
}
function stems(s) { return tokenize(s).map(stem); }
var TR_PAIRS = [
['shch','щ'], ['sch','щ'], ['yo','ё'], ['zh','ж'], ['kh','х'], ['ts','ц'],
['ch','ч'], ['sh','ш'], ['yu','ю'], ['ya','я'], ['ye','е'], ['iy','ий'],
['a','а'], ['b','б'], ['v','в'], ['g','г'], ['d','д'], ['e','е'],
['z','з'], ['i','и'], ['j','й'], ['k','к'], ['l','л'], ['m','м'],
['n','н'], ['o','о'], ['p','п'], ['r','р'], ['s','с'], ['t','т'],
['u','у'], ['f','ф'], ['h','х'], ['c','к'], ['y','ы'], ['w','в'],
['x','кс'], ['q','к'], ["'", ''], ['`', '']
];
function translit(w) {
if (!/^[a-z']+$/.test(w)) return '';
var out = w;
for (var i = 0; i < TR_PAIRS.length; i++) {
out = out.split(TR_PAIRS[i][0]).join(TR_PAIRS[i][1]);
}
return out === w ? '' : out;
}
function near(a, b) {
if (a === b) return true;
var la = a.length, lb = b.length;
if (Math.abs(la - lb) > 1) return false;
var i = 0, j = 0, diff = 0;
while (i < la && j < lb) {
if (a.charAt(i) === b.charAt(j)) { i++; j++; continue; }
if (++diff > 1) return false;
if (la > lb) i++;
else if (lb > la) j++;
else { i++; j++; }
}
return diff + (la - i) + (lb - j) <= 1;
}
function prepare(e) {
if (e._ready) return;
e._ready = 1;
e._title = norm(e.t);
e._ts = stems(e.t);
e._cs = stems(e.c || '');
e._ks = stems(e.k || '');
e._kcs = stems(e.kc || '');
}
function tokenScore(e, raw) {
var qs = stem(raw), i;
if (e._title.indexOf(raw) === 0) return 120;
for (i = 0; i < e._ts.length; i++) {
if (e._ts[i] === qs) return 80;
if (e._ts[i].indexOf(qs) === 0) return 62;
}
if (e._title.indexOf(raw) !== -1) return 45;
for (i = 0; i < e._cs.length; i++) {
if (e._cs[i].indexOf(qs) === 0) return 32;
}
for (i = 0; i < e._ks.length; i++) {
if (e._ks[i] === qs) return 26;
if (e._ks[i].indexOf(qs) === 0) return 18;
}
for (i = 0; i < e._kcs.length; i++) {
if (e._kcs[i] === qs) return 14;
if (e._kcs[i].indexOf(qs) === 0) return 10;
}
if (qs.length >= 5) {
for (i = 0; i < e._ts.length; i++) if (near(e._ts[i], qs)) return 8;
for (i = 0; i < e._ks.length; i++) if (near(e._ks[i], qs)) return 5;
}
var ru = translit(raw);
if (ru && ru !== raw) {
var s = tokenScore(e, ru);
if (s) return Math.max(4, Math.round(s * 0.7));
}
return 0;
}
function collect(pool, toks, minMatched) {
var hits = [];
for (var i = 0; i < pool.length; i++) {
var e = pool[i];
prepare(e);
var total = 0, matched = 0;
for (var j = 0; j < toks.length; j++) {
var s = tokenScore(e, toks[j]);
if (s) { matched++; total += s; }
}
if (matched >= minMatched) hits.push({ e: e, s: total, n: matched });
}
hits.sort(function (a, b) {
return b.n - a.n || b.s - a.s || a.e.t.length - b.e.t.length;
});
return hits.slice(0, 12).map(function (h) { return h.e; });
}
function search(pool, query, toks) {
if (!toks.length) return [];
var strict = collect(pool, toks, toks.length);
if (strict.length || toks.length < 2) return strict;
return collect(pool, toks, 1);
}
function highlight(text, toks) {
var qs = toks.map(stem);
var spans = [];
var re = /[0-9A-Za-zÀ-ÖØ-öø-ÿА-Яа-яЁёІіЇїЄєҐґ'’ʼ`]+/g, m;
while ((m = re.exec(text)) !== null) {
var word = norm(m[0]), ws = stem(word), len = 0;
var apo = word.length !== m[0].length;
for (var i = 0; i < toks.length; i++) {
if (word.indexOf(toks[i]) === 0) len = Math.max(len, apo ? m[0].length : toks[i].length);
else if (ws.length >= 4 && (ws.indexOf(qs[i]) === 0 || qs[i].indexOf(ws) === 0)) {
len = Math.max(len, m[0].length);
}
}
if (len) spans.push([m.index, m.index + Math.min(len, m[0].length)]);
}
var frag = document.createDocumentFragment();
if (!spans.length) {
frag.appendChild(document.createTextNode(text));
return frag;
}
spans.sort(function (a, b) { return a[0] - b[0]; });
var pos = 0;
for (var k = 0; k < spans.length; k++) {
if (spans[k][0] < pos) continue;
if (spans[k][0] > pos) {
frag.appendChild(document.createTextNode(text.slice(pos, spans[k][0])));
}
var mark = document.createElement('mark');
mark.textContent = text.slice(spans[k][0], spans[k][1]);
frag.appendChild(mark);
pos = spans[k][1];
}
if (pos < text.length) frag.appendChild(document.createTextNode(text.slice(pos)));
return frag;
}
function find(index, query) {
var q = String(query || '').trim();
var toks = tokenize(q);
if (!toks.length && norm(q).length >= 2) toks = [norm(q)];
if (!index || q.length < 2) return { toks: toks, services: [], blog: [] };
return {
toks: toks,
services: search(index.services || [], q, toks),
blog: ES ? [] : search(index.blog || [], q, toks)
};
}
window.krepkoSearch = { find: find, tokenize: tokenize, stem: stem };
var dlg = document.getElementById('site-search-dialog');
if (!dlg || !window.fetch || typeof dlg.showModal !== 'function') return;
var panel = dlg.querySelector('.site-search__panel');
var bar = dlg.querySelector('.site-search__bar');
var drop = dlg.querySelector('.site-search__drop');
var input = dlg.querySelector('.site-search__input');
var start = dlg.querySelector('.site-search__start');
var list = dlg.querySelector('.site-search__results');
var none = dlg.querySelector('.site-search__none');
var noneH = none && none.querySelector('.site-search__none-h');
var noneWa = none && none.querySelector('.site-search__wa');
var empty = dlg.querySelector('.site-search__empty');
var ruNote = dlg.querySelector('.site-search__ru-note');
var tpl = dlg.querySelector('template.site-search__tpl');
var groupTpl = tpl && tpl.content ? tpl.content.querySelector('.site-search__group') : null;
var allTpl = tpl && tpl.content ? tpl.content.querySelector('.site-search__all') : null;
var WA_Q = dlg.getAttribute('data-wa-q') || '';
var NONE = dlg.getAttribute('data-none') || '';
var desk = window.matchMedia ? window.matchMedia('(min-width: 900px)') : { matches: false };
var MAX_ROWS = 7;
var MAX_ARTICLES = 2;
var index = null;
var cursor = -1;
var trigger = null;
var SVG = 'http://www.w3.org/2000/svg';
function chevron() {
var s = document.createElementNS(SVG, 'svg');
s.setAttribute('viewBox', '0 0 24 24');
s.setAttribute('fill', 'none');
s.setAttribute('stroke', 'currentColor');
s.setAttribute('stroke-width', '1.8');
s.setAttribute('stroke-linecap', 'round');
s.setAttribute('stroke-linejoin', 'round');
s.setAttribute('aria-hidden', 'true');
var p = document.createElementNS(SVG, 'path');
p.setAttribute('d', 'M9 6l6 6-6 6');
s.appendChild(p);
return s;
}
function row(h, toks, withCat) {
var li = document.createElement('li');
var a = document.createElement('a');
a.href = h.u;
var t = document.createElement('span');
t.appendChild(highlight(h.t, toks));
if (withCat && h.c && h.c !== 'Направление' && h.c !== 'Напрям') {
var c = document.createElement('small');
c.textContent = h.c;
t.appendChild(c);
}
a.appendChild(t);
a.appendChild(chevron());
li.appendChild(a);
return li;
}
var MARKER = /\. (Я [сз]|Vengo de) [Kk]repko\.es.*$/;
function waHref(q) {
if (!noneWa) return '';
if (noneWa._def == null) noneWa._def = noneWa.getAttribute('href') || '';
var def = noneWa._def;
var m = /([?&]text=)([^&#]*)/.exec(def);
if (!WA_Q || !m) return def;
var text;
try { text = decodeURIComponent(m[2]); } catch (e) { return def; }
var cut = text.indexOf('\n\n');
var src = (text.indexOf('Источник:') === 0 && cut > 0) ? text.slice(0, cut + 2) : '';
var tail = MARKER.exec(text);
var next = src + WA_Q.replace('{q}', q) + (tail ? tail[0] : '');
return def.slice(0, m.index) + m[1] + encodeURIComponent(next) + def.slice(m.index + m[0].length);
}
function setSearchWa(on) {
if (on) root.setAttribute('data-search-wa', '');
else root.removeAttribute('data-search-wa');
}
function render() {
var q = input.value.trim();
var res = find(index, q);
var typing = q.length >= 2;
list.textContent = '';
cursor = -1;
if (start) start.hidden = typing;
var nBlog = Math.min(res.blog.length, groupTpl ? MAX_ARTICLES : 0);
var nSvc = Math.min(res.services.length, MAX_ROWS - nBlog);
if (groupTpl) nBlog = Math.min(res.blog.length, MAX_ROWS - nSvc);
res.services.slice(0, nSvc).forEach(function (h) { list.appendChild(row(h, res.toks, true)); });
if (nBlog) {
list.appendChild(groupTpl.cloneNode(true));
res.blog.slice(0, nBlog).forEach(function (h) { list.appendChild(row(h, res.toks, false)); });
}
if (nSvc && allTpl) {
var all = allTpl.cloneNode(true);
var link = all.querySelector('a');
var base = (link.getAttribute('href') || '/services/').split('?')[0];
link.setAttribute('href', base + '?q=' + encodeURIComponent(q));
list.appendChild(all);
}
list.hidden = !list.children.length;
var nothing = typing && !!index && !nSvc && !nBlog;
if (none) {
none.hidden = !nothing;
if (nothing) {
if (noneH) noneH.textContent = NONE.replace('{q}', q);
if (noneWa) noneWa.setAttribute('href', waHref(q));
}
}
if (empty) empty.hidden = !nothing;
if (ruNote) ruNote.hidden = nothing || !list.children.length;
setSearchWa(nothing && !!none && dlg.open);
fit();
}
var ANCHOR = /\b(site-nav__field|hm-find__field)\b/;
function fieldRect(el) {
if (!el || !el.getBoundingClientRect) return null;
var r = el.getBoundingClientRect();
if (!r.width || !r.height || r.bottom <= 0 || r.top >= window.innerHeight) return null;
var cs = window.getComputedStyle(el);
if (cs.visibility === 'hidden') return null;
return r;
}
function visibleField() {
var fields = document.querySelectorAll('.site-nav__field');
for (var i = 0; i < fields.length; i++) {
var r = fieldRect(fields[i]);
if (r) return r;
}
return null;
}
function place() {
if (!desk.matches) return;
var f = (trigger && ANCHOR.test(trigger.className) && fieldRect(trigger)) || visibleField();
var vw = document.documentElement.clientWidth || window.innerWidth;
var fw = f ? f.width : Math.min(560, vw - 32);
var w = Math.min(Math.max(fw, 480), vw - 32);
var fx = f ? f.left : (vw - w) / 2;
var left = Math.max(16, Math.min(fx, vw - 16 - w));
var top = f ? f.top : 80;
panel.style.setProperty('--ss-top', Math.round(top) + 'px');
panel.style.setProperty('--ss-left', Math.round(left) + 'px');
panel.style.setProperty('--ss-w', Math.round(w) + 'px');
panel.style.setProperty('--ss-field-x', Math.round(fx - left) + 'px');
panel.style.setProperty('--ss-field-w', Math.round(Math.min(fw, w)) + 'px');
panel.style.setProperty('--ss-field-h', Math.round(f ? f.height : 44) + 'px');
}
function fit() {
if (!desk.matches || !dlg.open || list.hidden) return;
var limit = window.innerHeight - 16;
function over() {
return drop.getBoundingClientRect().bottom > limit || drop.scrollHeight > drop.clientHeight + 1;
}
for (var guard = 0; guard < 20 && over(); guard++) {
var rows = list.querySelectorAll('li:not(.site-search__all):not(.site-search__group)');
if (rows.length <= 1) break;
var lastRow = rows[rows.length - 1];
var prev = lastRow.previousElementSibling;
lastRow.parentNode.removeChild(lastRow);
if (prev && prev.classList.contains('site-search__group')) {
var next = prev.nextElementSibling;
if (!next || next.classList.contains('site-search__all')) prev.parentNode.removeChild(prev);
}
}
}
var loading = null;
function load() {
if (index) return Promise.resolve(index);
if (!loading) {
loading = fetch(UK ? '/search-index.uk.json' : '/search-index.json')
.then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
.then(function (data) { index = data; return data; })
.catch(function () { loading = null; return index; });
}
return loading;
}
function open(from) {
trigger = from || null;
input.value = '';
dlg.classList.remove('is-shown');
place();
render();
dlg.showModal();
void dlg.offsetWidth;
dlg.classList.add('is-shown');
load().then(render);
try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); }
setTimeout(function () { input.focus(); }, 50);
}
dlg.addEventListener('close', function () {
dlg.classList.remove('is-shown');
setSearchWa(false);
});
function links() {
return [].filter.call(drop.querySelectorAll('a'), function (a) {
return a.offsetParent !== null && !a.classList.contains('site-search__wa');
});
}
function setCursor(next) {
var items = links();
if (!items.length) { cursor = -1; return; }
if (next < 0) next = items.length - 1;
if (next >= items.length) next = 0;
items.forEach(function (a, i) { a.classList.toggle('is-active', i === next); });
cursor = next;
}
dlg.addEventListener('keydown', function (e) {
if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(cursor + 1); }
else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(cursor - 1); }
else if (e.key === 'Enter' && e.target === input) {
var items = links();
var a = items[cursor] || (input.value.trim().length >= 2 ? items[0] : null);
if (a) { e.preventDefault(); window.location.href = a.getAttribute('href'); }
}
});
input.addEventListener('input', function () {
if (!index) { load().then(render); return; }
render();
});
dlg.addEventListener('click', function (e) {
if (e.target === dlg) dlg.close();
});
var closeBtn = dlg.querySelector('.site-search__close');
if (closeBtn) closeBtn.addEventListener('click', function () { dlg.close(); });
[].forEach.call(document.querySelectorAll('[data-open-search]'), function (btn) {
btn.addEventListener('click', function (e) {
e.preventDefault();
var menu = document.getElementById('site-menu-dialog');
if (menu && menu.open) menu.close();
open(btn);
});
});
document.addEventListener('keydown', function (e) {
if (dlg.open) return;
var tag = (document.activeElement && document.activeElement.tagName) || '';
if (tag === 'INPUT' || tag === 'TEXTAREA') return;
if (e.key === '/' || ((e.metaKey || e.ctrlKey) && (e.key || '').toLowerCase() === 'k')) {
e.preventDefault();
open(null);
}
});
function realign() { if (dlg.open) { place(); render(); } }
window.addEventListener('resize', realign);
window.addEventListener('scroll', function () { if (dlg.open && desk.matches) place(); }, { passive: true });
})();
