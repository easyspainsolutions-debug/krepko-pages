/* Поиск по каталогу услуг /services/ (2026-08-06, v2).

   v1 фильтровал только видимые ссылки карточек — топ-6 услуг на направление.
   Запрос «наследство» возвращал пустоту, хотя услуг наследства семь: они
   просто не входили в топ карточки. Теперь строка ищет по полному индексу
   сайта (/search-index.json — тот же, что у лупы в шапке) и показывает
   результаты списком над карточками; сами карточки не трогаем.

   Без скрипта поиск скрыт (<noscript> в шаблоне) — каталог полный. */
(function () {
  var input = document.getElementById('svc-search');
  var grid = document.getElementById('svc-grid');
  var empty = document.getElementById('svc-search-empty');
  var resultsBox = document.getElementById('svc-results');
  if (!input || !grid || !resultsBox || !window.fetch) return;

  var index = null;

  function load() {
    if (index) return Promise.resolve(index);
    return fetch('/search-index.json')
      .then(function (r) { return r.json(); })
      .then(function (data) { index = data; return data; });
  }

  function norm(s) { return (s || '').toLowerCase().replace(/ё/g, 'е'); }

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
      if (h.c && h.c !== 'Направление') {
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
