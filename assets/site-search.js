/* Глобальный поиск по сайту (2026-08-06, v2 — механика Spotlight).

   Лупа в шапке и строка в мобильном меню открывают оверлей: капсула ввода,
   табы «Услуги | Блог», результаты. Данные — /search-index.json, который
   генератор собирает из тех же источников, что и страницы, поэтому новые
   услуги и статьи попадают в поиск автоматически.

   Что делает поиск «нативным» помимо вида: стрелки ↑/↓ ведут по списку,
   Enter открывает выбранное, Esc закрывает (нативный <dialog>), совпадение
   подсвечивается, а пустое поле показывает частые задачи вместо пустоты.

   Индекс грузится лениво при первом открытии. Без JS лупа — просто ссылка
   на /services/. */
(function () {
  var dlg = document.getElementById('site-search-dialog');
  if (!dlg || !window.fetch || typeof dlg.showModal !== 'function') return;

  var input = dlg.querySelector('.site-search__input');
  var list = dlg.querySelector('.site-search__results');
  var empty = dlg.querySelector('.site-search__empty');
  var suggest = dlg.querySelector('.site-search__suggest');
  var tabs = [].slice.call(dlg.querySelectorAll('.site-search__tab'));
  var chips = [].slice.call(dlg.querySelectorAll('.site-search__chips button'));
  var index = null;
  var mode = 'services';
  var cursor = -1;          /* индекс выделенной строки; -1 — ничего не выбрано */

  function load() {
    if (index) return Promise.resolve(index);
    return fetch('/search-index.json')
      .then(function (r) { return r.json(); })
      .then(function (data) { index = data; return data; });
  }

  /* ё и Ё ищутся наравне с е — иначе «счёт» не найдёт «счет» и наоборот */
  function norm(s) { return (s || '').toLowerCase().replace(/ё/g, 'е'); }

  /* подсветка совпадения без innerHTML: текст приходит из индекса, но
     собирать разметку строками — лишний риск, поэтому узлами */
  function highlight(text, query) {
    var frag = document.createDocumentFragment();
    var at = norm(text).indexOf(query);
    if (at === -1 || !query) {
      frag.appendChild(document.createTextNode(text));
      return frag;
    }
    frag.appendChild(document.createTextNode(text.slice(0, at)));
    var mark = document.createElement('mark');
    mark.textContent = text.slice(at, at + query.length);
    frag.appendChild(mark);
    frag.appendChild(document.createTextNode(text.slice(at + query.length)));
    return frag;
  }

  function setCursor(next) {
    var items = list.children;
    if (!items.length) { cursor = -1; return; }
    if (next < 0) next = items.length - 1;
    if (next >= items.length) next = 0;
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('is-active', i === next);
    }
    cursor = next;
    var a = items[next].querySelector('a');
    if (a && a.scrollIntoView) a.scrollIntoView({ block: 'nearest' });
  }

  function render(q) {
    var query = norm(q.trim());
    list.innerHTML = '';
    empty.hidden = true;
    cursor = -1;

    /* пустой запрос — показываем частые задачи, а не пустой список */
    if (query.length < 2) {
      if (suggest) suggest.hidden = false;
      return;
    }
    if (suggest) suggest.hidden = true;
    if (!index) return;

    var pool = index[mode] || [];
    var hits = [];
    for (var i = 0; i < pool.length && hits.length < 30; i++) {
      if (norm(pool[i].t).indexOf(query) !== -1 ||
          norm(pool[i].c || '').indexOf(query) !== -1) {
        hits.push(pool[i]);
      }
    }
    if (!hits.length) { empty.hidden = false; return; }

    hits.forEach(function (h, i) {
      var li = document.createElement('li');
      li.style.setProperty('--i', i);          /* каскад появления, см. CSS */
      var a = document.createElement('a');
      a.href = h.u;
      var b = document.createElement('b');
      b.appendChild(highlight(h.t, query));
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

  function open() {
    setMode('services');
    input.value = '';
    render('');
    dlg.showModal();
    load().then(function () { render(input.value); });
    /* фокус после отрисовки — иначе iOS не поднимает клавиатуру */
    setTimeout(function () { input.focus(); }, 50);
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      setMode(tab.dataset.mode);
      render(input.value);
      input.focus();
    });
  });

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      input.value = chip.dataset.q;
      load().then(function () { render(input.value); input.focus(); });
    });
  });

  input.addEventListener('input', function () {
    if (!index) { load().then(function () { render(input.value); }); return; }
    render(input.value);
  });

  /* клавиатура: ↑/↓ по результатам, Enter — переход */
  dlg.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(cursor + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(cursor - 1); }
    else if (e.key === 'Enter') {
      var active = list.children[cursor] || list.children[0];
      var a = active && active.querySelector('a');
      if (a) { e.preventDefault(); window.location.href = a.getAttribute('href'); }
    }
  });

  dlg.addEventListener('click', function (e) {
    /* клик по подложке закрывает; внутри панели — нет */
    if (e.target === dlg) dlg.close();
  });
  dlg.querySelector('.site-search__close').addEventListener('click', function () {
    dlg.close();
  });

  /* Кнопки-лупы: в шапке и в мобильном меню */
  [].forEach.call(document.querySelectorAll('[data-open-search]'), function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var menu = document.getElementById('site-menu-dialog');
      if (menu && menu.open) menu.close();
      open();
    });
  });

  /* горячие клавиши: / как на GitHub, ⌘K/Ctrl+K как в доках */
  document.addEventListener('keydown', function (e) {
    if (dlg.open) return;
    var tag = (document.activeElement && document.activeElement.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
      e.preventDefault();
      open();
    }
  });
})();
