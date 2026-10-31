/* Страница услуги v3 (30.10.2026): метка кнопки карточки для Pulse. Только
   страницы услуг и «услуга × город» (.pillar-split[data-svc-layout] —
   шаблоны service_page_split.html и service_page_city.html); телефон не
   меняется.

   Метка. В раскладке «rail» (от 1280 px, service-page.css) кнопка под H1
   стоит в карточке справа — её нажатия Pulse считает отдельно:
   data-cta="card" вместо "sell-head". Через 2 недели — сравнение нажатий
   WhatsApp с компьютера на 100 входов на услугу с двумя неделями до.

   Одна кнопка WhatsApp на экране — общая для всего сайта, её ведёт
   site-nav.js (<html data-wa-in>, выключатель data/site.yaml →
   bars.desktop_one_wa); кнопку карточки он тоже учитывает. Свой детектор
   страницы услуги (elementFromPoint, выключатель service_page.one_wa) снят
   при слиянии потоков 30.10: два скрипта писали один и тот же атрибут. */
(function () {
  'use strict';
  var wrap = document.querySelector('.pillar-split[data-svc-layout]');
  if (!wrap || !window.matchMedia) return;
  var railMq = window.matchMedia('(min-width: 1280px)');   // как @media «rail» в service-page.css
  var isRail = wrap.getAttribute('data-svc-layout') === 'rail';

  function listen(mq, fn) {
    if (mq.addEventListener) mq.addEventListener('change', fn);
    else if (mq.addListener) mq.addListener(fn);
  }

  var cardBtn = wrap.querySelector('.pillar-doc > .sell-head .sell-cta a[href*="wa.me/"]');
  function label() {
    if (cardBtn) cardBtn.setAttribute('data-cta', isRail && railMq.matches ? 'card' : 'sell-head');
  }
  label();
  listen(railMq, label);
})();
