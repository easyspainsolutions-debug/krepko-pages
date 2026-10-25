/* ==========================================================================
   Krepko Pulse — свой счётчик поведения (2026-10-25).

   Зачем. GA4 видит только тех, кто нажал «Принять все» (это меньшинство),
   а Cloudflare считает визиты вместе с ботами и не знает, что человек делал
   на странице. Pulse отвечает на три вопроса по КАЖДОМУ посетителю:
   откуда пришёл, куда нажал, где и как ушёл.

   Приватность. Ничего не пишем на устройство: ни cookies, ни localStorage,
   ни sessionStorage. Идентификатор живёт в памяти одной загрузки страницы
   и пропадает вместе с ней — связать двух посетителей или два дня нельзя.
   IP и User-Agent не сохраняются (Worker берёт из запроса только страну).
   Тексты из полей ввода не уходят, кроме запросов в поиске по сайту —
   из них вырезаются цифры и e-mail.

   Куда. navigator.sendBeacon на тот же домен (/api/p) — Cloudflare Worker
   krepko-pulse пишет в D1. Адрес берётся из <meta name="krepko-pulse">:
   нет meta — скрипт ничего не делает (так счётчик выключается в site.yaml).
   ========================================================================== */
(function () {
  'use strict';
  var meta = document.querySelector('meta[name="krepko-pulse"]');
  var EP = meta && (meta.getAttribute('content') || '').trim();
  if (!EP || !navigator.sendBeacon) return;
  if (navigator.webdriver) return;
  if (/bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|prerender|facebookexternalhit|whatsapp\//i.test(navigator.userAgent || '')) return;

  var T0 = Date.now();
  var VID = rnd();
  var seq = 0;
  var sentEv = 0;
  var ev = [];
  var MAX_EV = 80;

  // ── активное время: страница видна и человек что-то делал в последние 20 с ──
  var activeMs = 0, lastTick = T0, lastInput = T0;
  function tick() {
    var now = Date.now();
    if (document.visibilityState === 'visible' && now - lastInput < 20000) {
      activeMs += Math.min(now - lastTick, 5000);
    }
    lastTick = now;
  }
  ['scroll', 'pointerdown', 'keydown', 'touchstart', 'mousemove'].forEach(function (t) {
    window.addEventListener(t, function () { lastInput = Date.now(); }, { passive: true, capture: true });
  });
  setInterval(tick, 1000);

  // ── глубина прокрутки и разделы ─────────────────────────────────────────
  var maxScroll = 0;
  function vh() { return window.innerHeight || document.documentElement.clientHeight || 800; }
  function scrollPct() {
    var h = Math.max(document.documentElement.scrollHeight - vh(), 1);
    return Math.min(100, Math.round((window.scrollY || window.pageYOffset || 0) / h * 100));
  }
  var curSection = 'top';
  var seen = [];        // разделы в порядке первого появления
  var seenSet = {};
  // раздел = ближайший сверху h2 с id; плюс крупные блоки шаблона
  var BLOCKS = [
    ['.sell-trust', 'trust'], ['.service-faq', 'faq'], ['.city-faq', 'faq'], ['.faq', 'faq'],
    ['.final-cta', 'final-cta'], ['#sec-reviews', 'reviews'], ['.cmap', 'map'],
    ['.pillar-guides', 'guides'], ['.pillar-cards-block', 'cards'], ['.inline-cta', 'inline-cta'],
    ['.cta-block', 'article-cta'], ['.article-services', 'services'], ['.article-promo', 'promo'],
    ['.site-footer', 'footer']
  ];
  function sectionName(el) {
    if (el.id) return el.id.slice(0, 48);
    return (el.textContent || '').trim().slice(0, 40);
  }
  function scanSections() {
    var marks = [];
    [].forEach.call(document.querySelectorAll('main h2, article h2, .pillar-doc h2'), function (h) {
      marks.push([h, sectionName(h)]);
    });
    BLOCKS.forEach(function (b) {
      var el = document.querySelector(b[0]);
      if (el) marks.push([el, '#' + b[1]]);
    });
    // порядок как на странице: иначе блоки шаблона шли бы после всех h2
    marks.sort(function (a, b) {
      return a[0].compareDocumentPosition(b[0]) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    return marks;
  }
  // раздел, в котором стоит элемент (а не тот, что сейчас на экране)
  function sectionOf(el) {
    var best = 'top';
    for (var i = 0; i < marks.length; i++) {
      var m = marks[i][0];
      if (m === el || m.contains(el)) { best = marks[i][1]; continue; }
      if (m.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) best = marks[i][1];
      else break;
    }
    return best;
  }
  var marks = [];
  function onScroll() {
    var p = scrollPct();
    if (p > maxScroll) maxScroll = p;
    var line = vh() * 0.45;
    var best = null, bestTop = -Infinity;
    for (var i = 0; i < marks.length; i++) {
      var top = marks[i][0].getBoundingClientRect().top;
      if (top < line && top > bestTop) { bestTop = top; best = marks[i][1]; }
      if (top < vh() * 0.85 && !seenSet[marks[i][1]]) {
        seenSet[marks[i][1]] = 1;
        seen.push(marks[i][1]);
      }
    }
    if (best) curSection = best;
  }
  var scrollTimer = 0;
  window.addEventListener('scroll', function () {
    if (scrollTimer) return;
    scrollTimer = setTimeout(function () { scrollTimer = 0; onScroll(); }, 250);
  }, { passive: true });

  // ── клики ───────────────────────────────────────────────────────────────
  var INTERACTIVE = 'a,button,summary,input,select,textarea,label,[role="button"],[onclick],[tabindex]';
  var lastClicks = [];
  var wa = 0, exitKind = '';
  function push(kind, label, target, el) {
    if (ev.length >= MAX_EV) return;
    ev.push({
      k: kind,
      l: (label || '').replace(/\s+/g, ' ').trim().slice(0, 60),
      t: (target || '').slice(0, 120),
      // липкая панель и шапка висят над любым разделом — берём тот, что на экране
      s: el && !el.closest('.sticky-cta,.site-nav,header,dialog') ? sectionOf(el) : curSection,
      ms: Date.now() - T0
    });
  }
  function elKey(el) {
    var cls = (el.className && typeof el.className === 'string') ? '.' + el.className.trim().split(/\s+/)[0] : '';
    return (el.tagName || '').toLowerCase() + cls;
  }
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest || e.isTrusted === false) return;   // клики из скриптов сайта — не действия человека
    var now = Date.now();
    // «злой» клик: 3 клика за секунду в одном месте
    lastClicks.push([now, e.clientX, e.clientY]);
    lastClicks = lastClicks.filter(function (c) { return now - c[0] < 1000; });
    if (lastClicks.length >= 3) {
      var a0 = lastClicks[0];
      if (Math.abs(a0[1] - e.clientX) < 40 && Math.abs(a0[2] - e.clientY) < 40) {
        push('rage', (t.textContent || '').slice(0, 40), elKey(t), t);
        lastClicks = [];
      }
    }
    var a = t.closest('a[href]');
    if (a) {
      var href = a.getAttribute('href') || '';
      var label = a.getAttribute('aria-label') || a.textContent || '';
      var where = a.getAttribute('data-cta') || elKey(a);
      if (/wa\.me|whatsapp\.com/i.test(href)) {
        wa = 1; exitKind = 'wa';
        push('wa', label, where, a);
        send(true);
        return;
      }
      if (/^tel:/i.test(href)) { exitKind = 'tel'; push('tel', label, where, a); send(true); return; }
      if (/^mailto:/i.test(href)) { exitKind = 'mail'; push('mail', label, where, a); send(true); return; }
      if (/t\.me\//i.test(href)) { exitKind = 'tg'; push('tg', label, where, a); send(true); return; }
      var u;
      try { u = new URL(href, location.href); } catch (err) { u = null; }
      if (u && u.host === location.host) {
        if (u.pathname === location.pathname && u.hash) { push('anchor', label, u.hash, a); return; }
        exitKind = 'internal';
        push('link', label, u.pathname, a);
      } else if (u) {
        exitKind = 'external';
        push('out', label, u.host + u.pathname, a);
      }
      return;
    }
    var s = t.closest('summary');
    if (s) {
      var d = s.parentNode;
      // details открывается после клика: open ещё false — значит раскрывают
      if (d && !d.open) push('faq', s.textContent, elKey(d), s);
      return;
    }
    var b = t.closest('button,[role="button"]');
    if (b) { push('btn', b.getAttribute('aria-label') || b.textContent, elKey(b), b); return; }
    if (t.closest(INTERACTIVE)) return;
    if (t === document.documentElement || t === document.body || t.tagName === 'MAIN') return;   // клик в пустой фон
    // «мёртвый» клик: нажали туда, где ничего не происходит — признак, что элемент выглядит кликабельным
    var cs = window.getComputedStyle(t);
    if (cs && cs.cursor === 'pointer') return;
    var txt = (t.textContent || '').trim();
    if (txt.length > 160) txt = '';   // клик по длинному абзацу — скорее выделение текста
    push('dead', txt, elKey(t), t);
  }, true);

  // ── поиск по сайту (что ищут и не находят) ───────────────────────────────
  var searchTimer = 0, lastQ = '';
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!el || el.type !== 'search') return;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      var q = (el.value || '').toLowerCase()
        .replace(/\S+@\S+/g, '')
        .replace(/\d/g, '#')
        .replace(/\s+/g, ' ').trim().slice(0, 60);
      if (q.length >= 3 && q !== lastQ) { lastQ = q; push('search', q, el.id || elKey(el)); }
    }, 1500);
  }, true);
  document.addEventListener('copy', function () { push('copy', '', curSection); }, true);

  // ── скорость: LCP и CLS ─────────────────────────────────────────────────
  var lcp = 0, cls = 0;
  try {
    new PerformanceObserver(function (l) {
      var es = l.getEntries(); var last = es[es.length - 1];
      if (last) lcp = Math.round(last.renderTime || last.loadTime || last.startTime);
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(function (l) {
      l.getEntries().forEach(function (x) { if (!x.hadRecentInput) cls += x.value; });
    }).observe({ type: 'layout-shift', buffered: true });
  } catch (err) { /* старые браузеры */ }

  // ── отправка ────────────────────────────────────────────────────────────
  function utm(name) {
    try { return (new URLSearchParams(location.search).get(name) || '').slice(0, 40); } catch (err) { return ''; }
  }
  var REF = (function () {
    try {
      if (!document.referrer) return '';
      var r = new URL(document.referrer);
      return r.host === location.host ? r.pathname : r.host;
    } catch (err) { return ''; }
  })();
  function send(final) {
    tick();
    onScroll();
    seq += 1;
    var payload = {
      v: 1,
      vid: VID,
      seq: seq,
      path: location.pathname.slice(0, 200),
      ref: REF.slice(0, 200),
      us: utm('utm_source'), um: utm('utm_medium'), uc: utm('utm_campaign'),
      w: window.innerWidth || 0,
      touch: ('ontouchstart' in window || navigator.maxTouchPoints > 0) ? 1 : 0,
      lang: (navigator.language || '').slice(0, 5),
      dur: Date.now() - T0,
      act: activeMs,
      sc: maxScroll,
      secs: seen.slice(0, 40),
      last: curSection,
      wa: wa,
      exit: final ? (exitKind || 'leave') : '',
      lcp: lcp,
      cls: Math.round(cls * 1000) / 1000,
      ev: ev.slice(sentEv)
    };
    sentEv = ev.length;
    try {
      navigator.sendBeacon(EP, new Blob([JSON.stringify(payload)], { type: 'text/plain;charset=UTF-8' }));
    } catch (err) { /* no-op */ }
  }

  function start() {
    marks = scanSections();
    onScroll();
    // первая отметка — просмотр засчитан, даже если уход не отправится
    setTimeout(function () { send(false); }, 2500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') send(true);
    else { exitKind = ''; lastInput = Date.now(); lastTick = Date.now(); }
  });
  window.addEventListener('pagehide', function () { send(true); });

  function rnd() {
    var a = new Uint8Array(8);
    (window.crypto || window.msCrypto).getRandomValues(a);
    return Array.prototype.map.call(a, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
  }
})();
