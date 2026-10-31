(function () {
'use strict';
if (typeof window === 'undefined') return;
function track(name, params) {
if (typeof window.gtag === 'function') {
try { window.gtag('event', name, params || {}); } catch (e) { }
}
}
function getUTM() {
var p = new URLSearchParams(window.location.search);
return {
source: p.get('utm_source') || '',
medium: p.get('utm_medium') || '',
campaign: p.get('utm_campaign') || '',
content: p.get('utm_content') || ''
};
}
function hasConsent() {
try { return localStorage.getItem('krepko_consent_v1') === 'all'; }
catch (e) { return false; }
}
function rememberUTM() {
try {
if (!hasConsent()) { localStorage.removeItem('es_utm'); return; }
var u = getUTM();
if (!u.source) return;
var stored = JSON.parse(localStorage.getItem('es_utm') || 'null');
if (!stored) {
u.first_seen = new Date().toISOString();
localStorage.setItem('es_utm', JSON.stringify(u));
}
} catch (e) { }
}
function getStoredUTM() {
if (!hasConsent()) return getUTM();
try {
var stored = JSON.parse(localStorage.getItem('es_utm') || 'null');
return stored || getUTM();
} catch (e) { return getUTM(); }
}
function onConsentClick(e) {
var btn = e.target.closest && e.target.closest('[data-consent="all"]');
if (btn) setTimeout(rememberUTM, 0);
}
function buildWhatsAppText(prefilledText) {
var u = getStoredUTM();
var src = u.campaign || u.source || 'direct';
var lines = ['Источник: ' + src, ''];
if (prefilledText) lines.push(prefilledText);
else lines.push('Здравствуйте, нужна консультация');
return lines.join('\n');
}
function patchWhatsAppLinks() {
var root = document.documentElement;
if (root && (root.getAttribute('lang') || '').slice(0, 2) === 'es') return;
var links = document.querySelectorAll('a[href*="wa.me/34624309985"], a[href*="api.whatsapp.com"]');
links.forEach(function (a) {
var origHref = a.getAttribute('href');
if (origHref.indexOf('?text=') > -1 || origHref.indexOf('&text=') > -1) {
var u = getStoredUTM();
if (u.campaign || u.source) {
var prefix = encodeURIComponent('Источник: ' + (u.campaign || u.source) + '\n\n');
a.setAttribute('href', origHref.replace(/(\?|&)text=/, '$1text=' + prefix));
}
} else {
var newText = encodeURIComponent(buildWhatsAppText());
var sep = origHref.indexOf('?') > -1 ? '&' : '?';
a.setAttribute('href', origHref + sep + 'text=' + newText);
}
});
}
function locationOf(el) {
var section = el.closest('[data-track-section]');
return el.getAttribute('data-track-location')
|| (section && section.getAttribute('data-track-section'))
|| (el.closest('header') ? 'header' : '')
|| (el.closest('footer') ? 'footer' : '')
|| (el.closest('.sticky-cta, .cta-sticky') ? 'sticky' : '')
|| 'page';
}
function onDelegatedClick(e) {
var el = e.target.closest('[data-track]');
if (!el) return;
var name = el.getAttribute('data-track');
var params = {
location: locationOf(el),
page: window.location.pathname
};
var service = el.getAttribute('data-track-service');
if (service) params.service = service;
var question = el.getAttribute('data-track-question');
if (question) params.question = question;
track(name, params);
}
function autoCTAFromHref(a) {
var href = a.getAttribute('href') || '';
if (href.indexOf('wa.me') > -1 || href.indexOf('whatsapp.com') > -1) return 'cta_click_whatsapp';
if (href.indexOf('t.me/+34624309985') > -1) return 'cta_click_telegram';
if (href.indexOf('t.me/krepko_es_admin_bot') > -1) return 'cta_click_bot';
if (href.indexOf('t.me/krepko_es') > -1) return 'cta_click_channel';
if (href.indexOf('t.me/krepko_es_chat') > -1) return 'cta_click_chat';
if (href.indexOf('mailto:') === 0) return 'cta_click_email';
if (href.indexOf('tel:') === 0) return 'cta_click_phone';
if (href.indexOf('instagram.com') > -1) return 'cta_click_instagram';
return null;
}
function attachAutoCTAListeners() {
document.querySelectorAll('a[href]').forEach(function (a) {
if (a.hasAttribute('data-track')) return;
var name = autoCTAFromHref(a);
if (!name) return;
a.addEventListener('click', function () {
track(name, { location: locationOf(a), page: window.location.pathname });
});
});
}
function trackScrollDepth(selector, eventName) {
var el = document.querySelector(selector);
if (!el || typeof IntersectionObserver === 'undefined') return;
var fired = false;
var io = new IntersectionObserver(function (entries) {
if (entries[0].isIntersecting && !fired) {
fired = true;
track(eventName, { page: window.location.pathname });
io.disconnect();
}
}, { threshold: 0.4 });
io.observe(el);
}
function trackBlogReadComplete() {
if (window.location.pathname.indexOf('/blog/') !== 0) return;
if (window.location.pathname === '/blog/' || window.location.pathname === '/blog/index.html') return;
var fired = false;
function check() {
if (fired) return;
var scrolled = window.scrollY + window.innerHeight;
var totalH = document.documentElement.scrollHeight;
if (scrolled / totalH >= 0.9) {
fired = true;
var slug = window.location.pathname.replace('/blog/', '').replace('.html', '').replace(/\/$/, '');
track('blog_finish_read', { slug: slug });
window.removeEventListener('scroll', check);
}
}
window.addEventListener('scroll', check, { passive: true });
}
function init() {
rememberUTM();
patchWhatsAppLinks();
attachAutoCTAListeners();
document.addEventListener('click', onDelegatedClick);
document.addEventListener('click', onConsentClick);
trackScrollDepth('.tariff-grid, .pricing, [data-track-section="pricing"]', 'pricing_view');
trackBlogReadComplete();
}
if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', init);
} else {
init();
}
})();
