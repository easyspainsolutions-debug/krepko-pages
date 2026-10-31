/* ═══════════════════════════════════════════════════════════════════════
   Обвязка сайта v3 (30.10.2026): шапка и полосы при прокрутке, нижняя
   полоса телефона, одна кнопка WhatsApp на экране, текущий раздел, меню.
   Файл глобальный — подключается в base.html на всех страницах, в блог и
   на юридические страницы его ставит tools/sync_blog_chrome.py.

   Итог v3 §3.5 и решения Daniil 30.10 (п. 5, 6), раскладка услуги 30.10:
   • <html data-bar="top|down|up">
       top  — первый экран (прокрутка меньше высоты окна): шапка на месте;
       down — ниже первого экрана листают вниз: шапка уезжает; на компьютере
              на её месте полоса поиска, на телефоне снизу — «Поиск + WhatsApp»;
       up   — листают вверх (от 6 px): шапка вернулась, полосы ушли.
     Пока открыты меню или поиск — <html data-bar-lock>, ничего не двигается.
     При фокусе с клавиатуры в шапке она возвращается (WCAG 2.4.11).
   • Выключатели — атрибут шапки data-bars (data/site.yaml → bars):
       hide-phone  — телефон прячет шапку (на главной — никогда; на странице
                     без нижней полосы — тоже: WhatsApp всегда на виду);
                     без него — как до v3: шапка всегда сверху, нижняя
                     полоса после первого экрана;
       search-desk — компьютер: полоса поиска вместо шапки;
       one-wa      — компьютер: кнопка шапки и полосы прячется на своём
                     месте, пока на экране кнопка WhatsApp в тексте.
   • Одна кнопка WhatsApp на экране: <html data-wa-in>, пока в поле зрения
     кнопка WhatsApp вне обвязки (залитая ссылка wa.me: под заголовком,
     карточка, врезка, отзывы, финал, статья). Телефон: нижняя полоса в это
     время спрятана, а вернувшаяся при прокрутке вверх шапка прячет свою
     кнопку; компьютер: кнопка шапки и полосы прячется (CSS).
   Метки Pulse и GA4 — data-cta на ссылках (header, bar, sticky, menu …).
   ═══════════════════════════════════════════════════════════════════════ */
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

  /* ── текущий раздел: черта под пунктом шапки, отметка в меню ──
     «Каталог услуг» — на каталоге, разделах, услугах и городах (итог v3
     §3.5: «на всех страницах каталога, включая услуги»). */
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

  /* ── состояния полос ── */
  var state = '';
  var last = window.scrollY || 0;
  var acc = 0;
  var waIn = false;     // кнопка WhatsApp вне обвязки — на экране
  var footIn = false;   // подвал на экране: нижняя полоса уходит, на телефоне
                        // возвращается шапка — кнопка WhatsApp остаётся на виду

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
    else on = (window.scrollY || 0) > window.innerHeight * 0.8;   // как до v3
    bbar.classList.toggle('is-on', on && !waIn && !footIn);
  }
  function set(s) {
    if (s === state) return;
    state = s;
    root.setAttribute('data-bar', s);
    paint();
    schedule();   // верхняя кромка «видимости» кнопок зависит от состояния
  }
  /* у подвала на телефоне шапка стоит на месте — пока на экране нет кнопки
     WhatsApp в тексте (финал ещё виден — его кнопки достаточно) */
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

  /* фокус с клавиатуры в уехавшей шапке — шапка возвращается */
  var inner = nav.querySelector('.site-nav__inner');
  nav.addEventListener('focusin', function (e) {
    if (state === 'down' && inner && inner.contains(e.target)) set('up');
  });

  /* меню или поиск открыты — полосы стоят; закрыли — считаем заново */
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

  /* ── одна кнопка WhatsApp на экране ──
     Кнопка — залитая ссылка WhatsApp вне обвязки высотой от 32 px: под
     заголовком, карточка, врезка, отзывы, финал, кнопки статьи. Текстовые
     ссылки «в WhatsApp» (строки каталога, подвал) кнопками не считаются.
     Кнопка «на экране», когда видна хотя бы наполовину: краешек у края окна
     ещё не считается — иначе на миг не видно ни одной кнопки (приёмка
     раскладки услуги 30.10: 0 мест с двумя кнопками и 0 мест без кнопки).
     Верхняя кромка — низ того, что сейчас стоит сверху: шапки (её итоговое
     место, а не кадр анимации) или полосы поиска; кнопка под ними не видна. */
  var CHROME = '.topbar, .site-nav, .sticky-cta, dialog, .cookie-consent';
  function isButton(a) {
    if (a.closest(CHROME) || a.offsetHeight < 32) return false;
    var bg = window.getComputedStyle(a).backgroundColor || '';
    return !!bg && bg !== 'transparent' && !/^rgba\(.*,\s*0\)$/.test(bg);
  }
  /* Баннер cookies (первый заход, до выбора) закрывает часть низа окна:
     кнопка под ним не видна. На компьютере баннер не во всю ширину — кнопка
     рядом с ним видна, поэтому сверяем по горизонтали. */
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
    // шапка уехала: на компьютере сверху полоса поиска (64 + 1), на телефоне — ничего
    if (state === 'down') return desk.matches && searchBar ? searchBar.offsetHeight : 0;
    var tb = topbar ? topbar.getBoundingClientRect().bottom : 0;
    return Math.max(0, tb) + nav.offsetHeight;
  }
  function inView(el, top) {
    var r = el.getBoundingClientRect();
    if (!r.height) return false;
    return Math.min(r.bottom, floor(r)) - Math.max(r.top, top) >= r.height / 2;
  }
  /* кнопок на странице 2–6 — их места проверяются на каждый кадр прокрутки */
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
    check();   // сразу, без мигания кнопки в шапке
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  /* подвал: нижняя полоса уходит, чтобы не закрывать юридические ссылки, а на
     телефоне возвращается шапка — с её кнопкой WhatsApp (у подвала своей
     кнопки нет, а финал уже уехал вверх). У финала и плашки статьи своя
     кнопка — там полосу прячет правило «одна кнопка» выше. */
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
    /* баннер выезжает 0,28 с — проверяем и после его анимации */
    new MutationObserver(function () { schedule(); setTimeout(schedule, 350); })
      .observe(consent, { attributes: true, attributeFilter: ['hidden'] });
  }
  /* шрифт кожи меняет высоты — пересчёт, когда он загрузился */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(watchButtons);
})();


/* Аккордеоны FAQ: одновременно открыт только один вопрос в группе.
   Решение Daniil (2026-08-07) — по всему сайту, а не только на главной,
   где такая логика жила внутри home-redesign.js вместе с анимацией.

   Слушаем нативное событие toggle на всплытии: оно приходит и от клика,
   и от клавиатуры, и от программного открытия. Группой считаем ближайший
   общий контейнер списка — так соседние FAQ-блоки на одной странице
   (например, в статье и в блоке услуги) не гасят друг друга.

   Блок на главной пропускаем: там раскрытие анимируется вручную и уже
   закрывает соседей — вмешательство сорвало бы анимацию на полпути. */
(function () {
  document.addEventListener('toggle', function (e) {
    var d = e.target;
    if (!d || d.tagName !== 'DETAILS' || !d.open) return;
    if (d.closest('.home-faq')) return;

    var group = d.closest('.faq__list') || d.parentElement;
    if (!group) return;

    var siblings = group.querySelectorAll(':scope > details[open]');
    for (var i = 0; i < siblings.length; i++) {
      if (siblings[i] !== d) siblings[i].open = false;
    }
  }, true);   /* capture: toggle не всплывает */
})();


/* Меню телефона: закрытие и цвет статус-бара. Раньше этот код лежал инлайном
   внутри каждого из 225 HTML — одно и то же тело скачивалось заново на
   каждом переходе. Меню в один уровень (v3, 30.10.2026): второй уровень
   каталога и флаг data-nav="flat" сняты. */
(function(){
  var d = document.getElementById('site-menu-dialog');
  var trigger = document.querySelector('.site-nav__menu-btn');
  if (!d) return;

  /* Статус-бар iOS под цвет открытого меню — почему так, см. site-nav.css.
     Слушаем атрибут open, а не событие close: dialog.close() из скрипта
     событие не диспатчит. */
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var themeIdle = themeMeta ? themeMeta.getAttribute('content') : null;
  if (themeMeta && themeIdle && window.MutationObserver) {
    new MutationObserver(function(){
      /* цвет листа — фон кожи (--k-bg, assets/theme-<x>.css; 30.10.2026) */
      var sheet = (getComputedStyle(document.documentElement).getPropertyValue('--k-bg') || '').trim();
      themeMeta.setAttribute('content', d.hasAttribute('open') ? (sheet || themeIdle) : themeIdle);
    }).observe(d, {attributes: true, attributeFilter: ['open']});
  }

  /* Доступность: клик по подложке и Esc закрывают, фокус возвращается на кнопку. */
  d.addEventListener('click', function(e){ if (e.target === d) d.close(); });
  d.addEventListener('keydown', function(e){
    if (e.key === 'Escape') { e.preventDefault(); d.close(); }
  });
  /* Чем закрыли меню — пальцем/мышью или клавиатурой: после касания фокус
     возвращаем без кольца (iOS рисовал обводку бургера, Daniil 28.10) */
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
    /* preventScroll: без него браузер подкатывал страницу к кнопке —
       прыжок вверх на 70–78 px после закрытия меню (разбор /es/ 28.10) */
    try { trigger.focus({ preventScroll: true }); } catch (_) {}
  });
})();
