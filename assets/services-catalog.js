/* Поиск по каталогу услуг /services/ (2026-08-06, v2).

   v1 фильтровал только видимые ссылки карточек — топ-6 услуг на направление.
   Запрос «наследство» возвращал пустоту, хотя услуг наследства семь: они
   просто не входили в топ карточки. Теперь строка ищет по полному индексу
   сайта (/search-index.json — тот же, что у лупы в шапке) и показывает
   результаты списком над карточками; сами карточки не трогаем.

   Без скрипта поиск скрыт (<noscript> в шаблоне) — каталог полный.

   /uk/services/ (28.10.2026): индекс по <html lang> — /search-index.uk.json
   (украинские названия, ссылки на /uk/), как у лупы в шапке. */
(function () {
  var input = document.getElementById('svc-search');
  var grid = document.getElementById('svc-grid');
  var empty = document.getElementById('svc-search-empty');
  var resultsBox = document.getElementById('svc-results');
  if (!input || !grid || !resultsBox || !window.fetch) return;

  var index = null;
  var UK = (document.documentElement.getAttribute('lang') || '').slice(0, 2) === 'uk';

  function load() {
    if (index) return Promise.resolve(index);
    return fetch(UK ? '/search-index.uk.json' : '/search-index.json')
      .then(function (r) { return r.json(); })
      .then(function (data) { index = data; return data; });
  }

  /* апостроф и испанское ударение не важны: «сім'я» = «сімʼя»,
     «autonomo» находит «Autónomo» (как в site-search.js) */
  var LATIN = { 'á': 'a', 'à': 'a', 'â': 'a', 'ä': 'a', 'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
    'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i', 'ó': 'o', 'ò': 'o', 'ô': 'o', 'ö': 'o',
    'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u', 'ñ': 'n', 'ç': 'c' };
  function norm(s) {
    return (s || '').toLowerCase().replace(/ё/g, 'е').replace(/['’ʼ`]/g, '')
      .replace(/[áàâäéèêëíìîïóòôöúùûüñç]/g, function (c) { return LATIN[c]; });
  }

  function render(q) {
    var query = norm(q.trim());
    resultsBox.innerHTML = '';
    empty.hidden = true;
    if (query.length < 2) {
      resultsBox.hidden = true;
      grid.hidden = false;
      return;
    }
    if (!index) return;
    var hits = [];
    var pool = index.services || [];
    for (var i = 0; i < pool.length && hits.length < 40; i++) {
      if (norm(pool[i].t).indexOf(query) !== -1 ||
          norm(pool[i].c || '').indexOf(query) !== -1) {
        hits.push(pool[i]);
      }
    }
    grid.hidden = true;
    resultsBox.hidden = false;
    if (!hits.length) { empty.hidden = false; return; }
    hits.forEach(function (h) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = h.u;
      var b = document.createElement('b');
      b.textContent = h.t;
      a.appendChild(b);
      if (h.c && h.c !== 'Направление' && h.c !== 'Напрям') {
        var s = document.createElement('span');
        s.textContent = h.c;
        a.appendChild(s);
      }
      li.appendChild(a);
      resultsBox.appendChild(li);
    });
  }

  input.addEventListener('input', function () {
    var value = input.value;
    if (norm(value.trim()).length >= 2 && !index) {
      load().then(function () { render(input.value); });
      return;
    }
    render(value);
  });
})();
