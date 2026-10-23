/* Липкая кнопка WhatsApp: показать после прокрутки на экран, спрятать у финального CTA/подвала. */
(function () {
  var el = document.getElementById('sticky-cta');
  if (!el || !('IntersectionObserver' in window)) return;
  /* Следим за ВСЕМИ стоп-блоками (финальный CTA и подвал), а не за первым:
     иначе у подвала кнопка снова всплывала и закрывала Aviso legal / Privacidad. */
  var stops = document.querySelectorAll('.final-cta, .cta-block, footer');
  var hits = 0, nearEnd = false, scrolled = false;
  function update() { el.classList.toggle('is-on', scrolled && !nearEnd); }
  window.addEventListener('scroll', function () {
    var s = window.scrollY > window.innerHeight * 0.8;
    if (s !== scrolled) { scrolled = s; update(); }
  }, { passive: true });
  if (stops.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var was = e.target.__stickyOn === true, now = e.isIntersecting;
        if (now && !was) hits++;
        if (!now && was) hits--;
        e.target.__stickyOn = now;
      });
      nearEnd = hits > 0;
      update();
    }, { rootMargin: '0px 0px -10% 0px' });
    for (var i = 0; i < stops.length; i++) io.observe(stops[i]);
  }
  el.removeAttribute('hidden');
})();
