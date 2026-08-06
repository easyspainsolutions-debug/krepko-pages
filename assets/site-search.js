/* Глобальный поиск по сайту (2026-08-06).

   Лупа в шапке (и строка в мобильном меню) открывает оверлей с полем,
   табами «Услуги | Блог» и списком результатов. Данные — /search-index.json,
   который генератор собирает из тех же источников, что и страницы:
   новые услуги и статьи попадают в поиск автоматически.

   Индекс загружается лениво при первом открытии. Без JS лупа не рендерит
   ничего интерактивного — она просто ссылка на /services/. */
(function () {
  var dlg = document.getElementById('site-search-dialog');
  if (!dlg || !window.fetch || typeof dlg.showModal !== 'function') return;

  var input = dlg.querySelector('.site-search__input');
  var list = dlg.querySelector('.site-search__results');
  var empty = dlg.querySelector('.site-search__empty');
  var tabs = [].slice.call(dlg.querySelectorAll('.site-search__tab'));
  var index = null;
  var mode = 'services';

  function load() {
    if (index) return Promise.resolve(index);
    return fetch('/search-index.json')
      .then(function (r) { return r.json(); })
      .then(function (data) { index = data; return data; });
  }

  function norm(s) { return (s || '').toLowerCase().replace(/ё/g, 'е'); }

  function render(q) {
    var query = norm(q.trim());
    list.innerHTML = '';
    empty.hidden = true;
    if (!index || query.length < 2) return;
    var pool = index[mode] || [];
    var hits = [];
    for (var i = 0; i < pool.length && hits.length < 30; i++) {
      if (norm(pool[i].t).indexOf(query) !== -1 ||
          norm(pool[i].c || '').indexOf(query) !== -1) {
        hits.push(pool[i]);
      }
    }
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
      list.appendChild(li);
    });
  }

  function setMode(next) {
    mode = next;
    tabs.forEach(function (t) {
      var on = t.dataset.mode === next;
      t.classList.toggle('is-on', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  function open(prefill) {
    /* каждое открытие начинается с услуг — прошлый таб не «залипает» */
    setMode('services');
    input.value = '';
    dlg.showModal();
    load().then(function () { render(input.value); });
    if (prefill) input.value = prefill;
    /* фокус после отрисовки диалога, иначе iOS не показывает клавиатуру */
    setTimeout(function () { input.focus(); }, 50);
    render(input.value);
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      setMode(tab.dataset.mode);
      render(input.value);
      input.focus();
    });
  });

  input.addEventListener('input', function () { render(input.value); });
  dlg.addEventListener('click', function (e) {
    /* клик по подложке (сам dialog) закрывает; контент ловит клики */
    if (e.target === dlg) dlg.close();
  });
  dlg.querySelector('.site-search__close').addEventListener('click', function () {
    dlg.close();
  });

  /* Кнопки-лупы: в шапке и в мобильном меню */
  [].forEach.call(document.querySelectorAll('[data-open-search]'), function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      /* если лупа нажата из мобильного меню — сперва закрываем его */
      var menu = document.getElementById('site-menu-dialog');
      if (menu && menu.open) menu.close();
      open('');
    });
  });

  /* горячая клавиша / — как на GitHub; ⌘K/Ctrl+K — как в доках */
  document.addEventListener('keydown', function (e) {
    if (dlg.open) return;
    var tag = (document.activeElement && document.activeElement.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
      e.preventDefault();
      open('');
    }
  });
})();
