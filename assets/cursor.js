/* ══════════════════════════════════════════════════════════════════════
   Курсор-точка — общий слой для всех страниц.

   Точка догоняет мышь с запаздыванием (lerp), раскрывается над всем
   интерактивным и переключается на светлый режим поверх тёмных блоков —
   на navy-футере умножение сделало бы её невидимой.

   Кадровый цикл останавливается, как только точка догнала мышь: в покое
   не крутится ни одного requestAnimationFrame.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  if (!window.matchMedia) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover)').matches) return;
  if (!window.requestAnimationFrame) return;

  var dot = document.createElement('div');
  dot.className = 'krepko-cursor';
  dot.setAttribute('aria-hidden', 'true');
  document.body.appendChild(dot);

  var mx = 0, my = 0, cx = 0, cy = 0, raf = null, started = false;

  function frame() {
    cx += (mx - cx) * 0.18;
    cy += (my - cy) * 0.18;
    dot.style.setProperty('--cx', cx.toFixed(1) + 'px');
    dot.style.setProperty('--cy', cy.toFixed(1) + 'px');
    if (Math.abs(mx - cx) < 0.15 && Math.abs(my - cy) < 0.15) { raf = null; return; }
    raf = requestAnimationFrame(frame);
  }
  function pump() { if (raf === null) raf = requestAnimationFrame(frame); }

  document.addEventListener('mousemove', function (e) {
    mx = e.clientX;
    my = e.clientY;
    if (!started) {                 /* первый кадр — без «прилёта» из угла */
      started = true;
      cx = mx; cy = my;
      dot.style.setProperty('--cx', cx.toFixed(1) + 'px');
      dot.style.setProperty('--cy', cy.toFixed(1) + 'px');
      dot.classList.add('is-live');
    }
    pump();
  }, { passive: true });

  document.addEventListener('mouseleave', function () { dot.classList.remove('is-live'); });
  document.addEventListener('mouseenter', function () { if (started) dot.classList.add('is-live'); });

  /* Раскрытие над интерактивным и смена режима на тёмных блоках.
     Тёмные поверхности перечислены явно: определять яркость фона в рантайме
     дорого и ненадёжно (фон часто на родителе или в градиенте). */
  var DARK = '.site-footer, .marquee, .ab-dark, .home-founder--dark, [data-dark]';
  var HOT = 'a, button, summary, input, select, textarea, label[for], ' +
            '.map__pin, .creed, .srow, .gcard, .rv, .city__card, [role="button"]';

  document.addEventListener('mouseover', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    dot.classList.toggle('is-over', !!t.closest(HOT));
    dot.classList.toggle('is-dark', !!t.closest(DARK));
  }, { passive: true });
})();
