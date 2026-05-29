/* ============================================================
   Krepko — Централизованный CTA event-tracker.

   Делегирование через [data-cta]: на любой кнопке/ссылке ставится
   атрибут data-cta="<id>" — скрипт ловит клик и отправляет:

   1. В GA4 (если gtag доступен) — событие cta_click
   2. В наш бот на Railway (если задан endpoint) — для дневной/ночной
      сводки в Telegram

   Endpoint настраивается через <meta name="krepko-track-endpoint">
   в <head>. Если meta нет — отправляется только в GA4.

   Авто-разметка для общих компонентов: site-nav (WA + 2 TG).
   ============================================================ */

(function () {
  'use strict';

  // ── Конфиг ──
  function getTrackEndpoint() {
    var meta = document.querySelector('meta[name="krepko-track-endpoint"]');
    return meta ? (meta.getAttribute('content') || '').trim() : '';
  }

  // ── GA4 ──
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

  // ── Наш бот (sendBeacon — не теряется при уходе в новую вкладку) ──
  function sendToBot(ctaId, ctaText) {
    var endpoint = getTrackEndpoint();
    if (!endpoint) return;
    var payload = JSON.stringify({
      cta_id: ctaId,
      cta_page: location.pathname,
      cta_text: ctaText
    });
    try {
      // sendBeacon работает даже когда браузер уходит на другую вкладку.
      // text/plain нужен чтобы избежать CORS preflight для simple-request.
      if (navigator.sendBeacon) {
        var blob = new Blob([payload], { type: 'text/plain;charset=UTF-8' });
        navigator.sendBeacon(endpoint, blob);
        return;
      }
    } catch (e) {}
    // Фолбэк — fetch с keepalive
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

  // ── Авто-разметка nav-кнопок (header — общий для всех страниц) ──
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

  // ── Делегирование клика ──
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
