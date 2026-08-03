/* ══════════════════════════════════════════════════════════════════════
   Концепт D — «Две хроники».

   Главное здесь — синхронность: активная строка подсвечивается целиком,
   между колонками чертится перемычка, а год в липкой шапке меняется
   вместе с ней. Читатель всё время видит, к какому моменту относится
   и личная запись, и запись компании.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function watch(nodes, cb, opts) {
    if (!nodes.length) return;
    if (reduce || !('IntersectionObserver' in window)) { Array.prototype.forEach.call(nodes, cb); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); cb(e.target); } });
    }, opts || { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });
    Array.prototype.forEach.call(nodes, function (n) { io.observe(n); });
  }
  var on = function (el) { el.classList.add('is-on'); };

  var open = document.querySelector('.tw-open');
  if (open) requestAnimationFrame(function () { open.classList.add('is-on'); });
  watch(document.querySelectorAll('.tw-voice__media, .tw-voice__quote, .tw-keep, .tw-keep__i'), on);
  watch(document.querySelectorAll('.tw-geo'), on, { threshold: 0.05 });

  /* ── Активная строка + год ── */
  var rows = document.querySelectorAll('.tw-row');
  if (rows.length && !reduce) {
    var queued = false, current = null;
    function tick() {
      queued = false;
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var focus = vh * 0.46, best = null, bestD = 1e9;
      Array.prototype.forEach.call(rows, function (r) {
        var b = r.getBoundingClientRect();
        var d = Math.abs(b.top + Math.min(b.height, vh) / 2 - focus);
        if (d < bestD) { bestD = d; best = r; }
      });
      Array.prototype.forEach.call(rows, function (r) { r.classList.toggle('is-live', r === best); });
      if (!best) return;
      var y = best.getAttribute('data-year');
      if (y === current) return;
      current = y;
      /* список слева ведёт по хронике — активный год подсвечивается здесь */
      Array.prototype.forEach.call(document.querySelectorAll('.tw-years button'), function (b) {
        b.classList.toggle('is-live', b.getAttribute('data-go') === y);
      });
    }
    function queue() { if (!queued) { queued = true; requestAnimationFrame(tick); } }
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue, { passive: true });
    tick();

    /* ── Переход по годам: клик и стрелки клавиатуры ── */
    var jump = document.querySelectorAll('[data-go]');
    function goTo(year) {
      var row = document.querySelector('.tw-row[data-year="' + year + '"]');
      if (!row) return;
      /* отступ на липкую шапку сайта, иначе строка уезжает под неё */
      var nav = document.querySelector('.site-nav');
      var off = (nav ? nav.getBoundingClientRect().height : 0) + 40;
      var y = window.pageYOffset + row.getBoundingClientRect().top - off;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    Array.prototype.forEach.call(jump, function (b) {
      b.addEventListener('click', function () { goTo(b.getAttribute('data-go')); });
    });
    /* стрелками листаем по строкам, когда фокус внутри хроники */
    var chron = document.querySelector('.tw-chron');
    if (chron) {
      chron.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        var list = Array.prototype.slice.call(rows);
        var i = list.indexOf(document.querySelector('.tw-row.is-live'));
        if (i < 0) return;
        var next = list[i + (e.key === 'ArrowDown' ? 1 : -1)];
        if (!next) return;
        e.preventDefault();
        goTo(next.getAttribute('data-year'));
      });
    }

  }

  /* ── Ось хроники: заливка, скользящий бегунок и вспышки на перекрёстках ──
     Бегунок идёт по той же координате, что и заливка, поэтому «голова»
     линии и точка всегда совпадают. Вспышка срабатывает в момент, когда
     бегунок проходит узел, и только один раз за проход — иначе при мелких
     подрагиваниях прокрутки узел мигал бы без остановки. */
  var rowsWrap = document.querySelector('.tw-rows');
  var axisWrap = document.querySelector('.tw-axis');
  var axis = axisWrap && axisWrap.querySelector('i');
  var dot = axisWrap && axisWrap.querySelector('b');
  if (rowsWrap && axis && !reduce) {
    var qa = false, prevY = -1;
    function axTick() {
      qa = false;
      var b = rowsWrap.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      /* 0 — верх оси на линии взгляда, 1 — низ оси на ней же. Раньше здесь
         стоял множитель 0.86, из-за которого линия доезжала до конца уже
         на середине хроники. */
      var focus = vh * 0.45;
      var p = (focus - b.top) / Math.max(1, b.height);
      p = Math.max(0, Math.min(1, p));
      axis.style.setProperty('--ax', p.toFixed(4));

      var y = p * b.height;                     /* позиция головы линии в px */
      if (dot) {
        dot.style.setProperty('--dot', y.toFixed(1));
        dot.style.opacity = p > 0.001 && p < 0.999 ? '1' : '0';
      }

      /* Проверяем, не пересёк ли бегунок узел с прошлого кадра. Большой
         скачок (переход по году, тап по полосе прокрутки) вспышками не
         сопровождаем — иначе за один кадр «выстрелят» все узлы сразу. */
      if (prevY >= 0 && Math.abs(y - prevY) < 220) {
        Array.prototype.forEach.call(rows, function (r) {
          var node = r.offsetTop + nodeOffset(r);
          var crossed = (prevY < node && y >= node) || (prevY > node && y <= node);
          if (!crossed || r.classList.contains('is-flash')) return;
          r.classList.add('is-flash');
          setTimeout(function () { r.classList.remove('is-flash'); }, 900);
        });
      }
      prevY = y;
    }
    /* Высоту узла берём с перемычки: она стоит ровно на той же линии, но,
       в отличие от псевдоэлемента, её можно измерить. Значение --node-y
       содержит calc() и из вычисленных стилей не парсится. */
    function nodeOffset(row) {
      var link = row.querySelector('.tw-link');
      if (!link) return 74;
      return link.getBoundingClientRect().top - row.getBoundingClientRect().top;
    }
    function axQ() { if (!qa) { qa = true; requestAnimationFrame(axTick); } }
    window.addEventListener('scroll', axQ, { passive: true });
    window.addEventListener('resize', axQ, { passive: true });
    axTick();
  }

  /* ── Раскрытие деталей: высота анимируется, а не прыгает ── */
  Array.prototype.forEach.call(document.querySelectorAll('.tw-more'), function (btn) {
    var panel = btn.nextElementSibling;
    if (!panel) return;
    var anim = null;
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      if (anim) anim.cancel();
      if (reduce || !panel.animate) { panel.hidden = open; return; }
      if (!open) {
        panel.hidden = false;
        var h = panel.scrollHeight;
        anim = panel.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }],
          { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' });
        anim.onfinish = function () { anim = null; };
      } else {
        var h2 = panel.scrollHeight;
        anim = panel.animate([{ height: h2 + 'px', opacity: 1 }, { height: '0px', opacity: 0 }],
          { duration: 380, easing: 'cubic-bezier(.16,1,.3,1)' });
        anim.onfinish = function () { panel.hidden = true; anim = null; };
      }
    });
  });

  /* ── Параллакс портрета ── */
  var frame = document.querySelector('.tw-voice__frame');
  var img = frame && frame.querySelector('img');
  if (frame && img && !reduce) {
    var qp = false;
    function par() {
      qp = false;
      var b = frame.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      if (b.bottom < -200 || b.top > vh + 200) return;
      var k = (b.top + b.height / 2 - vh / 2) / (vh / 2 + b.height / 2);
      img.style.setProperty('--par', (k * -28).toFixed(1));
    }
    function parQ() { if (!qp) { qp = true; requestAnimationFrame(par); } }
    window.addEventListener('scroll', parQ, { passive: true });
    window.addEventListener('resize', parQ, { passive: true });
    par();
  }

  /* ── Цитата набирается по мере прокрутки ──
     Слово загорается, когда прокрутка доходит до его очереди: реплика
     читается в том же темпе, в каком её произносят. Разбиваем по словам
     в JS, чтобы в разметке остался обычный текст — он и попадёт в поиск,
     и озвучится скринридером одной фразой. */
  var quote = document.querySelector('.tw-voice__quote p[data-words]');
  if (quote && !reduce) {
    var raw = quote.textContent, words = raw.split(/(\s+)/);
    quote.textContent = '';
    var spans = [];
    words.forEach(function (w) {
      if (!w.trim()) { quote.appendChild(document.createTextNode(w)); return; }
      var s = document.createElement('span');
      s.className = 'w';
      /* имя выделяем цветом само по себе — знаки препинания рядом с ним
         остаются обычными, иначе терракотовой становится и запятая */
      var m = w.match(/^(.*?)(Krepko)(.*)$/);
      if (m) {
        if (m[1]) s.appendChild(document.createTextNode(m[1]));
        var hi = document.createElement('em');
        hi.className = 'hi'; hi.textContent = m[2];
        s.appendChild(hi);
        if (m[3]) s.appendChild(document.createTextNode(m[3]));
      } else {
        s.textContent = w;
      }
      quote.appendChild(s); spans.push(s);
    });
    var qw = false, lit = -1;
    function words_tick() {
      qw = false;
      var b = quote.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      /* набор начинается, когда цитата поднялась выше трёх четвертей окна,
         и заканчивается, когда её низ дошёл до середины */
      var p = (vh * 0.78 - b.top) / Math.max(1, b.height + vh * 0.24);
      p = Math.max(0, Math.min(1, p));
      var n = Math.round(p * spans.length);
      if (n === lit) return;
      lit = n;
      spans.forEach(function (s, i) { s.classList.toggle('on', i < n); });
    }
    function wordsQ() { if (!qw) { qw = true; requestAnimationFrame(words_tick); } }
    window.addEventListener('scroll', wordsQ, { passive: true });
    window.addEventListener('resize', wordsQ, { passive: true });
    words_tick();
  }

  /* ── Счёт цифр ── */
  watch(document.querySelectorAll('.tw-nums dd'), function (el) {
    var to = parseInt(el.getAttribute('data-to'), 10);
    if (!to || reduce) return;
    var DUR = 1400, t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / DUR, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = '0';
    requestAnimationFrame(step);
  }, { threshold: 0.6 });

  if (!reduce && window.matchMedia && window.matchMedia('(hover: hover)').matches) {
    Array.prototype.forEach.call(document.querySelectorAll('.magnet'), function (el) {
      el.addEventListener('mousemove', function (e) {
        var b = el.getBoundingClientRect();
        var dx = (e.clientX - (b.left + b.width / 2)) / (b.width / 2);
        var dy = (e.clientY - (b.top + b.height / 2)) / (b.height / 2);
        el.style.transform = 'translate(' + (dx * 7).toFixed(1) + 'px,' + (dy * 5).toFixed(1) + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }
})();
