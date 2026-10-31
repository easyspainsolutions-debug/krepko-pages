/* Каталог услуг страницей (v2 «один каталог», 29.10.2026).
 *
 * Daniil про v1 (лист поверх любой страницы): «Страницу самого каталога услуг
 * сделать в таком виде… чтобы сама страница так выглядела, и из неё человек
 * уже лазил». Разметка — modules/catalog.html: /services/ (все разделы) и
 * хабы разделов (свой раздел целиком + «Другие разделы»). Скрипт:
 *   - строкам «в WhatsApp» вписывает заготовку «мне нужна услуга «…»» с тем же
 *     маркером «Я с krepko.es/<путь>/», что у кнопок страницы (в разметке —
 *     голый номер: без текста строка в 30 раз легче). Подключён раньше
 *     analytics.js (блок early_js в base.html) — тот потом допишет «Источник:»;
 *   - поле сужает список по мере ввода тем же разбором, что у лупы
 *     (site-search.js v3: основы слов, словарь синонимов из /search-index.json,
 *     опечатки, латиница): лучший раздел встаёт первым, «12 услуг · 4 раздела»;
 *     пусто — «Ничего не нашлось по запросу «…»» и WhatsApp с уже вписанным
 *     запросом. На хабе совпадения из других разделов — ниже, «В других
 *     разделах» (из того же индекса). Запрос живёт в адресе (?q=): ссылкой
 *     можно поделиться, «назад» со страницы услуги возвращает к ответу;
 *   - /services/: оглавление разделов (телефон — липкие вкладки, десктоп —
 *     липкая колонка) ведёт к разделу и подсвечивает текущий по прокрутке;
 *     /services/#раздел открывается на разделе.
 * v3 (30.10.2026): «Чаще всего обращаются» — чипы в шапке каталога, под полем.
 * Пустой ответ встаёт между полем и чипами (а не под вкладками), подсвечен
 * всегда один раздел (над первым — первый), высота шапки — по тому, что от
 * неё видно (при прокрутке вниз она уезжает: <html data-bar="down">).
 * Без скрипта каталог полный и рабочий: все строки — обычные ссылки.
 */
(function () {
  'use strict';
  var root = document.documentElement;
  var UK = (root.getAttribute('lang') || '').slice(0, 2) === 'uk';

  /* ══ Разбор запроса — перенос site-search.js v3 (тот же счёт, те же веса) ══ */
  var STOP = {};
  ('на для при про под над без из от до за по как что где или и а но это ' +
   'мне мой моя мои все еще уже там тут его ее их не да ' +
   'хочу хочет хотим нужно нужен нужна нужны надо необходимо требуется ' +
   'подскажите помогите скажите вопрос ситуация случай ' +
   'испания испании испанию испанией').split(' ').forEach(function (w) { STOP[w] = 1; });
  if (UK) {
    ('із зі від під над про для без як що де або та але це мені мій моя мої ' +
     'всі все ще вже там тут його її їх не так чи коли ' +
     'хочу хоче хочемо треба потрібно потрібен потрібна потрібні необхідно ' +
     'підкажіть допоможіть скажіть питання ситуація випадок ' +
     'іспанія іспанії іспанію іспанією').split(' ').forEach(function (w) { STOP[w] = 1; });
  }
  var SUFFIXES = UK ? ['иями', 'ього', 'ьому',
    'ями', 'ами', 'ого', 'его', 'ому', 'ему', 'ыми', 'ими', 'іми', 'ові', 'еві', 'єві',
    'ах', 'ях', 'ов', 'ев', 'ей', 'ий', 'ый', 'ая', 'яя', 'ое', 'ее', 'ую', 'юю',
    'ам', 'ям', 'ом', 'ем', 'єм', 'ою', 'ею', 'єю', 'ої', 'ій', 'ім', 'ів', 'їв',
    'их', 'іх', 'им',
    'ы', 'и', 'і', 'ї', 'а', 'я', 'о', 'е', 'є', 'у', 'ю', 'ь', 'й']
    : ['иями', 'ями', 'ами', 'ого', 'его', 'ому', 'ему', 'ыми', 'ими',
    'ах', 'ях', 'ов', 'ев', 'ей', 'ий', 'ый', 'ая', 'яя', 'ое', 'ее', 'ую', 'юю',
    'ам', 'ям', 'ом', 'ем', 'ы', 'и', 'а', 'я', 'о', 'е', 'у', 'ю', 'ь', 'й'];
  var LATIN = { 'á': 'a', 'à': 'a', 'â': 'a', 'ä': 'a', 'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
    'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i', 'ó': 'o', 'ò': 'o', 'ô': 'o', 'ö': 'o',
    'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u', 'ñ': 'n', 'ç': 'c' };
  function norm(s) {
    return (s || '').toLowerCase().replace(/ё/g, 'е').replace(/['’ʼ`]/g, '')
      .replace(/[áàâäéèêëíìîïóòôöúùûüñç]/g, function (c) { return LATIN[c]; });
  }
  function stem(w) {
    for (var i = 0; i < SUFFIXES.length; i++) {
      var s = SUFFIXES[i];
      if (w.length - s.length >= 4 && w.slice(-s.length) === s) { w = w.slice(0, w.length - s.length); break; }
    }
    if (UK && w.length >= 6 && w.slice(-3) === 'іст') w = w.slice(0, -3) + 'ост';
    return w;
  }
  function tokenize(s) {
    var parts = norm(s).split(/[^0-9a-zа-яіїєґ]+/), out = [];
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].length >= 2 && !STOP[parts[i]]) out.push(parts[i]);
    }
    return out;
  }
  function stems(s) { return tokenize(s).map(stem); }
  var TR_PAIRS = [
    ['shch', 'щ'], ['sch', 'щ'], ['yo', 'ё'], ['zh', 'ж'], ['kh', 'х'], ['ts', 'ц'],
    ['ch', 'ч'], ['sh', 'ш'], ['yu', 'ю'], ['ya', 'я'], ['ye', 'е'], ['iy', 'ий'],
    ['a', 'а'], ['b', 'б'], ['v', 'в'], ['g', 'г'], ['d', 'д'], ['e', 'е'],
    ['z', 'з'], ['i', 'и'], ['j', 'й'], ['k', 'к'], ['l', 'л'], ['m', 'м'],
    ['n', 'н'], ['o', 'о'], ['p', 'п'], ['r', 'р'], ['s', 'с'], ['t', 'т'],
    ['u', 'у'], ['f', 'ф'], ['h', 'х'], ['c', 'к'], ['y', 'ы'], ['w', 'в'],
    ['x', 'кс'], ['q', 'к'], ["'", ''], ['`', '']
  ];
  function translit(w) {
    if (!/^[a-z']+$/.test(w)) return '';
    var out = w;
    for (var i = 0; i < TR_PAIRS.length; i++) out = out.split(TR_PAIRS[i][0]).join(TR_PAIRS[i][1]);
    return out === w ? '' : out;
  }
  function near(a, b) {
    if (a === b) return true;
    var la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1) return false;
    var i = 0, j = 0, diff = 0;
    while (i < la && j < lb) {
      if (a.charAt(i) === b.charAt(j)) { i++; j++; continue; }
      if (++diff > 1) return false;
      if (la > lb) i++; else if (lb > la) j++; else { i++; j++; }
    }
    return diff + (la - i) + (lb - j) <= 1;
  }
  function prepare(e) {
    if (e._ready) return;
    e._ready = 1;
    e._title = norm(e.t);
    e._tw = null;
    e._ts = stems(e.t);
    e._cs = stems(e.c || '');
    e._ks = stems(e.k || '');
    e._kcs = stems(e.kc || '');
  }
  function tokenScore(e, raw) {
    var qs = stem(raw), i;
    if (e._title.indexOf(raw) === 0) return 120;
    for (i = 0; i < e._ts.length; i++) {
      if (e._ts[i] === qs) return 80;
      if (e._ts[i].indexOf(qs) === 0) return 62;
    }
    if (e._title.indexOf(raw) !== -1) return 45;
    /* окончание короткого слова не требуем: «сімʼю» находит «сім’ї», как
       находил прежний поиск колонки раздела (основа ≥ 3 букв, с начала слова) */
    var lo = raw.replace(/[аяоеєуюіїиыьй]$/, '');
    if (lo !== raw && lo.length >= 3) {
      if (!e._tw) e._tw = e._title.split(/[^0-9a-zа-яіїєґ]+/);
      for (i = 0; i < e._tw.length; i++) if (e._tw[i].indexOf(lo) === 0) return 40;
    }
    for (i = 0; i < e._cs.length; i++) if (e._cs[i].indexOf(qs) === 0) return 32;
    for (i = 0; i < e._ks.length; i++) {
      if (e._ks[i] === qs) return 26;
      if (e._ks[i].indexOf(qs) === 0) return 18;
    }
    for (i = 0; i < e._kcs.length; i++) {
      if (e._kcs[i] === qs) return 14;
      if (e._kcs[i].indexOf(qs) === 0) return 10;
    }
    if (qs.length >= 5) {
      for (i = 0; i < e._ts.length; i++) if (near(e._ts[i], qs)) return 8;
      for (i = 0; i < e._ks.length; i++) if (near(e._ks[i], qs)) return 5;
    }
    var ru = translit(raw);
    if (ru && ru !== raw) {
      var s = tokenScore(e, ru);
      if (s) return Math.max(4, Math.round(s * 0.7));
    }
    return 0;
  }
  /* Как search() у лупы: сначала строгий проход (нашлось каждое слово),
     пусто и слов больше одного — записи, где нашлась хотя бы часть запроса */
  function match(pool, toks) {
    function pass(min) {
      var hits = [];
      for (var i = 0; i < pool.length; i++) {
        var e = pool[i], total = 0, n = 0;
        prepare(e);
        for (var j = 0; j < toks.length; j++) {
          var s = tokenScore(e, toks[j]);
          if (s) { n++; total += s; }
        }
        e._n = n; e._s = total;
        if (n >= min) hits.push(e);
      }
      return hits;
    }
    var strict = pass(toks.length);
    if (strict.length || toks.length < 2) return strict;
    return pass(1);
  }
  function rank(a, b) { return b._n - a._n || b._s - a._s || a.t.length - b.t.length; }
  /* Строки показываются на месте, поэтому вместо обрезки — порог от лучшего
     совпадения: есть попадания в названия — строки, где слово нашлось лишь в
     описании страницы, не показываем («перевод»: строки с переводом в
     названии, а не 70 страниц, где он упомянут). Нет попаданий в названия
     («машина») — порог сам опускается до слов клиента из словаря. */
  var RELEVANT = 0.45;
  function relevant(hits) {
    var maxN = 0, maxS = 0;
    hits.forEach(function (e) { if (e._n > maxN) maxN = e._n; });
    hits.forEach(function (e) { if (e._n === maxN && e._s > maxS) maxS = e._s; });
    return hits.filter(function (e) { return e._n === maxN && e._s >= maxS * RELEVANT; });
  }
  function queryTokens(q) {
    var toks = tokenize(q);
    if (!toks.length && norm(q).length >= 2) toks = [norm(q)];
    return toks;
  }
  /* слова клиента из словаря синонимов (индекс поиска) — к строкам каталога */
  function withKeywords(list, index) {
    if (!index) return;
    list.forEach(function (r) {
      if (r._kw) return;
      var e = r.u ? index.byUrl[r.u] : null;
      r.k = e ? (e.k || '') : '';
      r.kc = (e && e.kc) || index.byCat[r.c] || '';
      r._kw = 1;
      r._ready = 0;
    });
  }
  function indexOf(data) {
    var byUrl = {}, byCat = {};
    ((data && data.services) || []).forEach(function (e) {
      if (e.u && !byUrl[e.u]) byUrl[e.u] = e;
      if (e.c && e.kc && !byCat[e.c]) byCat[e.c] = e.kc;
    });
    return { byUrl: byUrl, byCat: byCat, all: (data && data.services) || [] };
  }
  /* Движок открыт и для тестов (scripts/tests/test_catalog_sheet.py гоняет
     его в node на собранном _gen) */
  window.krepkoCatalog = {
    queryTokens: queryTokens, match: match, relevant: relevant, rank: rank,
    withKeywords: withKeywords, indexOf: indexOf
  };

  var cp = document.querySelector('.cp');
  var input = cp && cp.querySelector('.cp__input');
  if (!input) return;

  var hub = cp.classList.contains('cp--hub');
  var head = cp.querySelector('.cp__head');
  var body = cp.querySelector('.cp__body');
  var status = cp.querySelector('.cp__status');
  var toc = cp.querySelector('.cp__toc');
  var tocList = toc ? toc.querySelector('ul') : null;
  var tocItems = toc ? [].slice.call(toc.querySelectorAll('li')) : [];
  var top = cp.querySelector('.cp__top');
  var sections = [].slice.call(cp.querySelectorAll('.cp__dir'));
  var ask = cp.querySelector('.cp-ask');
  var askH = cp.querySelector('.cp-ask__h');
  var askQ = cp.querySelector('.cp-ask__q');
  var askBtns = [].slice.call(cp.querySelectorAll('.cp-ask__btn'));
  var more = cp.querySelector('.cp__more');
  var moreList = more ? more.querySelector('ul') : null;
  var others = cp.querySelector('.cp__others');
  var hubSeg = cp.getAttribute('data-dir') || '';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── формы слов: «1 услуга / 2 услуги / 5 услуг» (ru и uk — одно правило) ── */
  function forms(attr) { return (cp.getAttribute(attr) || '').split('|'); }
  var N_FORMS = forms('data-n'), S_FORMS = forms('data-s');
  function plural(n, f) {
    var a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return f[0];
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return f[1];
    return f[2];
  }

  /* ── WhatsApp: заготовки и маркер страницы ─────────────────────────── */
  var WA_NUM = cp.getAttribute('data-wa-num') || '';
  var TAIL = '';
  try { TAIL = decodeURIComponent(cp.getAttribute('data-wa-tail') || ''); } catch (e) { TAIL = ''; }
  var SVC = cp.getAttribute('data-wa-svc') || '';
  var QPH = cp.getAttribute('data-wa-q') || '';
  function waHref(text) {
    return 'https://wa.me/' + WA_NUM + '?text=' + encodeURIComponent(text + (TAIL ? '. ' + TAIL : ''));
  }
  /* «Источник: …» дописывает analytics.js к уже готовым ссылкам; при замене
     текста кнопки на запрос строку сохраняем */
  function srcPrefix(href) {
    var m = /[?&]text=([^&]*)/.exec(href || '');
    if (!m) return '';
    var t;
    try { t = decodeURIComponent(m[1]); } catch (e) { return ''; }
    var i = t.indexOf('\n\n');
    return (t.indexOf('Источник:') === 0 && i > 0) ? t.slice(0, i + 2) : '';
  }
  function titleOf(a) {
    var s = a.querySelector('span');
    return (s ? s.textContent : a.textContent).replace(/\s+/g, ' ').trim();
  }
  [].forEach.call(cp.querySelectorAll('a[data-wa]'), function (a) {
    a.setAttribute('href', waHref(SVC.replace('{name}', titleOf(a))));
  });
  /* кнопка страховки с запросом: «Добрый день, ищу услугу: «…». Я с krepko.es/…/» */
  function setQueryWa(q) {
    askBtns.forEach(function (b) {
      if (b._cpDef == null) b._cpDef = b.getAttribute('href');
      if (!q) { b.setAttribute('href', b._cpDef); return; }
      var text = srcPrefix(b._cpDef) + QPH.replace('{q}', q) + (TAIL ? '. ' + TAIL : '');
      b.setAttribute('href', 'https://wa.me/' + WA_NUM + '?text=' + encodeURIComponent(text));
    });
  }

  /* Подсветка набранного — как у лупы: по основам, узлами, без innerHTML */
  function highlight(text, toks) {
    var qs = toks.map(stem), spans = [], m;
    var re = /[0-9A-Za-zÀ-ÖØ-öø-ÿА-Яа-яЁёІіЇїЄєҐґ'’ʼ`]+/g;
    while ((m = re.exec(text)) !== null) {
      var word = norm(m[0]), ws = stem(word), len = 0;
      var apo = word.length !== m[0].length;
      for (var i = 0; i < toks.length; i++) {
        if (word.indexOf(toks[i]) === 0) len = Math.max(len, apo ? m[0].length : toks[i].length);
        else if (ws.length >= 4 && (ws.indexOf(qs[i]) === 0 || qs[i].indexOf(ws) === 0)) len = Math.max(len, m[0].length);
      }
      if (len) spans.push([m.index, m.index + Math.min(len, m[0].length)]);
    }
    var frag = document.createDocumentFragment(), pos = 0;
    for (var k = 0; k < spans.length; k++) {
      if (spans[k][0] < pos) continue;
      if (spans[k][0] > pos) frag.appendChild(document.createTextNode(text.slice(pos, spans[k][0])));
      var mark = document.createElement('mark');
      mark.textContent = text.slice(spans[k][0], spans[k][1]);
      frag.appendChild(mark);
      pos = spans[k][1];
    }
    if (pos < text.length) frag.appendChild(document.createTextNode(text.slice(pos)));
    return frag;
  }
  function paint(r, toks) {
    var span = r.a.querySelector('span');
    if (!span) return;
    span.textContent = '';
    span.appendChild(toks ? highlight(r.t, toks) : document.createTextNode(r.t));
  }

  /* ── индекс поиска: слова клиента (словарь синонимов) — лениво ── */
  var index = null, loading = null;
  function loadIndex() {
    if (index) return Promise.resolve(index);
    if (loading) return loading;
    if (!window.fetch) { index = indexOf(null); return Promise.resolve(index); }
    loading = fetch(UK ? '/search-index.uk.json' : '/search-index.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) { index = indexOf(data); return index; })
      .catch(function () { index = indexOf(null); return index; });
    return loading;
  }

  /* ── строки каталога ── */
  var rows = [];
  sections.forEach(function (sec) {
    var h = sec.querySelector('.cp__dir-h a');
    sec._name = h ? h.textContent.trim() : '';
    sec._count = sec.querySelector('.cp__dir-h small');
    if (sec._count) sec._countText = sec._count.textContent;
    [].forEach.call(sec.querySelectorAll('.cp__group'), function (g) {
      var gh = g.querySelector('.cp__group-h');
      var gt = gh ? gh.textContent.trim() : '';
      [].forEach.call(g.querySelectorAll('li'), function (li) {
        var a = li.querySelector('a');
        if (!a) return;
        rows.push({
          li: li, a: a, sec: sec, g: g, c: gt, t: titleOf(a),
          u: a.hasAttribute('data-wa') ? '' : a.getAttribute('href'),
          x: a.getAttribute('data-x') || ''
        });
      });
    });
  });
  var tocBySeg = {};
  tocItems.forEach(function (li) {
    var a = li.querySelector('a');
    if (!a) return;
    li._a = a;
    li._small = a.querySelector('small');
    li._countText = li._small ? li._small.textContent : '';
    tocBySeg[a.getAttribute('data-dir')] = li;
  });
  /* имена разделов по сегменту адреса — подписи строк «В других разделах» */
  var segName = {};
  if (others) {
    [].forEach.call(others.querySelectorAll('a[data-dir]'), function (a) {
      segName[a.getAttribute('data-dir')] = titleOf(a);
    });
  }

  /* ── липкие шапка и оглавление: высота шапки — в --cp-stick ── */
  var nav = document.querySelector('.site-nav');
  function measure() {
    if (nav) root.style.setProperty('--cp-stick', nav.offsetHeight + 'px');
  }
  measure();
  window.addEventListener('resize', measure, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  /* сколько шапки видно сверху: у верха страницы — строка контактов и шапка,
     дальше — липкая шапка; уехала при прокрутке вниз (data-bar="down") — 0 */
  function navBottom() {
    return nav ? Math.max(0, nav.getBoundingClientRect().bottom) : 0;
  }

  /* ── лупа шапки и меню, «/» и ⌘K: на странице с каталогом — к полю
     страницы, а не всплывающий поиск поверх неё (проверка v2, 29.10.2026:
     второе окно поиска над страницей, которая сама поиск, — тот же «каталог
     плюс всплывающий каталог»). Перехват — до site-search.js (capture). ── */
  function focusField() {
    try { input.focus({ preventScroll: true }); } catch (err) { input.focus(); }
  }
  function toField() {
    var menu = document.getElementById('site-menu-dialog');
    if (menu && menu.open) {
      /* site-nav.js по событию close возвращает фокус на бургер — поле
         получает фокус и сейчас (жест пользователя), и после него */
      menu.addEventListener('close', function back() {
        menu.removeEventListener('close', back);
        focusField();
      });
      menu.close();
    }
    window.scrollTo(0, 0);
    focusField();
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-open-search]');
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    toField();
  }, true);
  document.addEventListener('keydown', function (e) {
    var tag = (document.activeElement && document.activeElement.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === '/' || ((e.metaKey || e.ctrlKey) && (e.key || '').toLowerCase() === 'k')) {
      e.preventDefault();
      e.stopPropagation();
      toField();
    }
  }, true);

  /* ── оглавление: переход к разделу, подсветка по прокрутке ── */
  function syncTocEdge() {
    if (!tocList || !toc) return;
    toc.classList.toggle('is-end', tocList.scrollLeft + tocList.clientWidth >= tocList.scrollWidth - 4);
    toc.classList.toggle('is-scrolled', tocList.scrollLeft > 4);
  }
  if (tocList) {
    tocList.addEventListener('scroll', syncTocEdge, { passive: true });
    syncTocEdge();
  }
  function goTo(sec, viaKey) {
    try { sec.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' }); } catch (e) { sec.scrollIntoView(true); }
    if (viaKey) {
      var h = sec.querySelector('.cp__dir-h a');
      if (h) { try { h.focus({ preventScroll: true }); } catch (err) { h.focus(); } }
    }
  }
  if (toc) {
    toc.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[data-dir]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      var sec = cp.querySelector('.cp__dir[data-dir="' + a.getAttribute('data-dir') + '"]');
      if (!sec) return;
      e.preventDefault();
      /* раздел скрыт поиском — очищаем поле и ведём к разделу */
      if (sec.hidden) { input.value = ''; filter(); }
      try { history.replaceState(history.state, '', '#' + a.getAttribute('data-dir')); } catch (err) { /* no-op */ }
      goTo(sec, e.detail === 0);
      activeLi = null;
    });
  }
  var spyQueued = false, activeLi = null;
  function spy() {
    spyQueued = false;
    if (!tocItems.length) return;
    var line = navBottom() + (toc && toc.offsetHeight < 80 ? toc.offsetHeight : 0) + 48;
    var best = null, first = null;
    for (var i = 0; i < sections.length; i++) {
      var s = sections[i];
      if (s.hidden) continue;
      if (!first) first = s;
      if (s.getBoundingClientRect().top <= line) best = s;
    }
    /* выше первого раздела подсвечен первый: вкладка показывает, откуда
       начинается список (directions.md §4.1) */
    if (!best) best = first;
    /* дочитали до конца раздела-последыша — подсвечен он, даже если короткий */
    var se = document.scrollingElement || root;
    if (best && se.scrollTop + window.innerHeight >= se.scrollHeight - 4) {
      for (var k = sections.length - 1; k >= 0; k--) {
        if (!sections[k].hidden && sections[k].getBoundingClientRect().top < window.innerHeight) { best = sections[k]; break; }
      }
    }
    var li = best ? tocBySeg[best.getAttribute('data-dir')] : null;
    tocItems.forEach(function (x) { if (x._a) x._a.classList.toggle('is-on', x === li); });
    if (li === activeLi) return;
    activeLi = li;
    if (!li || !tocList) return;
    /* телефон: активная вкладка не уходит за край строки */
    if (tocList.scrollWidth > tocList.clientWidth + 4) {
      var l = li.offsetLeft, w = li.offsetWidth, sl = tocList.scrollLeft, cw = tocList.clientWidth;
      if (l < sl + 40 || l + w > sl + cw - 48) {
        var to = Math.max(0, l - 56);
        if (tocList.scrollTo) tocList.scrollTo({ left: to, behavior: reduce ? 'auto' : 'smooth' });
        else tocList.scrollLeft = to;
      }
    }
  }
  if (tocItems.length) {
    window.addEventListener('scroll', function () {
      if (spyQueued) return;
      spyQueued = true;
      (window.requestAnimationFrame || setTimeout)(spy);
    }, { passive: true });
  }

  /* ── поиск ──────────────────────────────────────────────────────────── */
  var filtering = false;
  function syncUrl(q) {
    try {
      var url = location.pathname + (q ? '?q=' + encodeURIComponent(q) : '') + (q ? '' : location.hash);
      if (url !== location.pathname + location.search + location.hash) history.replaceState(history.state, '', url);
    } catch (e) { /* no-op */ }
  }
  /* пустой ответ на /services/: страховка «Ничего не нашлось…» встаёт сразу
     под полем — над чипами «Чаще всего обращаются» (они в шапке каталога), а
     не под вкладками за экраном; в остальное время она — в конце списка */
  function placeAsk(empty) {
    if (!ask || !body) return;
    if (empty && !hub && head && top) {
      if (ask.parentNode !== head) head.insertBefore(ask, top);
    } else if (ask.parentNode !== body) {
      body.appendChild(ask);
    }
  }
  function reset() {
    rows.forEach(function (r) { r.li.hidden = false; if (r._painted) { paint(r, null); r._painted = 0; } });
    sections.forEach(function (sec) {
      sec.hidden = false;
      [].forEach.call(sec.querySelectorAll('.cp__group'), function (g) { g.hidden = false; });
      if (sec._count) sec._count.textContent = sec._countText;
    });
    /* исходный порядок разделов и оглавления */
    placeAsk(false);
    if (!hub) sections.forEach(function (sec) { body.insertBefore(sec, ask); });
    tocItems.forEach(function (li) {
      li.hidden = false;
      if (li._small) li._small.textContent = li._countText;
      if (tocList) tocList.appendChild(li);
    });
    if (top) top.hidden = false;
    if (others) others.hidden = false;
    if (more) more.hidden = true;
    if (moreList) moreList.textContent = '';
    cp.classList.remove('is-empty', 'is-filtering');
    if (askH) askH.textContent = askH.getAttribute('data-default');
    if (askQ) askQ.hidden = true;
    status.textContent = '';
    status.classList.remove('is-sr');
    setQueryWa('');
    filtering = false;
    activeLi = null;
    spy();
  }

  /* хаб: совпадения из других разделов — записи индекса (страницы услуг) */
  var SKIP = {};
  (cp.getAttribute('data-skip') || '').split('|').forEach(function (c) { if (c) SKIP[c] = 1; });
  function segOf(u) {
    var p = (u || '').replace(/^\/uk(?=\/)/, '').split('/').filter(Boolean);
    return p.length >= 2 ? p[0] : '';
  }
  function otherHits(toks, own) {
    if (!index || !moreList) return [];
    var pool = index.all.filter(function (e) {
      var seg = segOf(e.u);
      return seg && seg !== hubSeg && !SKIP[e.c] && e.u.indexOf('#') < 0 && !own[e.u];
    });
    var hits = relevant(match(pool, toks)).sort(rank), seen = {}, out = [];
    for (var i = 0; i < hits.length && out.length < 8; i++) {
      if (seen[hits[i].u]) continue;
      seen[hits[i].u] = 1;
      out.push(hits[i]);
    }
    return out;
  }
  function renderOthers(list, toks) {
    moreList.textContent = '';
    list.forEach(function (e) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.setAttribute('href', e.u);
      var span = document.createElement('span');
      span.appendChild(highlight(e.t, toks));
      a.appendChild(span);
      var lab = document.createElement('small');
      lab.className = 'cp-x';
      lab.textContent = (cp.getAttribute('data-in') || '').replace('{name}', segName[segOf(e.u)] || e.d || '');
      a.appendChild(lab);
      li.appendChild(a);
      moreList.appendChild(li);
    });
    more.hidden = !list.length;
  }

  function filter() {
    var q = input.value.replace(/\s+/g, ' ').trim();
    var toks = q.length >= 2 ? queryTokens(q) : [];
    if (!toks.length) {
      if (filtering) reset();
      syncUrl('');
      return;
    }
    filtering = true;
    withKeywords(rows, index);
    var hits = relevant(match(rows, toks));
    var ownHit = {};
    hits.forEach(function (r) { if (r.u && r.x === '') ownHit[r.u] = 1; });
    rows.forEach(function (r) { r._hit = false; });
    hits.forEach(function (r) {
      /* строка другого раздела — дубль, если её страница нашлась своей строкой */
      if (r.x === '1' && ownHit[r.u]) return;
      r._hit = true;
    });
    var bestBySec = {}, countBySec = {}, unique = {}, own = {}, n = 0;
    rows.forEach(function (r) {
      r.li.hidden = !r._hit;
      if (r._hit) {
        paint(r, toks); r._painted = 1;
        var key = r.u || ('w:' + r.t);
        if (!unique[key]) { unique[key] = 1; n++; }
        if (r.u) own[r.u] = 1;
        var seg = r.sec.getAttribute('data-dir');
        countBySec[seg] = (countBySec[seg] || 0) + 1;
        var score = r._n * 1000 + r._s;
        if (!(seg in bestBySec) || score > bestBySec[seg]) bestBySec[seg] = score;
      } else if (r._painted) { paint(r, null); r._painted = 0; }
    });
    /* группы и разделы без совпадений прячутся; лучший раздел — первым */
    var visible = [];
    sections.forEach(function (sec) {
      var seg = sec.getAttribute('data-dir');
      var cnt = countBySec[seg] || 0;
      sec.hidden = !cnt;
      [].forEach.call(sec.querySelectorAll('.cp__group'), function (g) {
        g.hidden = !g.querySelector('li:not([hidden])');
      });
      if (sec._count) sec._count.textContent = cnt ? cnt + ' ' + plural(cnt, N_FORMS) : sec._countText;
      if (cnt) visible.push(sec);
    });
    var order = sections.slice().sort(function (a, b) {
      var sa = bestBySec[a.getAttribute('data-dir')], sb = bestBySec[b.getAttribute('data-dir')];
      sa = sa == null ? -1 : sa; sb = sb == null ? -1 : sb;
      return sb - sa || sections.indexOf(a) - sections.indexOf(b);
    });
    placeAsk(false);
    if (!hub) order.forEach(function (sec) { body.insertBefore(sec, ask); });
    /* хаб: «Другие разделы» уступают место совпадениям из других разделов;
       при пустом ответе они остаются — из него можно уйти в другой раздел */
    var extra = [];
    if (hub) {
      extra = otherHits(toks, own);
      renderOthers(extra, toks);
    }
    var empty = n === 0 && !extra.length;
    placeAsk(empty);
    if (others) others.hidden = !empty;
    cp.classList.add('is-filtering');
    /* оглавление: только разделы с совпадениями; пусто — все разделы, как без
       поиска: из пустого ответа можно уйти листать каталог */
    (empty ? sections : order).forEach(function (sec) {
      var li = tocBySeg[sec.getAttribute('data-dir')];
      if (!li) return;
      var cnt = countBySec[sec.getAttribute('data-dir')] || 0;
      li.hidden = !empty && !cnt;
      if (li._small) li._small.textContent = cnt ? String(cnt) : li._countText;
      if (tocList) tocList.appendChild(li);
    });
    if (top) top.hidden = !empty;
    cp.classList.toggle('is-empty', empty);
    if (askH) askH.textContent = empty ? (cp.getAttribute('data-none') || '').replace('{q}', q) : askH.getAttribute('data-default');
    if (askQ) askQ.hidden = false;
    var total = n + extra.length;
    /* живая область: число найденного видно в строке поля; «Ничего не
       нашлось…» крупно написано в каталоге — здесь только для диктора */
    status.textContent = empty ? askH.textContent : total + ' ' + plural(total, N_FORMS) +
      (visible.length > 1 ? ' · ' + visible.length + ' ' + plural(visible.length, S_FORMS) : '');
    status.classList.toggle('is-sr', empty);
    setQueryWa(q);
    syncUrl(q);
    activeLi = null;
    spy();
  }
  input.addEventListener('input', function () {
    filter();
    if (!index) loadIndex().then(function () { if (input.value) filter(); });
  });

  /* клавиши: ↓ из поля — к первой строке, ↑/↓ — по видимым строкам, Enter —
     первая найденная, Esc — очистить поле */
  function visibleLinks() {
    /* чипы «Чаще всего обращаются» (шапка каталога) — первыми, как на экране */
    return [].slice.call(cp.querySelectorAll('.cp__top li > a, .cp__body li > a')).filter(function (a) {
      return a.offsetParent !== null && !a.closest('[hidden]');
    });
  }
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') {
      var first = visibleLinks()[0];
      if (first) { e.preventDefault(); first.focus(); }
    } else if (e.key === 'Enter' && input.value.trim().length >= 2) {
      var hit = visibleLinks().filter(function (a) { return a.closest('.cp__dir, .cp__more'); })[0];
      if (hit) { e.preventDefault(); hit.click(); }
    } else if (e.key === 'Escape' && input.value) {
      e.preventDefault();
      input.value = '';
      filter();
    }
  });
  function arrows(e) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    var links = visibleLinks();
    var i = links.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    if (e.key === 'ArrowUp' && i === 0) { input.focus(); return; }
    var next = links[Math.min(links.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)))];
    if (next) next.focus();
  }
  body.addEventListener('keydown', arrows);
  if (top) top.addEventListener('keydown', arrows);

  /* ?q= в адресе — поле уже заполнено (ссылка с запросом, «назад» к ответу) */
  var q0 = '';
  try { q0 = (new URLSearchParams(location.search).get('q') || '').trim(); } catch (e) { q0 = ''; }
  if (!q0 && input.value) q0 = input.value.trim();
  if (q0) {
    input.value = q0;
    filter();
    loadIndex().then(function () { if (input.value) filter(); });
  }
  spy();
})();
