/* Карусели отзывов — обе версии блока в одном файле (2026-08-07).

   На сайте живут две разметки отзывов: старая (.home-reviews__carousel,
   ~106 страниц: города, направления, документы) и новая лента с главной
   (#rv-track, главная + 59 страниц услуг). 2026-08-07 файл был по ошибке
   перезаписан только новым скриптом, и точки старой карусели пропали;
   теперь здесь оба блока, каждый молча выходит, если его разметки нет.

   Подключается ОДИН раз из base.html. Guard ниже — от двойной загрузки
   с разными ?v=: два прогона рисовали точки дважды. */
(function () {
  if (window.__krepkoReviewsCarousel) return;
  window.__krepkoReviewsCarousel = true;
})();
if (!window.__krepkoReviewsCarouselRan) {
window.__krepkoReviewsCarouselRan = true;

/* ── 1. Старый блок: точки-индикаторы (июнь 2026) ── */
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

/* ── 2. Лента с главной ── */
/* Round 43 (+ мобильные точки 2026-08-04): лента отзывов.
   Позиции считаем по offsetLeft карточек, а не по ширине трека: на
   мобилке карточка занимает 88% (следующая выглядывает из-за края),
   и равенство «индекс × ширина трека» перестало быть правдой. */
(function(){
  var track = document.getElementById('rv-track');
  var prev  = document.getElementById('rv-prev');
  var next  = document.getElementById('rv-next');
  if (!track) return;

  var cards = track.querySelectorAll('.rv');
  var idx = 0;

  /* точки под лентой — единственная навигация, пока стрелки скрыты */
  var dots = null, dotBtns = [];
  if (cards.length > 1) {
    dots = document.createElement('div');
    dots.className = 'rv-dots';
    Array.prototype.forEach.call(cards, function (c, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Отзыв ' + (i + 1) + ' из ' + cards.length);
      b.addEventListener('click', function () { go(i); });
      dots.appendChild(b); dotBtns.push(b);
    });
    track.parentNode.insertBefore(dots, track.nextSibling);
  }

  function go(i){
    idx = Math.max(0, Math.min(cards.length - 1, i));
    track.scrollTo({ left: cards[idx].offsetLeft, behavior: 'smooth' });
    sync();
  }
  function sync(){
    if (prev) prev.disabled = idx <= 0;
    if (next) next.disabled = idx >= cards.length - 1;
    dotBtns.forEach(function (b, i) { b.classList.toggle('is-on', i === idx); });
  }
  if (prev) prev.addEventListener('click', function(){ go(idx - 1); });
  if (next) next.addEventListener('click', function(){ go(idx + 1); });

  /* ручная прокрутка/свайп — индекс по ближайшей карточке */
  var t = null;
  function nearest(){
    var x = track.scrollLeft, best = 0, bd = 1e9;
    Array.prototype.forEach.call(cards, function (c, i) {
      var d = Math.abs(c.offsetLeft - x);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }
  track.addEventListener('scroll', function(){
    if (t) clearTimeout(t);
    t = setTimeout(function(){ idx = nearest(); sync(); }, 90);
  }, {passive: true});

  window.addEventListener('resize', function(){
    track.scrollLeft = cards[idx] ? cards[idx].offsetLeft : 0;
    sync();
  }, {passive: true});

  sync();
})();

}
