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
