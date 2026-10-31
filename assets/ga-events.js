(function () {
'use strict';
function getTrackEndpoint() {
var meta = document.querySelector('meta[name="krepko-track-endpoint"]');
return meta ? (meta.getAttribute('content') || '').trim() : '';
}
function sendGA(ctaId, ctaText, href) {
if (typeof window.gtag !== 'function') return;
try {
window.gtag('event', 'cta_click', {
cta_id: ctaId,
cta_page: location.pathname,
cta_text: ctaText,
cta_href: href
});
} catch (e) {}
}
function sendToBot(ctaId, ctaText) {
var endpoint = getTrackEndpoint();
if (!endpoint) return;
var payload = JSON.stringify({
cta_id: ctaId,
cta_page: location.pathname,
cta_text: ctaText
});
try {
if (navigator.sendBeacon) {
var blob = new Blob([payload], { type: 'text/plain;charset=UTF-8' });
navigator.sendBeacon(endpoint, blob);
return;
}
} catch (e) {}
try {
fetch(endpoint, {
method: 'POST',
body: payload,
headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
keepalive: true,
mode: 'cors',
credentials: 'omit'
}).catch(function () {});
} catch (e) {}
}
function autoTagNav() {
var navWa = document.querySelector('.site-nav__wa');
if (navWa && !navWa.hasAttribute('data-cta')) {
navWa.setAttribute('data-cta', 'nav-wa');
}
document.querySelectorAll('.site-nav__tg').forEach(function (el) {
if (el.hasAttribute('data-cta')) return;
var href = el.getAttribute('href') || '';
if (href.indexOf('admin_bot') !== -1) {
el.setAttribute('data-cta', 'nav-tg-bot');
} else {
el.setAttribute('data-cta', 'nav-tg-channel');
}
});
}
document.addEventListener('click', function (e) {
var el = e.target.closest && e.target.closest('[data-cta]');
if (!el) return;
var ctaId = el.getAttribute('data-cta');
if (!ctaId) return;
var text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);
var href = el.getAttribute('href') || '';
sendGA(ctaId, text, href);
sendToBot(ctaId, text);
}, true);
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', autoTagNav);
} else {
autoTagNav();
}
})();
