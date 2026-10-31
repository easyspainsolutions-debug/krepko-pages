(function () {
if (!window.matchMedia) return;
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
if (!window.matchMedia('(hover: hover)').matches) return;
if (!window.requestAnimationFrame) return;
var dot = document.createElement('div');
dot.className = 'krepko-cursor';
dot.setAttribute('aria-hidden', 'true');
document.body.appendChild(dot);
var mx = 0, my = 0, cx = 0, cy = 0, raf = null, started = false;
function frame() {
cx += (mx - cx) * 0.18;
cy += (my - cy) * 0.18;
dot.style.setProperty('--cx', cx.toFixed(1) + 'px');
dot.style.setProperty('--cy', cy.toFixed(1) + 'px');
if (Math.abs(mx - cx) < 0.15 && Math.abs(my - cy) < 0.15) { raf = null; return; }
raf = requestAnimationFrame(frame);
}
function pump() { if (raf === null) raf = requestAnimationFrame(frame); }
document.addEventListener('mousemove', function (e) {
mx = e.clientX;
my = e.clientY;
if (!started) {
started = true;
cx = mx; cy = my;
dot.style.setProperty('--cx', cx.toFixed(1) + 'px');
dot.style.setProperty('--cy', cy.toFixed(1) + 'px');
dot.classList.add('is-live');
}
pump();
}, { passive: true });
document.addEventListener('mouseleave', function () { dot.classList.remove('is-live'); });
document.addEventListener('mouseenter', function () { if (started) dot.classList.add('is-live'); });
var DARK = '.site-footer, .marquee, .ab-dark, .home-founder--dark, [data-dark]';
var HOT = 'a, button, summary, input, select, textarea, label[for], ' +
'.map__pin, [role="button"]';
document.addEventListener('mouseover', function (e) {
var t = e.target;
if (!t || !t.closest) return;
dot.classList.toggle('is-over', !!t.closest(HOT));
dot.classList.toggle('is-dark', !!t.closest(DARK));
}, { passive: true });
})();
