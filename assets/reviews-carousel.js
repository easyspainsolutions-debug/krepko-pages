/* Reviews carousel — dot indicators (progressive enhancement).
   Карточки свайпаются / листаются стрелками и без этого скрипта; здесь только
   точки-индикаторы + tap-to-scroll. No-op, если каруселей нет или нет IO. */
(function () {
  'use strict';

  var carousels = document.querySelectorAll('.home-reviews__carousel');
  if (!carousels.length || !('IntersectionObserver' in window)) return;

  Array.prototype.forEach.call(carousels, function (track) {
    var cards = track.querySelectorAll('.review-card');
    if (cards.length < 2) return;

    var dots = document.createElement('div');
    dots.className = 'home-reviews__dots';
    dots.setAttribute('aria-hidden', 'true');

    var buttons = [];
    Array.prototype.forEach.call(cards, function (card) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'home-reviews__dot';
      b.addEventListener('click', function () {
        card.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      });
      dots.appendChild(b);
      buttons.push(b);
    });

    track.parentNode.insertBefore(dots, track.nextSibling);
    buttons[0].classList.add('is-active');

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var idx = Array.prototype.indexOf.call(cards, entry.target);
        if (idx < 0) return;
        buttons.forEach(function (b, i) {
          b.classList.toggle('is-active', i === idx);
        });
      });
    }, { root: track, threshold: 0.6 });

    Array.prototype.forEach.call(cards, function (card) { io.observe(card); });
  });
})();
