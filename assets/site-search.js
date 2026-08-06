/* Глобальный поиск по сайту (2026-08-06, v3 — поиск по смыслу).
 *
 * Лупа в шапке и строка в мобильном меню открывают оверлей. Данные —
 * /search-index.json, который генератор собирает из тех же источников, что и
 * страницы, поэтому новые услуги и статьи попадают в поиск автоматически.
 *
 * ГЛАВНОЕ ОТЛИЧИЕ ОТ v2. Раньше искалось подстрокой по названию услуги, и это
 * работало только для тех, кто уже знает термин. Реальный клиент приходит со
 * словами «продать квартиру», «умер отец», «машина» — и не находил ничего.
 * Теперь у каждой записи есть слой ключевых слов (описание страницы, рубрика
 * статьи и словарь data/search_synonyms.yaml), а запрос разбирается по словам:
 *
 *   1. отбрасываются предлоги и союзы;
 *   2. с каждого слова снимается русское окончание — «квартиру» и «квартира»
 *      сходятся к одной основе, иначе поиск ловил бы только точную форму;
 *   3. КАЖДОЕ слово запроса обязано найтись хоть где-то в записи, иначе она
 *      отсеивается. Это и даёт точность: словарь широкий, и без такого «и»
 *      частые слова вроде «документ» вытаскивали бы половину каталога;
 *   4. счёт зависит от того, ГДЕ нашлось: название весит больше категории,
 *      категория больше ключевых слов. Поэтому прямое попадание в название
 *      всегда наверху, а смысловые совпадения идут следом.
 *
 * Опечатки прощаются на словах от пяти букв — одна лишняя, пропущенная или
 * перепутанная буква ещё находит услугу, но с низким весом.
 *
 * Индекс грузится лениво при первом открытии. Без JS лупа — просто ссылка
 * на /services/.
 */
(function () {
  var dlg = document.getElementById('site-search-dialog');
  if (!dlg || !window.fetch || typeof dlg.showModal !== 'function') return;

  var panel = dlg.querySelector('.site-search__panel');
  var drop = dlg.querySelector('.site-search__drop');
  var input = dlg.querySelector('.site-search__input');
  var list = dlg.querySelector('.site-search__results');
  var empty = dlg.querySelector('.site-search__empty');
  var suggest = dlg.querySelector('.site-search__suggest');
  var toggle = dlg.querySelector('.site-search__toggle');
  var tabs = [].slice.call(dlg.querySelectorAll('.site-search__tab'));
  var chips = [].slice.call(dlg.querySelectorAll('.site-search__chips button'));
  var index = null;
  var mode = 'services';
  var cursor = -1;          /* индекс выделенной строки; -1 — ничего не выбрано */

  var MODES = {
    services: {
      placeholder: 'Что нужно оформить?',
      tip: 'Переключить на блог',
      aria: 'Ищем в услугах. Переключить на блог'
    },
    blog: {
      placeholder: 'О чём почитать?',
      tip: 'Переключить на услуги',
      aria: 'Ищем в блоге. Переключить на услуги'
    }
  };

  /* ── разбор языка ───────────────────────────────────────────────────── */

  /* Служебные слова: сами по себе ничего не значат, но при правиле «каждое
     слово должно найтись» отсекали бы верные результаты. */
  var STOP = {};
  ('на для при про под над без из от до за по как что где или и а но это ' +
   'мне мой моя мои все еще уже там тут его ее их не да')
    .split(' ').forEach(function (w) { STOP[w] = 1; });

  /* Окончания снимаются от длинных к коротким; основа короче четырёх букв
     не режется — иначе «брак» превратился бы в «бра» и поймал бы «браслет». */
  var SUFFIXES = ['иями', 'ями', 'ами', 'ого', 'его', 'ому', 'ему', 'ыми', 'ими',
    'ах', 'ях', 'ов', 'ев', 'ей', 'ий', 'ый', 'ая', 'яя', 'ое', 'ее', 'ую', 'юю',
    'ам', 'ям', 'ом', 'ем', 'ы', 'и', 'а', 'я', 'о', 'е', 'у', 'ю', 'ь', 'й'];

  function norm(s) { return (s || '').toLowerCase().replace(/ё/g, 'е'); }

  function stem(w) {
    for (var i = 0; i < SUFFIXES.length; i++) {
      var s = SUFFIXES[i];
      if (w.length - s.length >= 4 && w.slice(-s.length) === s) {
        return w.slice(0, w.length - s.length);
      }
    }
    return w;
  }

  function tokenize(s) {
    var parts = norm(s).split(/[^0-9a-zа-я]+/);
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].length >= 2 && !STOP[parts[i]]) out.push(parts[i]);
    }
    return out;
  }

  function stems(s) { return tokenize(s).map(stem); }

  /* Расстояние Левенштейна ≤ 1: одна вставка, пропуск или замена. */
  function near(a, b) {
    if (a === b) return true;
    var la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1) return false;
    var i = 0, j = 0, diff = 0;
    while (i < la && j < lb) {
      if (a.charAt(i) === b.charAt(j)) { i++; j++; continue; }
      if (++diff > 1) return false;
      if (la > lb) i++;
      else if (lb > la) j++;
      else { i++; j++; }
    }
    return diff + (la - i) + (lb - j) <= 1;
  }

  /* ── поиск ──────────────────────────────────────────────────────────── */

  function prepare(e) {
    if (e._ready) return;
    e._ready = 1;
    e._title = norm(e.t);
    e._ts = stems(e.t);
    e._cs = stems(e.c || '');
    e._ks = stems(e.k || '');     /* слова про эту услугу */
    e._kcs = stems(e.kc || '');   /* слова про всю категорию — весят меньше */
  }

  /* Вес одного слова запроса. 0 — слово не найдено, запись отсеивается. */
  function tokenScore(e, raw) {
    var qs = stem(raw), i;
    if (e._title.indexOf(raw) === 0) return 120;      /* название с этого и начинается */
    for (i = 0; i < e._ts.length; i++) {
      if (e._ts[i] === qs) return 80;                 /* слово названия целиком */
      if (e._ts[i].indexOf(qs) === 0) return 62;      /* начало слова названия */
    }
    if (e._title.indexOf(raw) !== -1) return 45;
    for (i = 0; i < e._cs.length; i++) {
      if (e._cs[i].indexOf(qs) === 0) return 32;      /* попали в категорию */
    }
    for (i = 0; i < e._ks.length; i++) {
      if (e._ks[i] === qs) return 26;                 /* слово клиента про эту услугу */
      if (e._ks[i].indexOf(qs) === 0) return 18;
    }
    for (i = 0; i < e._kcs.length; i++) {
      if (e._kcs[i] === qs) return 14;                /* слово про категорию целиком */
      if (e._kcs[i].indexOf(qs) === 0) return 10;
    }
    if (qs.length >= 5) {                             /* последний шанс: опечатка */
      for (i = 0; i < e._ts.length; i++) if (near(e._ts[i], qs)) return 8;
      for (i = 0; i < e._ks.length; i++) if (near(e._ks[i], qs)) return 5;
    }
    return 0;
  }

  function collect(pool, toks, minMatched) {
    var hits = [];
    for (var i = 0; i < pool.length; i++) {
      var e = pool[i];
      prepare(e);
      var total = 0, matched = 0;
      for (var j = 0; j < toks.length; j++) {
        var s = tokenScore(e, toks[j]);
        if (s) { matched++; total += s; }
      }
      if (matched >= minMatched) hits.push({ e: e, s: total, n: matched });
    }
    /* Сначала те, где совпало больше слов запроса; при равенстве — вес
       совпадений; при равном весе — короткое название: «Апостиль» нужнее,
       чем «Апостиль, переводы и легализация документов». */
    hits.sort(function (a, b) {
      return b.n - a.n || b.s - a.s || a.e.t.length - b.e.t.length;
    });
    return hits.slice(0, 12).map(function (h) { return h.e; });
  }

  function search(pool, query, toks) {
    if (!toks.length) return [];
    var strict = collect(pool, toks, toks.length);
    if (strict.length || toks.length < 2) return strict;
    /* Строгий проход пуст — значит какое-то слово запроса словарю незнакомо
       («умер отец»: «умер» есть, «отец» нет). Вместо пустого экрана отдаём
       записи, где нашлась хотя бы часть запроса, — совпавших слов больше,
       позиция выше. Никакой словарь не покроет весь язык, и молчать из-за
       одного лишнего слова — худшее, что поиск может сделать. */
    return collect(pool, toks, 1);
  }

  /* ── отрисовка ──────────────────────────────────────────────────────── */

  /* Подсветка слов запроса. Сравнение идёт по основам, а не по подстроке:
     «квартиру» должно подсветить «квартира», иначе на половине запросов
     подсветка молчит, хотя результат найден верно.
     Если слово названия начинается прямо с введённого — подсвечивается только
     набранная часть («наслед» в «Наследстве»), это показывает, докуда человек
     дописал. Если совпали лишь основы — красится слово целиком.
     Смысловые попадания через словарь («продать квартиру» → «Продажа
     недвижимости») не подсвечиваются вовсе: в названии этих букв нет, и
     рисовать там подсветку значило бы врать о причине совпадения.
     Собирается узлами, а не строкой: текст приходит из индекса, но склеивать
     разметку конкатенацией — лишний риск. */
  function highlight(text, toks) {
    var qs = toks.map(stem);
    var spans = [];
    var re = /[0-9A-Za-zА-Яа-яЁё]+/g, m;
    while ((m = re.exec(text)) !== null) {
      var word = norm(m[0]), ws = stem(word), len = 0;
      for (var i = 0; i < toks.length; i++) {
        if (word.indexOf(toks[i]) === 0) len = Math.max(len, toks[i].length);
        /* Обратное направление (основа слова короче запроса) нужно для форм
           вроде «счёт» ← «счета», но на коротких словах оно врёт: в запросе
           «внж» предлог «в» из «в Испании» оказывался префиксом запроса и
           подсвечивался. Отсюда порог в четыре буквы. */
        else if (ws.length >= 4 && (ws.indexOf(qs[i]) === 0 || qs[i].indexOf(ws) === 0)) {
          len = Math.max(len, m[0].length);
        }
      }
      if (len) spans.push([m.index, m.index + Math.min(len, m[0].length)]);
    }
    var frag = document.createDocumentFragment();
    if (!spans.length) {
      frag.appendChild(document.createTextNode(text));
      return frag;
    }
    spans.sort(function (a, b) { return a[0] - b[0]; });
    var pos = 0;
    for (var k = 0; k < spans.length; k++) {
      if (spans[k][0] < pos) continue;               /* перекрытие — пропускаем */
      if (spans[k][0] > pos) {
        frag.appendChild(document.createTextNode(text.slice(pos, spans[k][0])));
      }
      var mark = document.createElement('mark');
      mark.textContent = text.slice(spans[k][0], spans[k][1]);
      frag.appendChild(mark);
      pos = spans[k][1];
    }
    if (pos < text.length) frag.appendChild(document.createTextNode(text.slice(pos)));
    return frag;
  }

  /* Высота раскрытой части = фактическая высота содержимого. Пересчитывается
     на каждой букве, поэтому панель плавно перетекает между двумя и восемью
     результатами. Фиксированное значение в CSS дало бы рывок: анимация
     доезжала бы до конца уже после того, как контент упёрся в свою высоту.
     На мобильном переменная не используется — там панель не схлопывается. */
  function syncHeight() {
    panel.style.setProperty('--drop-h', drop.scrollHeight + 'px');
  }

  function render() {
    var query = input.value.trim();
    var toks = tokenize(query);
    /* Запрос из одних предлогов («как», «что») — ищем как есть, иначе поиск
       молча ничего не покажет на непустой строке. */
    if (!toks.length && norm(query).length >= 2) toks = [norm(query)];

    list.innerHTML = '';
    cursor = -1;

    var hits = (index && query.length >= 2) ? search(index[mode] || [], query, toks) : [];

    hits.forEach(function (h, i) {
      var li = document.createElement('li');
      li.style.setProperty('--i', i);          /* каскад появления, см. CSS */
      var a = document.createElement('a');
      a.href = h.u;
      var b = document.createElement('b');
      b.appendChild(highlight(h.t, toks));
      a.appendChild(b);
      if (h.c && h.c !== 'Направление') {
        var s = document.createElement('span');
        s.textContent = h.c;
        a.appendChild(s);
      }
      li.appendChild(a);
      list.appendChild(li);
    });

    var nothing = query.length >= 2 && !!index && !hits.length;
    empty.hidden = !nothing;
    /* Частые запросы: на мобильном встречают при пустой строке, на десктопе
       работают как запасной выход, когда ничего не нашлось. */
    if (suggest) suggest.hidden = !(query.length < 2 || nothing);

    /* Панель раскрывается, только когда внутри действительно что-то есть —
       пока грузится индекс, овал остаётся собранным и не мигает пустотой. */
    panel.classList.toggle('is-open', hits.length > 0 || nothing);
    syncHeight();
  }

  /* ── режимы ─────────────────────────────────────────────────────────── */

  function setMode(next) {
    mode = next;
    var m = MODES[next];
    input.placeholder = m.placeholder;
    tabs.forEach(function (t) {
      var on = t.dataset.mode === next;
      t.classList.toggle('is-on', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (toggle) {
      toggle.classList.toggle('is-blog', next === 'blog');
      toggle.setAttribute('data-tip', m.tip);
      toggle.setAttribute('aria-label', m.aria);
    }
  }

  function load() {
    if (index) return Promise.resolve(index);
    return fetch('/search-index.json')
      .then(function (r) { return r.json(); })
      .then(function (data) { index = data; return data; });
  }

  function open() {
    setMode('services');
    input.value = '';
    panel.classList.remove('is-open');
    dlg.classList.remove('is-shown');
    render();
    dlg.showModal();
    /* Появление — переход из стартового состояния в is-shown (см. CSS).
       Чтение offsetWidth между showModal() и классом обязательно: оно
       заставляет браузер посчитать стартовый кадр, иначе оба состояния
       схлопнутся в одно и перехода не будет — окно возникнет рывком. */
    void dlg.offsetWidth;
    dlg.classList.add('is-shown');
    load().then(render);
    /* фокус после отрисовки — иначе iOS не поднимает клавиатуру */
    setTimeout(function () { input.focus(); }, 50);
  }

  dlg.addEventListener('close', function () {
    dlg.classList.remove('is-shown');
    panel.classList.remove('is-open');
  });

  /* ── навигация клавишами ────────────────────────────────────────────── */

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

  /* ── события ────────────────────────────────────────────────────────── */

  if (toggle) {
    toggle.addEventListener('click', function () {
      setMode(mode === 'services' ? 'blog' : 'services');
      load().then(render);
      input.focus();
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      setMode(tab.dataset.mode);
      load().then(render);
      input.focus();
    });
  });

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      input.value = chip.dataset.q;
      load().then(function () { render(); input.focus(); });
    });
  });

  input.addEventListener('input', function () {
    if (!index) { load().then(render); return; }
    render();
  });

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

  /* Пересчёт высоты при смене размера окна: на узком экране в строку
     результата помещается меньше текста, и раскрытая панель обязана
     подрасти — иначе последние результаты обрежутся. */
  window.addEventListener('resize', function () {
    if (dlg.open && panel.classList.contains('is-open')) syncHeight();
  });
})();
