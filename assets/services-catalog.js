/* Поиск по каталогу услуг /services/ (2026-08-06).

   Набор двух букв фильтрует ссылки услуг внутри карточек и прячет
   карточки без совпадений; совпадение по названию направления оставляет
   карточку целиком. Пустой запрос возвращает исходное состояние.
   Без скрипта поиск скрыт (<noscript> в шаблоне) — каталог полный. */
(function () {
  var input = document.getElementById('svc-search');
  var grid = document.getElementById('svc-grid');
  var empty = document.getElementById('svc-search-empty');
  if (!input || !grid) return;

  var cards = [].slice.call(grid.querySelectorAll('.svc-card'));

  function reset() {
    cards.forEach(function (card) {
      card.hidden = false;
      [].forEach.call(card.querySelectorAll('.svc-card__links li'), function (li) {
        li.hidden = false;
      });
    });
    if (empty) empty.hidden = true;
  }

  input.addEventListener('input', function () {
    var q = input.value.trim().toLowerCase();
    if (q.length < 2) { reset(); return; }

    var found = 0;
    cards.forEach(function (card) {
      var title = card.querySelector('.svc-card__title');
      var titleHit = title && title.textContent.toLowerCase().indexOf(q) !== -1;
      var hits = 0;
      [].forEach.call(card.querySelectorAll('.svc-card__links li'), function (li) {
        var match = titleHit || li.textContent.toLowerCase().indexOf(q) !== -1;
        li.hidden = !match;
        if (match) hits++;
      });
      var show = titleHit || hits > 0;
      card.hidden = !show;
      if (show) found++;
    });
    if (empty) empty.hidden = found > 0;
  });
})();
