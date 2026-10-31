(function () {
var nav = document.querySelector('.pillar-nav');
if (!nav) return;
var toggle = nav.querySelector('.pillar-nav__toggle');
if (toggle) {
toggle.addEventListener('click', function () {
var open = nav.classList.toggle('is-open');
toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
});
}
var cats = [].slice.call(nav.querySelectorAll('.pillar-cat'));
function closeOtherCats(keep) {
cats.forEach(function (c) {
if (c === keep || !c.classList.contains('is-open')) return;
c.classList.remove('is-open');
var h = c.querySelector('.pillar-cat__head');
if (h) h.setAttribute('aria-expanded', 'false');
});
}
var docMq = window.matchMedia ? window.matchMedia('(max-width: 899px)') : null;
var isDocPage = !!document.querySelector('.pillar-split--doc:not(.pillar-split--city)');
function headIsLabel() { return isDocPage && docMq && docMq.matches; }
function applyHeadMode() {
cats.forEach(function (cat) {
var head = cat.querySelector('.pillar-cat__head');
if (!head) return;
if (headIsLabel()) {
head.setAttribute('tabindex', '-1');
head.removeAttribute('aria-expanded');
} else {
head.removeAttribute('tabindex');
head.setAttribute('aria-expanded', cat.classList.contains('is-open') ? 'true' : 'false');
}
});
}
applyHeadMode();
if (docMq && docMq.addEventListener) docMq.addEventListener('change', applyHeadMode);
[].forEach.call(nav.querySelectorAll('.pillar-cat__more'), function (btn) {
btn.addEventListener('click', function () {
var cat = btn.closest('.pillar-cat');
if (cat) cat.classList.remove('is-compact');
});
});
cats.forEach(function (cat) {
var head = cat.querySelector('.pillar-cat__head');
if (!head) return;
head.addEventListener('click', function () {
if (headIsLabel()) return;
var open = !cat.classList.contains('is-open');
if (open) closeOtherCats(cat);
cat.classList.toggle('is-open', open);
head.setAttribute('aria-expanded', open ? 'true' : 'false');
});
});
function goToCat(slug) {
if (!/^[a-z-]+$/.test(slug)) return;
var cat = nav.querySelector('.pillar-cat[data-cat="' + slug + '"]');
if (!cat) return;
closeOtherCats(cat);
cat.classList.add('is-open');
var head = cat.querySelector('.pillar-cat__head');
if (head) head.setAttribute('aria-expanded', 'true');
nav.classList.add('is-open');
if (toggle) toggle.setAttribute('aria-expanded', 'true');
var noAnim = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
setTimeout(function () {
cat.scrollIntoView({ block: 'start', behavior: noAnim ? 'auto' : 'smooth' });
setTimeout(function () {
cat.classList.remove('is-hilite');
void cat.offsetWidth;
cat.classList.add('is-hilite');
setTimeout(function () { cat.classList.remove('is-hilite'); }, 2100);
}, noAnim ? 60 : 480);
}, 80);
}
goToCat((location.hash || '').slice(1));
window.addEventListener('hashchange', function () {
goToCat((location.hash || '').slice(1));
});
(function flashCurrentCat() {
if (location.hash) return;
var cur = nav.querySelector('.pillar-nav__current');
if (!cur) return;
var cat = cur.closest('.pillar-cat');
if (!cat) return;
var from = document.referrer;
if (from) {
try {
var sameSection = new URL(from).pathname.indexOf(
location.pathname.split('/').slice(0, 2).join('/') + '/'
) === 0;
if (sameSection) return;
} catch (e) { }
}
setTimeout(function () {
cat.classList.add('is-hilite');
setTimeout(function () { cat.classList.remove('is-hilite'); }, 2100);
}, 260);
})();
var input = document.getElementById('pillar-search');
var empty = document.getElementById('pillar-search-empty');
if (!input) return;
var opened = cats.filter(function (c) { return c.classList.contains('is-open'); });
var LATIN = { 'á': 'a', 'à': 'a', 'â': 'a', 'ä': 'a', 'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i', 'ó': 'o', 'ò': 'o', 'ô': 'o', 'ö': 'o',
'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u', 'ñ': 'n', 'ç': 'c' };
function norm(s) {
return (s || '').toLowerCase().replace(/ё/g, 'е').replace(/['’ʼ`]/g, '')
.replace(/[áàâäéèêëíìîïóòôöúùûüñç]/g, function (c) { return LATIN[c]; });
}
function loose(q) {
var t = q.replace(/[аяоеєуюіїиыьй]$/, '');
return t.length >= 3 ? t : q;
}
function reset() {
cats.forEach(function (cat) {
cat.hidden = false;
cat.classList.toggle('is-open', opened.indexOf(cat) !== -1);
var head = cat.querySelector('.pillar-cat__head');
if (head) head.setAttribute('aria-expanded', cat.classList.contains('is-open') ? 'true' : 'false');
[].forEach.call(cat.querySelectorAll('li'), function (li) { li.hidden = false; });
});
if (empty) empty.hidden = true;
}
input.addEventListener('input', function () {
[].forEach.call(nav.querySelectorAll('.pillar-cat.is-compact'), function (c) { c.classList.remove('is-compact'); });
var q = norm(input.value.trim());
if (q.length < 2) { reset(); return; }
var stem = loose(q);
var found = 0;
cats.forEach(function (cat) {
var hits = 0;
[].forEach.call(cat.querySelectorAll('li'), function (li) {
var text = norm(li.textContent);
var match = text.indexOf(q) !== -1 ||
(stem !== q && (' ' + text.replace(/[^0-9a-zа-яіїєґ]+/g, ' ')).indexOf(' ' + stem) !== -1);
li.hidden = !match;
if (match) hits++;
});
cat.hidden = hits === 0;
cat.classList.toggle('is-open', hits > 0);
var head = cat.querySelector('.pillar-cat__head');
if (head) head.setAttribute('aria-expanded', hits > 0 ? 'true' : 'false');
found += hits;
});
if (empty) empty.hidden = found > 0;
});
})();
(function () {
var steps = document.querySelector('.pillar-steps');
if (!steps) return;
if (document.body.hasAttribute('data-quiet')) return;
var items = [].slice.call(steps.querySelectorAll('li'));
if (!items.length) return;
var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduce) {
items.forEach(function (li) {
li.style.setProperty('--seg', 1);
li.classList.add('is-on');
});
return;
}
var segs = Math.max(items.length - 1, 1);
var queued = false;
function update() {
queued = false;
var r = steps.getBoundingClientRect();
var vh = window.innerHeight || document.documentElement.clientHeight;
if (!vh) return;
var start = vh * 0.86;
var end = vh * 0.32;
var p = (start - r.top) / (start - end);
p = p < 0 ? 0 : (p > 1 ? 1 : p);
items.forEach(function (li, i) {
if (i < segs) {
var s = p * segs - i;
s = s < 0 ? 0 : (s > 1 ? 1 : s);
li.style.setProperty('--seg', s.toFixed(3));
}
var on = i === 0 ? p > 0.01 : p >= i / segs;
li.classList[on ? 'add' : 'remove']('is-on');
});
}
function schedule() {
if (queued) return;
queued = true;
if (window.requestAnimationFrame) window.requestAnimationFrame(update);
else setTimeout(update, 16);
}
window.addEventListener('scroll', schedule, { passive: true });
window.addEventListener('resize', schedule, { passive: true });
update();
})();
(function () {
var nav = document.querySelector('.pillar-nav');
if (!nav) return;
var mq = window.matchMedia ? window.matchMedia('(min-width: 900px)') : null;
var TOP = 112, GAP = 24;
function fit() {
var ok = (!mq || mq.matches) && nav.offsetHeight <= window.innerHeight - TOP - GAP;
nav.classList.toggle('is-sticky', ok);
}
fit();
window.addEventListener('resize', fit, { passive: true });
if ('ResizeObserver' in window) { new ResizeObserver(fit).observe(nav); }
else { nav.addEventListener('click', function () { setTimeout(fit, 350); }); }
})();
(function () {
var svg = document.querySelector('.cmap .cmap__svg');
if (!svg || svg.parentNode.querySelector('.cmap__row')) return;
if (document.querySelector('.pillar-split[data-svc-layout]')) return;
var row = document.createElement('p');
row.className = 'cmap__row';
[].forEach.call(svg.querySelectorAll('.cmap__city'), function (city) {
var label = city.querySelector('.cmap__label');
var name = label ? label.textContent.trim() : '';
if (!name) return;
var href = city.getAttribute('href');
var el = document.createElement(href ? 'a' : 'span');
if (href) el.setAttribute('href', href);
else el.setAttribute('aria-current', 'page');
el.textContent = name;
row.appendChild(el);
});
if (row.children.length) svg.parentNode.insertBefore(row, svg.nextSibling);
})();
