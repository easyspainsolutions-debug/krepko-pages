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
  cats.forEach(function (cat) {
    var head = cat.querySelector('.pillar-cat__head');
    if (!head) return;
    head.addEventListener('click', function () {
      var open = cat.classList.toggle('is-open');
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* ── deep-link на категорию ──
     Мегаменю ведёт на /notario/#{slug категории}: раскрываем её, на узком
     экране открываем и саму панель каталога, затем скроллим к категории.
     Выполняется до инициализации поиска, чтобы его снимок раскрытых
     категорий (opened) включал и эту — сброс поиска не схлопнет её. */
  (function () {
    var slug = (location.hash || '').slice(1);
    if (!/^[a-z-]+$/.test(slug)) return;
    var cat = nav.querySelector('.pillar-cat[data-cat="' + slug + '"]');
    if (!cat) return;
    cat.classList.add('is-open');
    var head = cat.querySelector('.pillar-cat__head');
    if (head) head.setAttribute('aria-expanded', 'true');
    nav.classList.add('is-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
    /* после раскрытия — высота панели уже посчитана, скроллим к категории */
    var noAnim = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(function () {
      cat.scrollIntoView({ block: 'start', behavior: noAnim ? 'auto' : 'smooth' });
    }, 80);
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
