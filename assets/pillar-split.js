/* Меню направления на узком экране: свёрнуто за кнопку с названием текущей
   страницы. Без скрипта раскрытый вид включает <noscript> в шаблоне —
   класс на <html> для этого не годится: он ставится уже после первой
   отрисовки, и переход к свёрнутому состоянию залипал на полной высоте. */
(function () {
  var nav = document.querySelector('.pillar-nav');
  if (!nav) return;
  var toggle = nav.querySelector('.pillar-nav__toggle');
  if (!toggle) return;

  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
})();
