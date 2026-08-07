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
