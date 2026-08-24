/* ═══════════════════════════════════════════════════════════════════════
   Поведение шапки сайта: липкое состояние и мега-меню «Каталог услуг».
   Файл глобальный — подключается в base.html на всех страницах. Раньше
   этот код жил в home-redesign.js, который грузится только на главной
   и /about/, поэтому на остальных 118 страницах кнопка каталога не
   реагировала на клик, а .is-stuck у шапки не появлялся.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  var nav = document.querySelector('.site-nav');
  if (!nav) return;
  var stuck = null;
  function update(){
    var next = window.scrollY > 8;
    if (next !== stuck) { stuck = next; nav.classList.toggle('is-stuck', next); }
  }
  window.addEventListener('scroll', update, {passive: true});
  update();
})();

(function(){
  var trigger = document.getElementById('mega-trigger');
  var panel = document.getElementById('mega-menu');
  var overlay = document.getElementById('mega-overlay');
  if (!trigger || !panel) return;
  var open = false;

  var hideTimer = null;
  var REVEAL = 360;   /* синхронно с transition у .mega */

  function setOpen(v){
    open = v;
    trigger.setAttribute('aria-expanded', v ? 'true' : 'false');
    if (overlay) overlay.classList.toggle('is-on', v);

    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }

    if (v) {
      panel.hidden = false;
      /* принудительный reflow: без него браузер объединит снятие hidden
         и добавление класса в один кадр, и шторка не «поедет» */
      void panel.offsetWidth;
      panel.classList.add('is-open');
    } else {
      panel.classList.remove('is-open');
      /* прячем только после того, как шторка свернулась */
      hideTimer = setTimeout(function(){
        if (!open) panel.hidden = true;
        hideTimer = null;
      }, REVEAL);
    }
  }
  trigger.addEventListener('click', function(e){ e.stopPropagation(); setOpen(!open); });

  // закрытие: клик вне панели, Esc, уход мышью
  document.addEventListener('click', function(e){
    if (open && !panel.contains(e.target) && e.target !== trigger) setOpen(false);
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && open) { setOpen(false); trigger.focus(); }
  });
  panel.addEventListener('mouseleave', function(){ if (open) setOpen(false); });
})();


/* Индикатор прочитанного. Считает долю прокрутки и растягивает полосу
   поверх шапки. Обновление привязано к кадру: на длинных страницах
   событие scroll приходит чаще, чем браузер успевает рисовать. */
(function () {
  var bar = document.getElementById('scroll-progress-bar');
  if (!bar) return;

  var queued = false;

  function update() {
    queued = false;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    /* страница короче экрана — прокручивать нечего, полосу не показываем */
    var pct = max > 8 ? window.scrollY / max : 0;
    if (pct < 0) pct = 0;
    if (pct > 1) pct = 1;
    bar.style.transform = 'scaleX(' + pct.toFixed(4) + ')';
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


/* Аккордеоны FAQ: одновременно открыт только один вопрос в группе.
   Решение Daniil (2026-08-07) — по всему сайту, а не только на главной,
   где такая логика жила внутри home-redesign.js вместе с анимацией.

   Слушаем нативное событие toggle на всплытии: оно приходит и от клика,
   и от клавиатуры, и от программного открытия. Группой считаем ближайший
   общий контейнер списка — так соседние FAQ-блоки на одной странице
   (например, в статье и в блоке услуги) не гасят друг друга.

   Блок на главной пропускаем: там раскрытие анимируется вручную и уже
   закрывает соседей — вмешательство сорвало бы анимацию на полпути. */
(function () {
  document.addEventListener('toggle', function (e) {
    var d = e.target;
    if (!d || d.tagName !== 'DETAILS' || !d.open) return;
    if (d.closest('.home-faq')) return;

    var group = d.closest('.faq__list') || d.parentElement;
    if (!group) return;

    var siblings = group.querySelectorAll(':scope > details[open]');
    for (var i = 0; i < siblings.length; i++) {
      if (siblings[i] !== d) siblings[i].open = false;
    }
  }, true);   /* capture: toggle не всплывает */
})();


/* Мобильное меню-диалог: активный пункт, закрытие и цвет статус-бара.
   Раньше этот код лежал инлайном внутри каждого из 225 HTML — одно и то же
   тело скачивалось заново на каждом переходе. */
(function(){
  var p = location.pathname;
  var k = (p === '/' || p === '/index.html') ? 'home'
        : p.indexOf('/blog') === 0 ? 'blog'
        : p.indexOf('/partners') === 0 ? 'partners'
        : (p.indexOf('/services') === 0 || p.indexOf('/notario') === 0 ||
           p.indexOf('/ukraina') === 0 || p.indexOf('/banca') === 0 ||
           p.indexOf('/traduccion') === 0 || p.indexOf('/legalizacion') === 0) ? 'services'
        : p.indexOf('/about') === 0 ? 'about' : '';
  if (k) {
    var link = document.querySelector('.site-menu__link[data-page="' + k + '"]');
    if (link) link.classList.add('active');
  }

  var d = document.getElementById('site-menu-dialog');
  var trigger = document.querySelector('.site-nav__menu-btn');
  if (!d) return;

  /* Статус-бар iOS под цвет открытого меню — почему так, см. site-nav.css.
     Слушаем атрибут open, а не событие close: dialog.close() из скрипта
     событие не диспатчит. */
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var themeIdle = themeMeta ? themeMeta.getAttribute('content') : null;
  if (themeMeta && themeIdle && window.MutationObserver) {
    new MutationObserver(function(){
      themeMeta.setAttribute('content', d.hasAttribute('open') ? '#FFFBF7' : themeIdle);
    }).observe(d, {attributes: true, attributeFilter: ['open']});
  }

  /* Доступность: клик по подложке и Esc закрывают, фокус возвращается на кнопку. */
  d.addEventListener('click', function(e){ if (e.target === d) d.close(); });
  d.addEventListener('keydown', function(e){
    if (e.key === 'Escape') { e.preventDefault(); d.close(); }
  });
  d.addEventListener('close', function(){
    if (trigger) { try { trigger.focus(); } catch (_) {} }
  });
})();
