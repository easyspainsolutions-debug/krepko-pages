(function () {
if (window.__krepkoReviewsCarousel) return;
window.__krepkoReviewsCarousel = true;
})();
if (!window.__krepkoReviewsCarouselRan) {
window.__krepkoReviewsCarouselRan = true;
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
var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
card.scrollIntoView({ behavior: still ? 'auto' : 'smooth', inline: 'start', block: 'nearest' });
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
(function(){
var track = document.getElementById('rv-track');
var prev = document.getElementById('rv-prev');
var next = document.getElementById('rv-next');
if (!track) return;
var cards = track.querySelectorAll('.rv');
var idx = 0;
var dots = null, dotBtns = [];
if (cards.length > 1) {
dots = document.createElement('div');
dots.className = 'rv-dots';
Array.prototype.forEach.call(cards, function (c, i) {
var b = document.createElement('button');
b.type = 'button';
var uk = (document.documentElement.getAttribute('lang') || '').slice(0, 2) === 'uk';
b.setAttribute('aria-label', (uk ? 'Відгук ' : 'Отзыв ') + (i + 1) + (uk ? ' з ' : ' из ') + cards.length);
b.addEventListener('click', function () { go(i); });
dots.appendChild(b); dotBtns.push(b);
});
track.parentNode.insertBefore(dots, track.nextSibling);
}
var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var lock = -1, lockT = 0;
function go(i){
idx = Math.max(0, Math.min(cards.length - 1, i));
lock = idx;
clearTimeout(lockT);
lockT = setTimeout(function () {
lock = -1;
var n = nearest();
if (n !== idx) { idx = n; sync(); }
}, 1200);
track.scrollTo({ left: cards[idx].offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
sync();
}
function sync(){
if (prev) prev.disabled = idx <= 0;
if (next) next.disabled = idx >= cards.length - 1;
dotBtns.forEach(function (b, i) { b.classList.toggle('is-on', i === idx); });
}
if (prev) prev.addEventListener('click', function(){ go(idx - 1); });
if (next) next.addEventListener('click', function(){ go(idx + 1); });
var raf = 0;
function nearest(){
var x = track.scrollLeft, best = 0, bd = 1e9;
Array.prototype.forEach.call(cards, function (c, i) {
var d = Math.abs(c.offsetLeft - x);
if (d < bd) { bd = d; best = i; }
});
return best;
}
track.addEventListener('scroll', function(){
if (raf) return;
raf = requestAnimationFrame(function(){
raf = 0;
var n = nearest();
if (lock >= 0) {
if (n !== lock) return;
lock = -1; clearTimeout(lockT);
}
if (n !== idx) { idx = n; sync(); }
});
}, {passive: true});
window.addEventListener('resize', function(){
track.scrollLeft = cards[idx] ? cards[idx].offsetLeft : 0;
sync();
}, {passive: true});
sync();
})();
}
