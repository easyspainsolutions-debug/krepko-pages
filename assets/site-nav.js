(function () {
'use strict';
var root = document.documentElement;
var nav = document.querySelector('.site-nav');
if (!nav) return;
var flags = ' ' + (nav.getAttribute('data-bars') || '') + ' ';
var HIDE_PHONE = flags.indexOf(' hide-phone ') >= 0;
var SEARCH_DESK = flags.indexOf(' search-desk ') >= 0;
var path = location.pathname.replace(/^\/uk(?=\/|$)/, '') || '/';
var HOME = path === '/' || path === '/index.html';
var bbar = document.getElementById('sticky-cta');
var desk = window.matchMedia ? window.matchMedia('(min-width: 900px)') : { matches: true };
var dialogs = [].slice.call(document.querySelectorAll('dialog'));
if (bbar) bbar.removeAttribute('hidden');
var section = HOME ? 'home'
: /^\/blog(\/|$)/.test(path) ? 'blog'
: /^\/about(\/|$)/.test(path) ? 'about'
: /^\/(partners|es|aviso-legal|cookies|privacidad|terminos|review|hello)(\/|$)/.test(path) ? ''
: 'services';
if (section && section !== 'home') {
[].forEach.call(nav.querySelectorAll('.site-nav__link'), function (a) {
var href = (a.getAttribute('href') || '').replace(/^\/uk(?=\/)/, '');
if (href !== '/' + section + '/') return;
a.classList.add('is-current');
if (href === path) a.setAttribute('aria-current', 'page');
});
}
if (section) {
var item = document.querySelector('.site-menu__link[data-page="' + section + '"]');
if (item) item.classList.add('active');
}
var state = '';
var last = window.scrollY || 0;
var acc = 0;
var waIn = false;
var footIn = false;
function phone() { return !desk.matches; }
function hides() {
if (phone()) return HIDE_PHONE && !HOME && !!bbar;
return SEARCH_DESK;
}
function locked() { return root.hasAttribute('data-bar-lock'); }
function paint() {
if (waIn) root.setAttribute('data-wa-in', '');
else root.removeAttribute('data-wa-in');
if (!bbar || locked()) return;
var on;
if (!phone() || HOME) on = false;
else if (HIDE_PHONE) on = state === 'down';
else on = (window.scrollY || 0) > window.innerHeight * 0.8;
bbar.classList.toggle('is-on', on && !waIn && !footIn);
}
function set(s) {
if (s === state) return;
state = s;
root.setAttribute('data-bar', s);
paint();
schedule();
}
function pinned() { return footIn && phone() && !waIn; }
function settle() {
if (!locked() && state === 'down' && pinned()) set('up');
}
function onScroll() {
var y = window.scrollY || 0;
var d = y - last;
last = y;
if (locked()) return;
if (!hides() || y < window.innerHeight) {
acc = 0;
set('top');
} else if (d) {
acc = (d > 0) === (acc > 0) ? acc + d : d;
if (acc > 6) set(pinned() ? 'up' : 'down');
else if (acc < -6) set('up');
}
settle();
paint();
}
set(hides() && (window.scrollY || 0) >= window.innerHeight ? 'down' : 'top');
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll, { passive: true });
var inner = nav.querySelector('.site-nav__inner');
nav.addEventListener('focusin', function (e) {
if (state === 'down' && inner && inner.contains(e.target)) set('up');
});
function syncLock() {
var open = dialogs.some(function (d) { return d.open; });
if (open) {
root.setAttribute('data-bar-lock', '');
} else if (locked()) {
root.removeAttribute('data-bar-lock');
last = window.scrollY || 0;
acc = 0;
paint();
}
}
if (dialogs.length && window.MutationObserver) {
var mo = new MutationObserver(syncLock);
dialogs.forEach(function (d) { mo.observe(d, { attributes: true, attributeFilter: ['open'] }); });
}
var CHROME = '.topbar, .site-nav, .sticky-cta, dialog, .cookie-consent';
function isButton(a) {
if (a.closest(CHROME) || a.offsetHeight < 32) return false;
var bg = window.getComputedStyle(a).backgroundColor || '';
return !!bg && bg !== 'transparent' && !/^rgba\(.*,\s*0\)$/.test(bg);
}
var consent = document.getElementById('cookie-consent');
function floor(r) {
if (!consent || consent.hidden) return window.innerHeight;
var c = consent.getBoundingClientRect();
if (!c.height || c.right <= r.left || c.left >= r.right) return window.innerHeight;
return Math.min(window.innerHeight, c.top);
}
var topbar = document.querySelector('.topbar');
var searchBar = nav.querySelector('.site-nav__bar');
function chromeBottom() {
if (state === 'down') return desk.matches && searchBar ? searchBar.offsetHeight : 0;
var tb = topbar ? topbar.getBoundingClientRect().bottom : 0;
return Math.max(0, tb) + nav.offsetHeight;
}
function inView(el, top) {
var r = el.getBoundingClientRect();
if (!r.height) return false;
return Math.min(r.bottom, floor(r)) - Math.max(r.top, top) >= r.height / 2;
}
var btns = [];
var queued = false;
function check() {
queued = false;
var top = chromeBottom();
var on = btns.some(function (b) { return inView(b, top); });
if (on !== waIn) { waIn = on; settle(); paint(); }
}
function schedule() {
if (queued) return;
queued = true;
(window.requestAnimationFrame || setTimeout)(check);
}
function watchButtons() {
btns = [].filter.call(
document.querySelectorAll('a[href*="wa.me/"], a[href*="api.whatsapp.com"]'), isButton);
check();
}
window.addEventListener('scroll', schedule, { passive: true });
window.addEventListener('resize', schedule, { passive: true });
if (bbar && 'IntersectionObserver' in window) {
var stops = document.querySelectorAll('.site-footer');
var hits = [];
var sio = new IntersectionObserver(function (entries) {
entries.forEach(function (e) {
var i = hits.indexOf(e.target);
if (e.isIntersecting && i < 0) hits.push(e.target);
if (!e.isIntersecting && i >= 0) hits.splice(i, 1);
});
footIn = hits.length > 0;
settle();
paint();
}, { rootMargin: '0px 0px -10% 0px' });
[].forEach.call(stops, function (s) { sio.observe(s); });
}
function onMedia() { watchButtons(); onScroll(); }
if (desk.addEventListener) desk.addEventListener('change', onMedia);
else if (desk.addListener) desk.addListener(onMedia);
watchButtons();
if (consent && window.MutationObserver) {
new MutationObserver(function () { schedule(); setTimeout(schedule, 350); })
.observe(consent, { attributes: true, attributeFilter: ['hidden'] });
}
if (document.fonts && document.fonts.ready) document.fonts.ready.then(watchButtons);
document.addEventListener('krepko:wa-buttons', watchButtons);
window.addEventListener('hashchange', watchButtons);
})();
(function () {
document.addEventListener('toggle', function (e) {
var d = e.target;
if (!d || d.tagName !== 'DETAILS' || !d.open) return;
if (d.closest('.home-faq')) return;
var group = d.closest('.faq__list') || d.parentElement;
if (!group) return;
var top = d.getBoundingClientRect().top;
var siblings = group.querySelectorAll(':scope > details[open]');
for (var i = 0; i < siblings.length; i++) {
if (siblings[i] !== d) siblings[i].open = false;
}
var shift = d.getBoundingClientRect().top - top;
if (shift < -1) {
var se = document.documentElement, sb = se.style.scrollBehavior;
se.style.scrollBehavior = 'auto';
window.scrollBy(0, shift);
se.style.scrollBehavior = sb;
}
}, true);
})();
(function(){
var d = document.getElementById('site-menu-dialog');
var trigger = document.querySelector('.site-nav__menu-btn');
if (!d) return;
var themeMeta = document.querySelector('meta[name="theme-color"]');
var themeIdle = themeMeta ? themeMeta.getAttribute('content') : null;
if (themeMeta && themeIdle && window.MutationObserver) {
new MutationObserver(function(){
var sheet = (getComputedStyle(document.documentElement).getPropertyValue('--k-bg') || '').trim();
themeMeta.setAttribute('content', d.hasAttribute('open') ? (sheet || themeIdle) : themeIdle);
}).observe(d, {attributes: true, attributeFilter: ['open']});
}
d.addEventListener('click', function(e){ if (e.target === d) d.close(); });
d.addEventListener('keydown', function(e){
if (e.key === 'Escape') { e.preventDefault(); d.close(); }
});
var viaKey = false;
document.addEventListener('keydown', function(){ viaKey = true; }, true);
document.addEventListener('pointerdown', function(){ viaKey = false; }, true);
d.addEventListener('close', function(){
if (!trigger) return;
if (!viaKey) {
trigger.classList.add('is-quiet-focus');
trigger.addEventListener('blur', function off(){
trigger.classList.remove('is-quiet-focus');
trigger.removeEventListener('blur', off);
});
}
try { trigger.focus({ preventScroll: true }); } catch (_) {}
});
})();
