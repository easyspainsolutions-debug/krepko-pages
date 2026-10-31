(function(){
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
var els = Array.prototype.filter.call(
document.querySelectorAll('.reveal, .timeline-item, .anim'),
function(el){ return !el.closest || !el.closest('[data-anim-group]'); }
);
if (!('IntersectionObserver' in window)) { els.forEach(function(e){e.classList.add('is-visible');}); return; }
var io = new IntersectionObserver(function(entries){
entries.forEach(function(entry){
if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
});
}, {threshold: 0.12, rootMargin: '0px 0px -40px 0px'});
els.forEach(function(e){ io.observe(e); });
})();
(function(){
var hero = document.querySelector('.hero--home');
var ticker = document.querySelector('.ticker');
if (!hero || !ticker) return;
var mqD = window.matchMedia('(min-width: 900px)');
function fit(){
if (window.innerWidth <= 720) { hero.style.minHeight = ''; return; }
hero.style.minHeight = '';
var heroTop = hero.getBoundingClientRect().top + window.scrollY;
if (mqD.matches) hero.style.setProperty('--hdr', Math.round(heroTop) + 'px');
else hero.style.removeProperty('--hdr');
var tickerH = ticker.getBoundingClientRect().height;
var avail = window.innerHeight - heroTop - tickerH;
hero.style.minHeight = Math.max(340, Math.round(avail)) + 'px';
}
fit();
window.addEventListener('resize', fit, {passive: true});
window.addEventListener('load', fit);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
})();
(function(){
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
var nodes = Array.prototype.filter.call(
document.querySelectorAll('.reveal, .timeline-item, .anim'),
function(el){ return !el.closest || !el.closest('[data-anim-group]'); }
);
if (!nodes.length) return;
function check(){
var vh = window.innerHeight || document.documentElement.clientHeight;
for (var i = nodes.length - 1; i >= 0; i--) {
var el = nodes[i];
var r = el.getBoundingClientRect();
if (r.top < vh - 40 && r.bottom > 0) {
el.classList.add('is-visible');
nodes.splice(i, 1);
}
}
}
window.addEventListener('scroll', check, {passive: true});
window.addEventListener('resize', check, {passive: true});
window.addEventListener('load', check);
check();
})();
(function(){
var form = document.getElementById('krepko-form');
if (!form) return;
var status = document.getElementById('cform-status');
var btn = form.querySelector('.cform__submit');
var btnText = btn ? btn.textContent : '';
function show(kind, text){
if (!status) return;
status.hidden = false;
status.className = 'cform__status cform__status--' + kind;
status.textContent = text;
}
form.addEventListener('submit', function(e){
e.preventDefault();
if (!form.checkValidity()) { form.reportValidity(); return; }
var key = form.querySelector('input[name=access_key]');
if (!key || !key.value || key.value.indexOf('ВСТАВЬТЕ') === 0) {
show('err', 'Форма ещё не подключена к почте. Напишите, пожалуйста, в WhatsApp.');
return;
}
btn.disabled = true;
btn.textContent = 'Отправляем…';
if (status) status.hidden = true;
fetch(form.action, {
method: 'POST',
headers: {'Accept': 'application/json'},
body: new FormData(form)
})
.then(function(r){ return r.json().catch(function(){ return {success: r.ok}; }); })
.then(function(data){
if (data && data.success) {
form.reset();
show('ok', 'Заявка отправлена. Krepko свяжется с вами в ближайшее время.');
} else {
show('err', 'Не удалось отправить. Попробуйте ещё раз или напишите в WhatsApp.');
}
})
.catch(function(){
show('err', 'Не удалось отправить. Проверьте соединение или напишите в WhatsApp.');
})
.finally(function(){
btn.disabled = false;
btn.textContent = btnText;
});
});
})();
(function(){
var steps = document.querySelector('.intro__how .steps');
if (!steps) return;
var items = steps.querySelectorAll('.step');
if (!items.length) return;
var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduce) {
steps.style.setProperty('--p', 1);
for (var k = 0; k < items.length; k++) items[k].classList.add('is-on');
return;
}
var segs = items.length - 1;
var queued = false;
function update(){
queued = false;
var r = steps.getBoundingClientRect();
var vh = window.innerHeight || document.documentElement.clientHeight;
if (!vh) return;
var start = vh * 0.88;
var end = vh * 0.38;
var p = (start - r.top) / (start - end);
p = p < 0 ? 0 : (p > 1 ? 1 : p);
for (var i = 0; i < items.length; i++) {
if (i < segs) {
var s = p * segs - i;
s = s < 0 ? 0 : (s > 1 ? 1 : s);
items[i].style.setProperty('--seg', s.toFixed(3));
}
var on = i === 0 ? p > 0.01 : p >= i / segs;
items[i].classList[on ? 'add' : 'remove']('is-on');
}
}
function schedule(){
if (queued) return;
queued = true;
if (window.requestAnimationFrame) window.requestAnimationFrame(update);
else setTimeout(update, 16);
}
window.addEventListener('scroll', schedule, {passive: true});
window.addEventListener('resize', schedule, {passive: true});
update();
})();
(function(){
var els = document.querySelectorAll('.stat__value');
if (!els.length) return;
var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var items = [];
for (var i = 0; i < els.length; i++) {
var raw = els[i].textContent.trim();
var m = raw.match(/^([\d\s]*\d)(.*)$/);
if (!m) continue;
var to = parseInt(m[1].replace(/\s/g, ''), 10);
var from = (to > 1900 && to < 2100) ? to - 30 : 0;
items.push({ el: els[i], from: from, to: to, tail: m[2], done: false, orig: raw });
if (!reduce) els[i].textContent = from + m[2];
}
if (!items.length || reduce) return;
function run(it){
it.done = true;
var DUR = 1100, t0 = null;
function frame(ts){
if (t0 === null) t0 = ts;
var p = Math.min((ts - t0) / DUR, 1);
var eased = 1 - Math.pow(1 - p, 3);
it.el.textContent = Math.round(it.from + (it.to - it.from) * eased) + it.tail;
if (p < 1) requestAnimationFrame(frame);
else it.el.textContent = it.orig;
}
requestAnimationFrame(frame);
}
function check(){
var vh = window.innerHeight || document.documentElement.clientHeight;
for (var i = 0; i < items.length; i++) {
if (items[i].done) continue;
var r = items[i].el.getBoundingClientRect();
if (r.top < vh * 0.9 && r.bottom > 0) run(items[i]);
}
}
window.addEventListener('scroll', check, {passive: true});
window.addEventListener('resize', check, {passive: true});
check();
})();
(function(){
var el = document.querySelector('.stat__value--langs');
if (!el) return;
var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduce) return;
var target = el.textContent;
var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
var STEP = 85;
var started = false;
var order = [], seen = 0;
for (var i = 0; i < target.length; i++) {
var isSpace = /\s/.test(target.charAt(i));
order.push(isSpace ? -1 : seen++);
}
var total = seen * STEP + 260;
function run(){
started = true;
var t0 = null;
function frame(ts){
if (t0 === null) t0 = ts;
var t = ts - t0, out = '';
for (var i = 0; i < target.length; i++) {
if (order[i] === -1) { out += target.charAt(i); continue; }
out += (t >= order[i] * STEP)
? target.charAt(i)
: CHARS.charAt(Math.floor(Math.random() * CHARS.length));
}
el.textContent = out;
if (t < total) requestAnimationFrame(frame);
else el.textContent = target;
}
requestAnimationFrame(frame);
}
function check(){
if (started) return;
var vh = window.innerHeight || document.documentElement.clientHeight;
var r = el.getBoundingClientRect();
if (r.top < vh * 0.9 && r.bottom > 0) run();
}
window.addEventListener('scroll', check, {passive: true});
window.addEventListener('resize', check, {passive: true});
check();
})();
(function(){
var fig = document.querySelector('.portrait__frame');
if (!fig) return;
var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduce) return;
var queued = false;
function update(){
queued = false;
var r = fig.getBoundingClientRect();
var vh = window.innerHeight || document.documentElement.clientHeight;
if (!vh || r.bottom < 0 || r.top > vh) return;
var progress = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
fig.style.setProperty('--par', (progress * -22).toFixed(1) + 'px');
}
function schedule(){
if (queued) return;
queued = true;
if (window.requestAnimationFrame) requestAnimationFrame(update);
else setTimeout(update, 16);
}
window.addEventListener('scroll', schedule, {passive: true});
window.addEventListener('resize', schedule, {passive: true});
update();
})();
(function(){
var pins = document.querySelectorAll('.map__pin');
var provs = document.querySelectorAll('.map__prov');
var rays = document.querySelectorAll('.map__ray');
var cards = document.querySelectorAll('.city__card');
var track = document.getElementById('city-track');
var sats = document.querySelectorAll('.map__sat');
var dists = document.querySelectorAll('.map__dist');
var prev = document.getElementById('city-prev');
var next = document.getElementById('city-next');
if (!pins.length || !cards.length) return;
var idx = 0;
var T_PINS = 1.80, T_SATS = 2.90, T_RAYS = 3.00;
var RAY_STEP = 0.12, RAY_DRAW = 0.90;
var now = (window.performance && performance.now)
? function(){ return performance.now(); }
: function(){ return Date.now(); };
var introAt = null;
var WAVE_T = 2.8, WAVE_W = 0.28;
var FLY_MIN = 0.55, FLY_MAX = 1.50;
var reduceMo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var waves = [], rafId = null;
var mapSeen = true;
function stopEls(id){
var g = document.getElementById(id);
return g ? {
tail: g.querySelector('.ray-tail'),
core: g.querySelector('.ray-core'),
head: g.querySelector('.ray-head')
} : null;
}
function clampOff(v){ return v < 0 ? 0 : (v > 1 ? 1 : v); }
(function () {
var svg = document.querySelector('.map');
if (!svg || !('IntersectionObserver' in window)) return;
new IntersectionObserver(function (es) {
es.forEach(function (e) {
mapSeen = e.isIntersecting;
if (mapSeen && rafId === null && waves.length && window.requestAnimationFrame) {
rafId = requestAnimationFrame(frame);
}
});
}, { rootMargin: '120px' }).observe(svg);
})();
function frame(now){
var alive = 0;
for (var i = 0; i < waves.length; i++) {
var w = waves[i];
var el = (now - w.t0) / 1000;
if (el < 0) { alive++; continue; }
alive++;
var cyc = Math.floor(el / WAVE_T);
var f = el % WAVE_T;
var c = f <= w.fly
? -WAVE_W / 2 + (1 + WAVE_W) * (f / w.fly)
: 1 + WAVE_W / 2;
w.s.tail.setAttribute('offset', clampOff(c - WAVE_W / 2).toFixed(4));
w.s.core.setAttribute('offset', clampOff(c).toFixed(4));
w.s.head.setAttribute('offset', clampOff(c + WAVE_W / 2).toFixed(4));
if (w.src && w.sent !== cyc) { w.sent = cyc; flash(w.src); }
if (w.fired !== cyc && f >= w.hit) {
w.fired = cyc;
flash(w.pin);
if (w.dist) w.dist.classList.add('is-on');
}
}
rafId = (alive && mapSeen) ? requestAnimationFrame(frame) : null;
}
function pump(){
if (rafId === null && waves.length && mapSeen && window.requestAnimationFrame) rafId = requestAnimationFrame(frame);
}
function clearWaves(){
for (var i = 0; i < waves.length; i++) {
waves[i].s.tail.setAttribute('offset', 0);
waves[i].s.core.setAttribute('offset', 0);
waves[i].s.head.setAttribute('offset', 0);
}
waves = [];
if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
}
function flash(pin){
if (!pin) return;
pin.classList.remove('is-hit');
void pin.getBoundingClientRect();
pin.classList.add('is-hit');
}
function distBy(from, to){
for (var d = 0; d < dists.length; d++) {
if (dists[d].getAttribute('data-from') === from && dists[d].getAttribute('data-to') === to) return dists[d];
}
return null;
}
function pinBy(slug){
for (var k = 0; k < pins.length; k++) {
if (pins[k].getAttribute('data-city') === slug) return pins[k];
}
return null;
}
function show(i){
idx = (i + pins.length) % pins.length;
var slug = pins[idx].getAttribute('data-city');
for (var a = 0; a < cards.length; a++) {
cards[a].classList.toggle('is-current', a === idx);
}
if (track && track.clientWidth) {
track.scrollTo
? track.scrollTo({left: idx * track.clientWidth, behavior: reduceMo ? 'auto' : 'smooth'})
: (track.scrollLeft = idx * track.clientWidth);
}
for (var b = 0; b < pins.length; b++) {
pins[b].classList.toggle('is-active', b === idx);
pins[b].classList.remove('is-hit');
}
for (var st = 0; st < sats.length; st++) {
sats[st].classList.toggle('is-on', sats[st].getAttribute('data-prov') === slug);
}
for (var dt = 0; dt < dists.length; dt++) {
dists[dt].classList.toggle('is-on', reduceMo && dists[dt].getAttribute('data-from') === slug);
}
for (var c = 0; c < provs.length; c++) {
var isOn = provs[c].getAttribute('data-prov') === slug;
provs[c].classList.remove('is-on');
if (isOn) {
void provs[c].getBoundingClientRect();
provs[c].classList.add('is-on');
}
}
clearWaves();
if (introAt === null) {
for (var z = 0; z < rays.length; z++) rays[z].classList.remove('is-live');
if (prev) prev.disabled = idx <= 0;
if (next) next.disabled = idx >= pins.length - 1;
return;
}
var base = Math.max(0, (introAt + T_RAYS * 1000) - now());
var mine = [];
for (var r = 0; r < rays.length; r++) {
rays[r].classList.remove('is-live');
if (rays[r].getAttribute('data-from') === slug) mine.push(rays[r]);
}
var lens = [], maxLen = 1;
for (var m = 0; m < mine.length; m++) {
var ln = mine[m].getTotalLength ? mine[m].getTotalLength() : 400;
lens.push(ln);
if (ln > maxLen) maxLen = ln;
mine[m].style.setProperty('--len', ln.toFixed(0));
mine[m].style.setProperty('--d', ((base + m * RAY_STEP * 1000) / 1000).toFixed(2) + 's');
void mine[m].getBoundingClientRect();
mine[m].classList.add('is-live');
}
if (!reduceMo && mine.length) {
var byLen = [];
for (var o = 0; o < lens.length; o++) byLen.push(o);
byLen.sort(function(a, b){ return lens[a] - lens[b]; });
var order = [];
for (var o2 = 0; o2 < byLen.length; o2++) order[byLen[o2]] = o2;
var t0 = now() + base + (mine.length - 1) * RAY_STEP * 1000 + RAY_DRAW * 1000;
for (var w2 = 0; w2 < mine.length; w2++) {
var s = stopEls(mine[w2].getAttribute('data-grad'));
if (!s || !s.core) continue;
var rank = mine.length > 1 ? order[w2] / (mine.length - 1) : 0;
var mix = 0.55 * (lens[w2] / maxLen) + 0.45 * rank;
var fly = FLY_MIN + (FLY_MAX - FLY_MIN) * mix;
waves.push({
s: s,
pin: pinBy(mine[w2].getAttribute('data-to')),
dist: distBy(slug, mine[w2].getAttribute('data-to')),
src: w2 === 0 ? pins[idx] : null,
t0: t0,
fly: fly,
hit: fly * (1 + WAVE_W / 2) / (1 + WAVE_W),
fired: -1,
sent: -1
});
}
}
pump();
if (prev) prev.disabled = idx <= 0;
if (next) next.disabled = idx >= pins.length - 1;
}
for (var n = 0; n < pins.length; n++) {
(function(pin, i){
pin.addEventListener('click', function(){ show(i); });
pin.addEventListener('mouseenter', function(){ show(i); });
pin.addEventListener('focus', function(){ show(i); });
pin.addEventListener('keydown', function(e){
if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(i); }
});
})(pins[n], n);
}
if (track) {
var swipeT = null;
track.addEventListener('scroll', function(){
if (swipeT) clearTimeout(swipeT);
swipeT = setTimeout(function(){
var w = track.clientWidth;
if (!w) return;
var near = Math.round(track.scrollLeft / w);
if (near !== idx) show(near);
}, 110);
}, {passive: true});
}
if (prev) prev.addEventListener('click', function(){ show(idx - 1); });
if (next) next.addEventListener('click', function(){ show(idx + 1); });
var section = document.querySelector('.home-coverage');
var reduce = reduceMo;
function startScore(){
if (introAt !== null) return;
introAt = now();
setTimeout(function(){
section.classList.remove('is-hold');
show(idx);
}, T_PINS * 1000);
setTimeout(function(){
section.classList.remove('is-sat-hold');
}, T_SATS * 1000);
}
if (section && !reduce) {
section.classList.add('is-hold');
section.classList.add('is-sat-hold');
if (section.classList.contains('is-visible')) startScore();
else if (window.MutationObserver) {
var mo = new MutationObserver(function(){
if (!section.classList.contains('is-visible')) return;
mo.disconnect();
startScore();
});
mo.observe(section, {attributes: true, attributeFilter: ['class']});
} else {
section.classList.remove('is-hold');
section.classList.remove('is-sat-hold');
startScore();
}
} else if (section) {
section.classList.remove('is-hold');
section.classList.remove('is-sat-hold');
introAt = now() - T_RAYS * 1000;
}
var mapEl = document.querySelector('.map');
var foreEl = document.querySelector('.map__fore');
var canHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;
if (mapEl && !reduce && canHover && window.requestAnimationFrame) {
var stageBox = mapEl.parentNode;
var AMP_X = 18, AMP_Y = 14, FORE = 0.55;
var tx = 0, ty = 0, cx = 0, cy = 0, tilting = null;
function tiltFrame(){
cx += (tx - cx) * 0.12;
cy += (ty - cy) * 0.12;
mapEl.style.setProperty('--mx', cx.toFixed(2) + 'px');
mapEl.style.setProperty('--my', cy.toFixed(2) + 'px');
if (foreEl) {
foreEl.style.setProperty('--fx', (cx * FORE).toFixed(2) + 'px');
foreEl.style.setProperty('--fy', (cy * FORE).toFixed(2) + 'px');
}
if (Math.abs(tx - cx) < 0.05 && Math.abs(ty - cy) < 0.05) {
cx = tx; cy = ty;
tilting = null;
return;
}
tilting = requestAnimationFrame(tiltFrame);
}
function tiltPump(){ if (tilting === null) tilting = requestAnimationFrame(tiltFrame); }
var landEl = document.getElementById('es-land');
var canHitTest = landEl && landEl.isPointInFill;
function overLand(e, b){
if (!canHitTest) return true;
var vx = (e.clientX - b.left) / b.width * 1000;
var vy = (e.clientY - b.top) / b.height * 775 + 25;
try { return landEl.isPointInFill({x: vx, y: vy}); }
catch (err) { canHitTest = false; return true; }
}
stageBox.addEventListener('mousemove', function(e){
var b = mapEl.getBoundingClientRect();
if (!b.width || !b.height) return;
if (!overLand(e, b)) { tx = 0; ty = 0; tiltPump(); return; }
tx = ((e.clientX - b.left) / b.width - 0.5) * 2 * AMP_X;
ty = ((e.clientY - b.top) / b.height - 0.5) * 2 * AMP_Y;
tiltPump();
}, {passive: true});
stageBox.addEventListener('mouseleave', function(){ tx = 0; ty = 0; tiltPump(); });
}
var stageEl = document.querySelector('.map-stage');
if (stageEl && !reduce) {
var queued = false;
function par(){
queued = false;
var r = stageEl.getBoundingClientRect();
var vh = window.innerHeight || document.documentElement.clientHeight;
if (r.bottom < 0 || r.top > vh) return;
var progress = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
stageEl.style.setProperty('--par', (progress * -26).toFixed(1) + 'px');
}
function parTick(){
if (queued) return;
queued = true;
if (window.requestAnimationFrame) requestAnimationFrame(par); else setTimeout(par, 16);
}
window.addEventListener('scroll', parTick, {passive: true});
window.addEventListener('resize', parTick, {passive: true});
par();
}
show(0);
})();
(function(){
var groups = document.querySelectorAll('[data-anim-group]');
if (!groups.length) return;
function reveal(g){
var kids = g.querySelectorAll('.anim, .reveal, .timeline-item');
for (var i = 0; i < kids.length; i++) kids[i].classList.add('is-visible');
g.classList.add('is-visible');
}
if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
for (var r = 0; r < groups.length; r++) reveal(groups[r]);
return;
}
if (!('IntersectionObserver' in window)) {
for (var f = 0; f < groups.length; f++) reveal(groups[f]);
return;
}
var io = new IntersectionObserver(function(entries){
entries.forEach(function(e){
if (!e.isIntersecting) return;
io.unobserve(e.target);
reveal(e.target);
});
}, {threshold: 0, rootMargin: '0px 0px -18% 0px'});
for (var k = 0; k < groups.length; k++) io.observe(groups[k]);
function check(){
for (var i = groups.length - 1; i >= 0; i--) {
var g = groups[i];
if (g.classList.contains('is-visible')) continue;
var b = g.getBoundingClientRect();
var vh = window.innerHeight || document.documentElement.clientHeight;
if (b.top < vh * 0.82 && b.bottom > 0) reveal(g);
}
}
window.addEventListener('scroll', check, {passive: true});
window.addEventListener('resize', check, {passive: true});
check();
})();
(function(){
var els = document.querySelectorAll('.gcard[style*="transition-delay"], .srow[style*="transition-delay"], .loc[style*="transition-delay"]');
function drop(){ this.style.transitionDelay = '0s'; }
for (var i = 0; i < els.length; i++) {
els[i].addEventListener('mouseenter', drop);
els[i].addEventListener('focusin', drop);
}
})();
(function(){
var items = document.querySelectorAll('.home-faq .faq__item');
if (!items.length) return;
var DUR = 360;
var EASE = 'cubic-bezier(.22, 1, .36, 1)';
var PAD = 30;
var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var canAnimate = !reduce && typeof Element !== 'undefined' && Element.prototype.animate;
function panel(d){ return d.querySelector('.faq__a'); }
function clip(p, on){ p.style.overflow = on ? 'hidden' : ''; }
function frameOf(p){
if (!p._anim) return null;
var cs = getComputedStyle(p);
return { height: cs.height, paddingBottom: cs.paddingBottom, opacity: cs.opacity };
}
function expand(d){
var p = panel(d);
d.open = true;
d._closing = false;
if (!canAnimate || !p) return;
var from = frameOf(p) || { height: '0px', paddingBottom: '0px', opacity: 0 };
if (p._anim) p._anim.cancel();
var h = p.scrollHeight;
clip(p, true);
p._anim = p.animate(
[from,
{ height: h + 'px', paddingBottom: PAD + 'px', opacity: 1 }],
{ duration: DUR, easing: EASE }
);
p._anim.onfinish = function(){ p._anim = null; clip(p, false); };
}
function collapse(d){
var p = panel(d);
if (!canAnimate || !p) { d.open = false; return; }
var from = frameOf(p);
if (p._anim) p._anim.cancel();
var h = p.scrollHeight;
clip(p, true);
d._closing = true;
p._anim = p.animate(
[from || { height: h + 'px', paddingBottom: PAD + 'px', opacity: 1 },
{ height: '0px', paddingBottom: '0px', opacity: 0 }],
{ duration: DUR, easing: EASE }
);
p._anim.onfinish = function(){ p._anim = null; d._closing = false; d.open = false; clip(p, false); };
}
for (var i = 0; i < items.length; i++) {
(function(d){
var s = d.querySelector('summary');
if (!s) return;
s.addEventListener('click', function(e){
e.preventDefault();
if (d.open && !d._closing) { collapse(d); return; }
var top = d.getBoundingClientRect().top;
for (var j = 0; j < items.length; j++) {
var o = items[j];
if (o === d || !o.open || o._closing) continue;
if (o.compareDocumentPosition(d) & Node.DOCUMENT_POSITION_FOLLOWING) {
var op = panel(o);
if (op && op._anim) { op._anim.cancel(); op._anim = null; clip(op, false); }
o._closing = false;
o.open = false;
} else collapse(o);
}
var shift = d.getBoundingClientRect().top - top;
if (shift < -1) window.scrollBy(0, shift);
expand(d);
});
})(items[i]);
}
})();
(function () {
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
var mq = window.matchMedia('(max-width: 719px)');
var fig = document.querySelector('#sec-intro .portrait__figure');
var sec = document.getElementById('sec-intro');
if (!fig || !sec) return;
var queued = false;
function tick() {
queued = false;
if (!mq.matches) { sec.style.removeProperty('--slide'); return; }
var vh = window.innerHeight || document.documentElement.clientHeight;
var b = fig.getBoundingClientRect();
if (b.bottom < -100 || b.top > vh + 100) return;
var p = (vh * 0.92 - b.bottom) / (vh * 0.37);
p = Math.max(0, Math.min(1, p));
sec.style.setProperty('--slide', p.toFixed(3));
}
function queue() { if (!queued) { queued = true; requestAnimationFrame(tick); } }
window.addEventListener('scroll', queue, { passive: true });
window.addEventListener('resize', queue, { passive: true });
tick();
})();
(function () {
var box = document.getElementById('hero-roll');
if (!box) return;
var mq = window.matchMedia('(max-width: 899px)');
var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var ul = box.querySelector('ul');
var L = 28, OFF = 2, PAUSE_MS = 1900, RIDE_MS = 640, IDLE_MS = 5000;
var base = Array.prototype.slice.call(ul.children);
var n = base.length;
function copy(li) {
var c = li.cloneNode(true);
c.setAttribute('aria-hidden', 'true');
var a = c.querySelector('a');
if (a) a.setAttribute('tabindex', '-1');
return c;
}
base.slice().reverse().forEach(function (li) { ul.insertBefore(copy(li), ul.firstChild); });
base.forEach(function (li) { ul.appendChild(copy(li)); });
var items = ul.children;
var idx = n;
var y = (idx - OFF) * L;
function setY(v) { y = v; ul.style.transform = 'translateY(' + (-v) + 'px)'; }
function paint() {
for (var k2 = 0; k2 < items.length; k2++) {
items[k2].classList.remove('is-c', 'is-n');
var d = k2 - idx;
if (d === 0) items[k2].classList.add('is-c');
else if (d === -1 || d === 1) items[k2].classList.add('is-n');
}
}
function snap() {
while (idx >= 2 * n) idx -= n;
while (idx < n) idx += n;
setY((idx - OFF) * L);
paint();
box.classList.add('is-live');
}
var animating = false, raf = 0, held = false, idleT = 0;
function hold() {
held = true;
clearTimeout(idleT);
if (animating) { cancelAnimationFrame(raf); animating = false; }
}
function release() {
clearTimeout(idleT);
idleT = setTimeout(function () {
held = false;
if (Math.abs(y - (idx - OFF) * L) > 0.5) snap();
}, IDLE_MS);
}
box.addEventListener('pointerdown', hold, { passive: true });
box.addEventListener('touchstart', hold, { passive: true });
box.addEventListener('mouseenter', hold);
box.addEventListener('pointerup', release, { passive: true });
box.addEventListener('touchend', release, { passive: true });
box.addEventListener('mouseleave', release);
box.addEventListener('focusin', function (e) {
hold();
var li = e.target.closest ? e.target.closest('li') : null;
var k = Array.prototype.indexOf.call(items, li);
if (k >= 0) { idx = k; snap(); }
});
box.addEventListener('focusout', release);
if (reduce) { snap(); return; }
var onScreen = true;
if ('IntersectionObserver' in window) {
new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; }).observe(box);
}
function stepOnce() {
if (!mq.matches || document.hidden || !onScreen || animating || held) return;
animating = true;
if (idx >= 2 * n) { idx -= n; setY((idx - OFF) * L); }
idx++;
paint();
var from = y, to = (idx - OFF) * L, t0 = null;
function frame(ts) {
if (!animating) return;
if (t0 === null) t0 = ts;
var p = Math.min((ts - t0) / RIDE_MS, 1);
var e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
setY(from + (to - from) * e);
if (p < 1) { raf = requestAnimationFrame(frame); }
else { animating = false; }
}
raf = requestAnimationFrame(frame);
}
setInterval(stepOnce, PAUSE_MS + RIDE_MS);
document.addEventListener('visibilitychange', function () {
if (!document.hidden) { animating = false; snap(); }
});
snap();
})();
(function () {
var stack = document.getElementById('stack');
if (!stack) return;
var mq = window.matchMedia('(max-width: 719px)');
var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduce) return;
var photo = stack.querySelector('.hcard');
var cards = Array.prototype.slice.call(stack.querySelectorAll('.stack__card'));
var N = cards.length;
function easeOutBack(x) {
var c1 = 1.15, c3 = c1 + 1;
return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}
function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
var target = 0, cur = -1, raf = null;
function measure() {
var vh = window.innerHeight;
var r = stack.getBoundingClientRect();
if (r.bottom < -80 || r.top > vh + 80) { target = -1; return; }
var run = r.height - vh;
target = Math.max(0, Math.min(1, -r.top / Math.max(1, run)));
}
function apply(p) {
var pa = Math.max(0, (p - 0.16) / 0.84);
cards.forEach(function (c, i) {
var pi = Math.max(0, Math.min(1, pa * (N + 0.55) - i * 1.0));
var eb = easeOutBack(pi);
var ec = easeOutCubic(pi);
var wait = 64 + i * 2.5;
var park = i * 2.4;
var y = park + (1 - eb) * (wait - park);
c.style.setProperty('--y', y.toFixed(2));
c.style.setProperty('--r', ((+c.dataset.r) * ec).toFixed(2));
c.style.setProperty('--dx', ((+c.dataset.dx) * ec).toFixed(1));
});
if (photo) photo.style.setProperty('--sp', Math.min(1, p * 1.5).toFixed(3));
}
function loop() {
if (target < 0) { raf = null; return; }
if (cur < 0) cur = target;
cur += (target - cur) * 0.085;
if (Math.abs(target - cur) < 0.0004) { cur = target; apply(cur); raf = null; return; }
apply(cur);
raf = requestAnimationFrame(function () { measure(); loop(); });
}
function wake() {
measure();
if (target >= 0 && raf === null) { raf = requestAnimationFrame(loop); }
}
addEventListener('scroll', wake, { passive: true });
addEventListener('resize', wake, { passive: true });
wake();
})();
(function () {
var stage = document.querySelector('.hero-chat');
if (!stage) return;
var src = stage.querySelectorAll('.hero-chat__src li');
if (!src.length) return;
var mqD = window.matchMedia('(min-width: 1180px)');
var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var PAIRS = Array.prototype.map.call(src, function (li) {
return { q: li.getAttribute('data-q'), a: li.textContent.trim(), card: li.getAttribute('data-card') };
});
var SLOTS = [[1, 0], [0, .5], [.8, 1], [.25, .04], [1, .62], [0, 1]];
var h1 = document.querySelector('.hero--home .hero__h1');
var timers = [], k = 0, live = [], running = false, visible = true;
var ready = document.readyState === 'complete';
function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
function stop() {
timers.forEach(clearTimeout); timers = []; running = false;
Array.prototype.forEach.call(stage.querySelectorAll('.hero-chat__pair.is-out'), function (e) { e.remove(); });
}
function esc(t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
var leftCol = document.querySelectorAll('.hero--home .hm-find__field, .hero--home .hm-dirs, .hero--home .hero__cta-row');
function field() {
var right = 0;
if (h1) { var r = document.createRange(); r.selectNodeContents(h1); right = r.getBoundingClientRect().right; }
Array.prototype.forEach.call(leftCol, function (el) { right = Math.max(right, el.getBoundingClientRect().right); });
return Math.max(0, stage.getBoundingClientRect().left - right - 40);
}
function answer(p) {
var card = p.card === 'maps'
? '<span class="hero-chat__maps"><b>Krepko</b><small>Google Maps</small></span>'
: '';
return '<span class="hero-chat__b hero-chat__b--a"><span class="hero-chat__who">Krepko</span>' + esc(p.a) + card + '</span>';
}
function build(p) {
var el = document.createElement('div'); el.className = 'hero-chat__pair';
el.innerHTML = '<div class="hero-chat__drift">'
+ '<div class="hero-chat__fl hero-chat__fl--q"><span class="hero-chat__b hero-chat__b--q">' + esc(p.q) + '</span></div>'
+ '<div class="hero-chat__fl hero-chat__fl--a">' + answer(p) + '</div>'
+ '<div class="hero-chat__fl hero-chat__fl--dots"><span class="hero-chat__b hero-chat__b--dots"><i></i><i></i><i></i></span></div>'
+ '</div>';
return el;
}
function place(el, slot) {
var sw = stage.clientWidth, f = field(), W = sw + f, H = stage.clientHeight;
var pw = Math.min(W, Math.max(300, Math.min(400, sw * .92)));
el.style.width = pw + 'px';
var a = el.querySelector('.hero-chat__fl--a'), d = el.querySelector('.hero-chat__fl--dots');
d.style.top = a.offsetTop + 'px';
el.style.left = Math.round(-f + slot[0] * (W - pw)) + 'px';
el.style.top = Math.round(slot[1] * Math.max(0, H - el.offsetHeight)) + 'px';
}
function retire() {
live.forEach(function (e, idx) {
var age = live.length - idx;
e.classList.remove('is-ghost', 'is-ghost2');
if (age === 1) e.classList.add('is-ghost');
else if (age === 2) e.classList.add('is-ghost2');
else { e.classList.add('is-out'); later(function () { e.remove(); }, 2100); }
});
live = live.slice(-2);
}
function pair() {
var p = PAIRS[k % PAIRS.length], slot = SLOTS[k % SLOTS.length]; k++;
var el = build(p);
retire();
stage.appendChild(el); place(el, slot);
var q = el.querySelector('.hero-chat__fl--q'), a = el.querySelector('.hero-chat__fl--a'), d = el.querySelector('.hero-chat__fl--dots');
later(function () { q.classList.add('is-in'); }, 500);
later(function () { d.classList.add('is-in'); }, 1400);
later(function () { d.classList.remove('is-in'); a.classList.add('is-in'); }, 2700);
live.push(el);
later(function () { if (running) pair(); }, 6800);
}
function start() {
if (!ready || running || !visible || document.hidden || !mqD.matches) return;
running = true; pair();
}
if (reduce) {
var still = function () {
var el0 = build(PAIRS[0]);
stage.appendChild(el0); place(el0, SLOTS[0]);
el0.querySelector('.hero-chat__fl--q').classList.add('is-in');
el0.querySelector('.hero-chat__fl--a').classList.add('is-in');
};
if (ready) still(); else window.addEventListener('load', still);
return;
}
if (!ready) window.addEventListener('load', function () { ready = true; start(); });
if ('IntersectionObserver' in window) {
new IntersectionObserver(function (es) {
visible = es[0].isIntersecting;
if (visible) start(); else stop();
}).observe(stage);
}
document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
if (mqD.addEventListener) mqD.addEventListener('change', function () { if (mqD.matches) start(); else stop(); });
start();
})();
