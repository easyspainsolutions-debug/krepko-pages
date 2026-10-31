(function () {
'use strict';
var wrap = document.querySelector('.pillar-split[data-svc-layout]');
if (!wrap || !window.matchMedia) return;
var railMq = window.matchMedia('(min-width: 1280px)');
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
