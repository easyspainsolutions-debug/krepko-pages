/* Лента отзывов — вынесена из home-redesign.js (2026-08-07).

   Блок отзывов переехал в modules/reviews_carousel.html и включается на
   главной и на страницах услуг. Тащить ради него весь home-redesign.js
   (48 KB логики главной: параллакс, счётчики, карта) не нужно —
   карусель самодостаточна и молча выходит, если трека на странице нет. */
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
