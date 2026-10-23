/* Липкая кнопка WhatsApp: показать после прокрутки на экран, спрятать у финального CTA/подвала. */
(function () {
  var el = document.getElementById('sticky-cta');
  if (!el || !('IntersectionObserver' in window)) return;
  var stop = document.querySelector('.final-cta, .cta-block, footer');
  var nearEnd = false, scrolled = false;
  function update() { el.classList.toggle('is-on', scrolled && !nearEnd); }
  window.addEventListener('scroll', function () {
    var s = window.scrollY > window.innerHeight * 0.8;
    if (s !== scrolled) { scrolled = s; update(); }
  }, { passive: true });
  if (stop) {
    new IntersectionObserver(function (entries) {
      nearEnd = entries.some(function (e) { return e.isIntersecting; });
      update();
    }, { rootMargin: '0px 0px -10% 0px' }).observe(stop);
  }
  el.removeAttribute('hidden');
})();
