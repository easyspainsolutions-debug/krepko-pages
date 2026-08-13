/* ============================================================
   Страница статьи блога (2026-08-13)

   Два дела: оглавление (свернуть на телефоне, подсветить активный раздел)
   и блок «читайте также» из общего реестра статей.

   Файл общий на все 32 статьи. Раньше тот же код лежал внутри каждой
   страницы: 2,5 КБ × 32 копии, и три статьи из-за этого перевалили за
   порог веса HTML.

   Ждёт articles-data.js — он подключается тем же тегом со `defer` выше.
   ============================================================ */
(function () {
  var CATS = {
    vnzh: 'ВНЖ и статус', docs: 'Документы', finance: 'Деньги',
    work: 'Работа', life: 'Жизнь здесь', social: 'Соцвопросы'
  };

  /* ── Оглавление ── */
  function toc() {
    /* На узком экране оглавление свёрнуто, на широком раскрыто всегда:
       атрибут open один на оба случая, поэтому решает медиазапрос. */
    var box = document.querySelector('details.article-toc');
    if (box) {
      var mq = window.matchMedia('(max-width: 900px)');
      var sync = function () { box.open = !mq.matches; };
      sync();
      if (mq.addEventListener) mq.addEventListener('change', sync);
    }

    var links = document.querySelectorAll('.article-toc a');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });

    /* Подсвечивает раздел, который сейчас на экране, — как выбранная тема на
       витрине. IntersectionObserver вместо слушателя прокрутки: не дёргает
       раскладку и не считает координаты на каждый пиксель. */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-on'); });
        var cur = map[e.target.id];
        if (cur) cur.classList.add('is-on');
      });
    }, { rootMargin: '-170px 0px -70% 0px' });
    document.querySelectorAll('.article-body h2[id]').forEach(function (h) {
      io.observe(h);
    });
  }

  /* ── Темы и «читайте также» ──
     Прежний блок рисовал свои карточки: одну крупную «Читать следующим ↗»
     и две мелкие, плюс ряд пилюль с темами. Ни того, ни другого больше нет
     нигде на сайте. Отдаём ту же выборку карточками витрины — человек уже
     видел их на /blog/ и узнаёт форму. */
  function more() {
    if (typeof ARTICLES === 'undefined') return;
    var slug = location.pathname.replace(/\/$/, '').split('/').pop().replace('.html', '');
    var cur = ARTICLES.find(function (a) { return a.slug === slug; });
    if (!cur) return;

    /* Сначала соседи по теме, добор — из остальных: три карточки в ряду
       выглядят законченно, две оставляют дыру справа. */
    var pool = ARTICLES.filter(function (a) { return a.cat === cur.cat && a.slug !== slug; });
    if (pool.length < 3) {
      pool = pool.concat(ARTICLES.filter(function (a) {
        return a.cat !== cur.cat && a.slug !== slug;
      }));
    }
    var rel = pool.slice(0, 3);

    var nav = document.getElementById('cat-nav');
    if (nav) {
      nav.className = 'article-topics';
      nav.innerHTML = '<span class="article-topics__label">Темы блога</span>' +
        Object.keys(CATS).map(function (id) {
          return '<a class="article-topics__link' + (id === cur.cat ? ' is-on' : '') +
            '" href="/blog/?cat=' + id + '">' + CATS[id] + '</a>';
        }).join('');
    }

    var box = document.getElementById('related-articles');
    if (!box || !rel.length) return;
    box.className = 'article-more__grid';
    box.innerHTML = rel.map(function (a) {
      var tags = a.tag.split('·').map(function (t) {
        return '<span class="blog-card__tag">' + t.trim() + '</span>';
      }).join('');
      return '<a class="blog-card" data-cat="' + a.cat + '" href="/blog/' + a.slug + '/">' +
        '<span class="blog-card__top"></span>' +
        '<span class="blog-card__body">' +
        '<span class="blog-card__kicker">Блог&nbsp;· ' + (CATS[a.cat] || '') + '</span>' +
        '<span class="blog-card__tags">' + tags + '</span>' +
        '<span class="blog-card__title">' + a.title + '</span>' +
        '<span class="blog-card__date">~' + a.time + ' мин чтения</span>' +
        '</span></a>';
    }).join('');
    box.insertAdjacentHTML('beforebegin', '<h2 class="article-more__h">Читайте также</h2>');
  }

  function init() { toc(); more(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
