/* Левая колонка страницы направления: аккордеоны категорий, живой поиск по
   каталогу и сворачивание всей панели на узком экране.

   Без скрипта каталог остаётся раскрытым (см. <noscript> в шаблоне) —
   ссылки на услуги доступны всегда, поиск просто прячется. */
(function () {
  var nav = document.querySelector('.pillar-nav');
  if (!nav) return;

  /* ── панель целиком: кнопка с названием текущей страницы (мобильный) ── */
  var toggle = nav.querySelector('.pillar-nav__toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ── категории ── */
  var cats = [].slice.call(nav.querySelectorAll('.pillar-cat'));

  function closeOtherCats(keep) {
    cats.forEach(function (c) {
      if (c === keep || !c.classList.contains('is-open')) return;
      c.classList.remove('is-open');
      var h = c.querySelector('.pillar-cat__head');
      if (h) h.setAttribute('aria-expanded', 'false');
    });
  }
  cats.forEach(function (cat) {
    var head = cat.querySelector('.pillar-cat__head');
    if (!head) return;
    head.addEventListener('click', function () {
      var open = !cat.classList.contains('is-open');
      /* Открытая категория закрывает остальные: восемь раскрытых списков
         по 11 услуг превращают колонку в простыню, в которой не найти,
         где ты находишься (решение Daniil, 2026-08-07 — по всему сайту). */
      if (open) closeOtherCats(cat);
      cat.classList.toggle('is-open', open);
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* ── deep-link на категорию ──
     Мегаменю ведёт на /notario/#{slug категории}: раскрываем её, на узком
     экране открываем и саму панель каталога, скроллим и зажигаем
     терракотовую вспышку — сразу видно, куда смотреть и что нажимать.
     На загрузке выполняется до инициализации поиска, чтобы его снимок
     раскрытых категорий (opened) включал и эту; hashchange покрывает клик
     по мегаменю, когда посетитель уже стоит на странице направления. */
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
    /* после раскрытия высота панели уже посчитана — скроллим, по прибытии
       вспыхиваем. Снятие класса по таймеру, не по animationend: при
       reduce-motion анимации нет, а подсветка гаснуть всё равно должна. */
    setTimeout(function () {
      cat.scrollIntoView({ block: 'start', behavior: noAnim ? 'auto' : 'smooth' });
      setTimeout(function () {
        cat.classList.remove('is-hilite');
        void cat.offsetWidth;   /* перезапуск анимации при повторном переходе */
        cat.classList.add('is-hilite');
        setTimeout(function () { cat.classList.remove('is-hilite'); }, 2100);
      }, noAnim ? 60 : 480);
    }, 80);
  }
  goToCat((location.hash || '').slice(1));
  window.addEventListener('hashchange', function () {
    goToCat((location.hash || '').slice(1));
  });

  /* ── вспышка на самой странице услуги ──
     Мегаменю ведёт в раздел двумя способами. У нотариуса пункты указывают на
     хаб с якорем категории (/notario/#doverennosti) — там срабатывает goToCat
     выше, категория раскрывается и вспыхивает. А у остальных направлений
     пункты ведут прямо на страницу услуги (/ukraina/spravka-o-nesudimosti/),
     где якоря нет, и подсветки не было вовсе: человек попадал на страницу без
     подсказки, в каком месте каталога он оказался (замечание владельца
     2026-08-09).

     Ведёт на услугу — правильнее, чем на хаб: меньше кликов. Поэтому не
     меняем ссылки, а зажигаем ту же вспышку у категории с активным пунктом.
     Скролл здесь не нужен — категория и так раскрыта сервером и видна.

     Только при заходе извне: если человек ходит по каталогу внутри раздела,
     мигать на каждой странице незачем — он и так знает, где находится. */
  (function flashCurrentCat() {
    if (location.hash) return;                    /* якорь уже отработал выше */
    var cur = nav.querySelector('.pillar-nav__current');
    if (!cur) return;                             /* мы на хабе, активного нет */
    var cat = cur.closest('.pillar-cat');
    if (!cat) return;
    var from = document.referrer;
    if (from) {
      try {
        var sameSection = new URL(from).pathname.indexOf(
          location.pathname.split('/').slice(0, 2).join('/') + '/'
        ) === 0;
        if (sameSection) return;                  /* переход внутри раздела */
      } catch (e) { /* нечитаемый referrer — считаем переходом извне */ }
    }
    setTimeout(function () {
      cat.classList.add('is-hilite');
      setTimeout(function () { cat.classList.remove('is-hilite'); }, 2100);
    }, 260);
  })();

  /* ── дорожка шагов ──
     Вертикальный вариант анимации с главной («Как мы работаем»): линия между
     кружками заливается терракотой по мере прокрутки, кружок загорается,
     когда заливка до него дошла. */
  (function () {
    var steps = document.querySelector('.pillar-steps');
    if (!steps) return;
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
      var start = vh * 0.86;          /* блок вошёл снизу — прогресс 0 */
      var end = vh * 0.32;            /* дошёл до верхней трети — прогресс 1 */
      var p = (start - r.top) / (start - end);
      p = p < 0 ? 0 : (p > 1 ? 1 : p);

      items.forEach(function (li, i) {
        if (i < segs) {
          var s = p * segs - i;
          s = s < 0 ? 0 : (s > 1 ? 1 : s);
          li.style.setProperty('--seg', s.toFixed(3));
        }
        /* первый кружок загорается сразу, остальные — когда линия дошла */
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

  /* ── поиск ──
     Шестьдесят с лишним услуг листать неудобно: набор двух букв прячет всё
     несовпадающее и раскрывает категории, где что-то нашлось. Пустой запрос
     возвращает исходное состояние — раскрытой остаётся только категория
     текущей страницы. */
  var input = document.getElementById('pillar-search');
  var empty = document.getElementById('pillar-search-empty');
  if (!input) return;

  var opened = cats.filter(function (c) { return c.classList.contains('is-open'); });

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
    var q = input.value.trim().toLowerCase();
    if (q.length < 2) { reset(); return; }

    var found = 0;
    cats.forEach(function (cat) {
      var hits = 0;
      [].forEach.call(cat.querySelectorAll('li'), function (li) {
        var match = li.textContent.toLowerCase().indexOf(q) !== -1;
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
