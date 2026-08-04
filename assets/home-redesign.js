(function(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var els = Array.prototype.filter.call(
    document.querySelectorAll('.reveal, .timeline-item, .anim'),
    function(el){ return !el.closest || !el.closest('[data-anim-group]'); }
  );
  if (!('IntersectionObserver' in window)) { els.forEach(function(e){e.classList.add('is-visible');}); return; }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
    });
  }, {threshold: 0.12, rootMargin: '0px 0px -40px 0px'});
  els.forEach(function(e){ io.observe(e); });
})();

(function(){
  var nav = document.querySelector('.site-nav');
  if (!nav) return;
  var stuck = null;
  function update(){
    var next = window.scrollY > 8;
    if (next !== stuck) { stuck = next; nav.classList.toggle('is-stuck', next); }
  }
  window.addEventListener('scroll', update, {passive: true});
  update();
})();


(function(){
  var bar = document.getElementById('scroll-progress-bar');
  if (!bar) return;
  function update(){
    var doc = document.documentElement;
    var max = (doc.scrollHeight - window.innerHeight);
    var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (pct < 0) pct = 0; if (pct > 100) pct = 100;
    bar.style.width = pct + '%';
  }
  window.addEventListener('scroll', update, {passive: true});
  window.addEventListener('resize', update, {passive: true});
  update();
})();

(function(){
  // hero занимает ровно остаток экрана так, чтобы тикер сел на нижнюю кромку
  var hero = document.querySelector('.hero--home');
  var ticker = document.querySelector('.ticker');
  if (!hero || !ticker) return;
  function fit(){
    if (window.innerWidth <= 720) { hero.style.minHeight = ''; return; }
    hero.style.minHeight = '';                       // сброс перед замером
    var heroTop = hero.getBoundingClientRect().top + window.scrollY;
    var tickerH = ticker.getBoundingClientRect().height;
    var avail = window.innerHeight - heroTop - tickerH;
    hero.style.minHeight = Math.max(340, Math.round(avail)) + 'px';
  }
  fit();
  window.addEventListener('resize', fit, {passive: true});
  window.addEventListener('load', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
})();

(function(){
  // Подстраховка к IntersectionObserver: обычная проверка по скроллу.
  // IO не отдаёт колбэки, когда вкладка неактивна/скрыта — тогда блоки
  // остались бы невидимыми навсегда. Здесь показываем всё, что вошло в экран.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var nodes = Array.prototype.filter.call(
    document.querySelectorAll('.reveal, .timeline-item, .anim'),
    function(el){ return !el.closest || !el.closest('[data-anim-group]'); }
  );
  if (!nodes.length) return;
  function check(){
    var vh = window.innerHeight || document.documentElement.clientHeight;
    for (var i = nodes.length - 1; i >= 0; i--) {
      var el = nodes[i];
      var r = el.getBoundingClientRect();
      if (r.top < vh - 40 && r.bottom > 0) {
        el.classList.add('is-visible');
        nodes.splice(i, 1);
      }
    }
  }
  window.addEventListener('scroll', check, {passive: true});
  window.addEventListener('resize', check, {passive: true});
  window.addEventListener('load', check);
  check();
})();

(function(){
  var form = document.getElementById('krepko-form');
  if (!form) return;
  var status = document.getElementById('cform-status');
  var btn = form.querySelector('.cform__submit');
  var btnText = btn ? btn.textContent : '';

  function show(kind, text){
    if (!status) return;
    status.hidden = false;
    status.className = 'cform__status cform__status--' + kind;
    status.textContent = text;
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();

    // родная валидация браузера — без неё пустая форма улетит на сервер
    if (!form.checkValidity()) { form.reportValidity(); return; }

    var key = form.querySelector('input[name=access_key]');
    if (!key || !key.value || key.value.indexOf('ВСТАВЬТЕ') === 0) {
      show('err', 'Форма ещё не подключена к почте. Напишите, пожалуйста, в WhatsApp.');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Отправляем…';
    if (status) status.hidden = true;

    fetch(form.action, {
      method: 'POST',
      headers: {'Accept': 'application/json'},
      body: new FormData(form)
    })
    .then(function(r){ return r.json().catch(function(){ return {success: r.ok}; }); })
    .then(function(data){
      if (data && data.success) {
        form.reset();
        show('ok', 'Заявка отправлена. Krepko свяжется с вами в ближайшее время.');
      } else {
        show('err', 'Не удалось отправить. Попробуйте ещё раз или напишите в WhatsApp.');
      }
    })
    .catch(function(){
      show('err', 'Не удалось отправить. Проверьте соединение или напишите в WhatsApp.');
    })
    .finally(function(){
      btn.disabled = false;
      btn.textContent = btnText;
    });
  });
})();

(function(){
  var trigger = document.getElementById('mega-trigger');
  var panel = document.getElementById('mega-menu');
  var overlay = document.getElementById('mega-overlay');
  if (!trigger || !panel) return;
  var open = false;

  var hideTimer = null;
  var REVEAL = 360;   /* синхронно с transition у .mega */

  function setOpen(v){
    open = v;
    trigger.setAttribute('aria-expanded', v ? 'true' : 'false');
    if (overlay) overlay.classList.toggle('is-on', v);

    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }

    if (v) {
      panel.hidden = false;
      /* принудительный reflow: без него браузер объединит снятие hidden
         и добавление класса в один кадр, и шторка не «поедет» */
      void panel.offsetWidth;
      panel.classList.add('is-open');
    } else {
      panel.classList.remove('is-open');
      /* прячем только после того, как шторка свернулась */
      hideTimer = setTimeout(function(){
        if (!open) panel.hidden = true;
        hideTimer = null;
      }, REVEAL);
    }
  }
  trigger.addEventListener('click', function(e){ e.stopPropagation(); setOpen(!open); });

  // закрытие: клик вне панели, Esc, уход мышью
  document.addEventListener('click', function(e){
    if (open && !panel.contains(e.target) && e.target !== trigger) setOpen(false);
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && open) { setOpen(false); trigger.focus(); }
  });
  panel.addEventListener('mouseleave', function(){ if (open) setOpen(false); });
})();

/* Round 27: дорожка шагов — терракотовая заливка по мере скролла.
   Считаем прогресс прохождения блока через вьюпорт и пишем в --p;
   кружки загораются чуть раньше, чем линия до них дотянулась. */
(function(){
  var steps = document.querySelector('.intro__how .steps');
  if (!steps) return;
  var items = steps.querySelectorAll('.step');
  if (!items.length) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    steps.style.setProperty('--p', 1);
    for (var k = 0; k < items.length; k++) items[k].classList.add('is-on');
    return;
  }

  var segs = items.length - 1;          // сегментов на один меньше, чем кружков
  var queued = false;
  function update(){
    queued = false;
    var r  = steps.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    if (!vh) return;
    var start = vh * 0.88;              // блок вошёл снизу — прогресс 0
    var end   = vh * 0.38;              // дошёл до верхней трети — прогресс 1
    var p = (start - r.top) / (start - end);
    p = p < 0 ? 0 : (p > 1 ? 1 : p);
    for (var i = 0; i < items.length; i++) {
      // локальная заливка сегмента i: от i/segs до (i+1)/segs общего прогресса
      if (i < segs) {
        var s = p * segs - i;
        s = s < 0 ? 0 : (s > 1 ? 1 : s);
        items[i].style.setProperty('--seg', s.toFixed(3));
      }
      // кружок загорается, когда линия до него дошла (первый — на старте)
      var on = i === 0 ? p > 0.01 : p >= i / segs;
      items[i].classList[on ? 'add' : 'remove']('is-on');
    }
  }
  function schedule(){
    if (queued) return;
    queued = true;
    if (window.requestAnimationFrame) window.requestAnimationFrame(update);
    else setTimeout(update, 16);
  }
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', schedule, {passive: true});
  update();
})();

/* Round 38a: счётчики метрик — цифры набегают при въезде в экран.
   Берём только числовые значения: «RU UA ES EN» пропускаем, у «30 минут»
   крутим число и возвращаем хвост. Пишем через textContent, разметку не трогаем. */
(function(){
  var els = document.querySelectorAll('.stat__value');
  if (!els.length) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var items = [];
  for (var i = 0; i < els.length; i++) {
    var raw = els[i].textContent.trim();
    /* число обязано кончаться цифрой, иначе жадный [\d\s]* съедал пробел
       перед хвостом и во время счёта показывало «30минут» */
    var m = raw.match(/^([\d\s]*\d)(.*)$/);
    if (!m) continue;                              /* RU UA ES EN — мимо */
    var to = parseInt(m[1].replace(/\s/g, ''), 10);
    /* год не крутим от нуля — начинаем за 30 лет до него, иначе «В Испании с»
       пробегает через 500 и 1200, что читается бессмыслицей */
    var from = (to > 1900 && to < 2100) ? to - 30 : 0;
    items.push({ el: els[i], from: from, to: to, tail: m[2], done: false, orig: raw });
    if (!reduce) els[i].textContent = from + m[2];
  }
  if (!items.length || reduce) return;

  function run(it){
    it.done = true;
    var DUR = 1100, t0 = null;
    function frame(ts){
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / DUR, 1);
      var eased = 1 - Math.pow(1 - p, 3);          /* ease-out: быстро, потом плавно */
      it.el.textContent = Math.round(it.from + (it.to - it.from) * eased) + it.tail;
      if (p < 1) requestAnimationFrame(frame);
      else it.el.textContent = it.orig;            /* точное исходное значение */
    }
    requestAnimationFrame(frame);
  }

  function check(){
    var vh = window.innerHeight || document.documentElement.clientHeight;
    for (var i = 0; i < items.length; i++) {
      if (items[i].done) continue;
      var r = items[i].el.getBoundingClientRect();
      if (r.top < vh * 0.9 && r.bottom > 0) run(items[i]);
    }
  }
  window.addEventListener('scroll', check, {passive: true});
  window.addEventListener('resize', check, {passive: true});
  check();
})();

/* Round 38c: «RU UA ES EN» — буквы перебираются и по очереди встают на места
   слева направо. Позиция фиксируется каждые STEP мс, до фиксации показывает
   случайную букву. Пробелы не трогаем, чтобы строка не «дышала» шириной. */
(function(){
  var el = document.querySelector('.stat__value--langs');
  if (!el) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  var target = el.textContent;
  var CHARS  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var STEP   = 85;      /* через столько встаёт следующая буква */
  var started = false;

  /* сколько живых (непробельных) позиций прошли до каждого индекса */
  var order = [], seen = 0;
  for (var i = 0; i < target.length; i++) {
    var isSpace = /\s/.test(target.charAt(i));
    order.push(isSpace ? -1 : seen++);
  }
  var total = seen * STEP + 260;

  function run(){
    started = true;
    var t0 = null;
    function frame(ts){
      if (t0 === null) t0 = ts;
      var t = ts - t0, out = '';
      for (var i = 0; i < target.length; i++) {
        if (order[i] === -1) { out += target.charAt(i); continue; }
        out += (t >= order[i] * STEP)
          ? target.charAt(i)
          : CHARS.charAt(Math.floor(Math.random() * CHARS.length));
      }
      el.textContent = out;
      if (t < total) requestAnimationFrame(frame);
      else el.textContent = target;
    }
    requestAnimationFrame(frame);
  }

  function check(){
    if (started) return;
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var r = el.getBoundingClientRect();
    if (r.top < vh * 0.9 && r.bottom > 0) run();
  }
  window.addEventListener('scroll', check, {passive: true});
  window.addEventListener('resize', check, {passive: true});
  check();
})();

/* Round 38b: портрет движется медленнее страницы — лёгкая глубина. */
(function(){
  var fig = document.querySelector('.portrait__frame');
  if (!fig) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  var queued = false;
  function update(){
    queued = false;
    var r = fig.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    if (!vh || r.bottom < 0 || r.top > vh) return;
    /* -1…1 по мере прохождения блока через экран → сдвиг ±22px */
    var progress = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
    fig.style.setProperty('--par', (progress * -22).toFixed(1) + 'px');
  }
  function schedule(){
    if (queued) return;
    queued = true;
    if (window.requestAnimationFrame) requestAnimationFrame(update);
    else setTimeout(update, 16);
  }
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', schedule, {passive: true});
  update();
})();


/* Round 47: карта Испании ↔ карточка города.
   Город выбирается точкой на карте или стрелками под карточкой. Активная
   точка увеличивается, провинция подсвечивается с прочерчиванием контура. */
(function(){
  var pins  = document.querySelectorAll('.map__pin');
  var provs = document.querySelectorAll('.map__prov');
  var rays  = document.querySelectorAll('.map__ray');
  var cards = document.querySelectorAll('.city__card');
  var track = document.getElementById('city-track');
  var sats  = document.querySelectorAll('.map__sat');
  var dists = document.querySelectorAll('.map__dist');
  var prev  = document.getElementById('city-prev');
  var next  = document.getElementById('city-next');
  if (!pins.length || !cards.length) return;

  var idx = 0;

  /* ===== Партитура вступления (отсчёт от появления секции в экране) =====
     0.00  контур страны прочерчивается (1.8s)
     1.80  точки городов проступают каскадом, шаг .15s, последняя в 2.55
     1.80  обводка провинции активного города — вместе с его точкой
     2.90  спутники провинции — когда её обводка дочерчена
     3.00  выстреливают лучи; импульсы уходят залпом и зажигают города     */
  var T_PINS = 1.80, T_SATS = 2.90, T_RAYS = 3.00;
  var RAY_STEP = 0.12, RAY_DRAW = 0.90;   /* шаг между линиями и время прокладки одной */
  /* та же шкала, что у rAF-таймстампа, — иначе волна и её кадры разъедутся */
  var now = (window.performance && performance.now)
    ? function(){ return performance.now(); }
    : function(){ return Date.now(); };
  var introAt = null;                    /* до старта партитуры лучи не летят */

  /* Волна: три стопа градиента едут вдоль линии, сохраняя ширину WAVE_W.
     Центр стартует за началом (-W/2) и уходит за конец (1+W/2), поэтому
     доходит до города на доле (1+W/2)/(1+W) полного цикла. */
  /* Импульсы уходят залпом, но скорость у каждого своя — время полёта растёт
     с длиной луча. До Мурсии рядом импульс добегает быстро, до Барселоны идёт
     дольше, поэтому города вспыхивают вразнобой, а не хором. */
  var WAVE_T = 2.8, WAVE_W = 0.28;
  var FLY_MIN = 0.55, FLY_MAX = 1.50;
  var reduceMo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var waves = [], rafId = null;
  function stopEls(id){
    var g = document.getElementById(id);
    return g ? {
      tail: g.querySelector('.ray-tail'),
      core: g.querySelector('.ray-core'),
      head: g.querySelector('.ray-head')
    } : null;
  }
  function clampOff(v){ return v < 0 ? 0 : (v > 1 ? 1 : v); }

  function frame(now){
    var alive = 0;
    for (var i = 0; i < waves.length; i++) {
      var w = waves[i];
      var el = (now - w.t0) / 1000;
      if (el < 0) { alive++; continue; }        /* луч ещё не выстрелил */
      alive++;
      var cyc = Math.floor(el / WAVE_T);
      var f = el % WAVE_T;
      /* импульс проходит линию за w.fly, остаток цикла отдыхает за её концом */
      var c = f <= w.fly
        ? -WAVE_W / 2 + (1 + WAVE_W) * (f / w.fly)
        : 1 + WAVE_W / 2;
      w.s.tail.setAttribute('offset', clampOff(c - WAVE_W / 2).toFixed(4));
      w.s.core.setAttribute('offset', clampOff(c).toFixed(4));
      w.s.head.setAttribute('offset', clampOff(c + WAVE_W / 2).toFixed(4));
      /* город-источник вспыхивает, когда импульс уходит, — в начале цикла */
      if (w.src && w.sent !== cyc) { w.sent = cyc; flash(w.src); }
      /* центр волны дошёл до города-цели — вспышка ровно здесь, раз за цикл */
      if (w.fired !== cyc && f >= w.hit) {
        w.fired = cyc;
        flash(w.pin);
        if (w.dist) w.dist.classList.add('is-on');   /* расстояние проступает с импульсом */
      }
    }
    rafId = alive ? requestAnimationFrame(frame) : null;
  }
  function pump(){
    if (rafId === null && waves.length && window.requestAnimationFrame) rafId = requestAnimationFrame(frame);
  }
  function clearWaves(){
    for (var i = 0; i < waves.length; i++) {
      waves[i].s.tail.setAttribute('offset', 0);
      waves[i].s.core.setAttribute('offset', 0);
      waves[i].s.head.setAttribute('offset', 0);
    }
    waves = [];
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  }

  /* Перевешивание класса перезапускает одноразовую CSS-вспышку. */
  function flash(pin){
    if (!pin) return;
    pin.classList.remove('is-hit');
    void pin.getBoundingClientRect();
    pin.classList.add('is-hit');
  }
  function distBy(from, to){
    for (var d = 0; d < dists.length; d++) {
      if (dists[d].getAttribute('data-from') === from && dists[d].getAttribute('data-to') === to) return dists[d];
    }
    return null;
  }
  function pinBy(slug){
    for (var k = 0; k < pins.length; k++) {
      if (pins[k].getAttribute('data-city') === slug) return pins[k];
    }
    return null;
  }

  function show(i){
    idx = (i + pins.length) % pins.length;
    var slug = pins[idx].getAttribute('data-city');

    /* лента едет к нужному городу — так же, как лента отзывов */
    for (var a = 0; a < cards.length; a++) {
      cards[a].classList.toggle('is-current', a === idx);
    }
    if (track && track.clientWidth) {
      track.scrollTo
        ? track.scrollTo({left: idx * track.clientWidth, behavior: 'smooth'})
        : (track.scrollLeft = idx * track.clientWidth);
    }
    for (var b = 0; b < pins.length; b++) {
      pins[b].classList.toggle('is-active', b === idx);
      pins[b].classList.remove('is-hit');       /* пульс начнётся заново, от новых лучей */
    }
    /* спутники выбранной провинции проступают вслед за её обводкой */
    for (var st = 0; st < sats.length; st++) {
      sats[st].classList.toggle('is-on', sats[st].getAttribute('data-prov') === slug);
    }
    /* расстояния гаснут и зажгутся заново — каждое в момент прилёта своего импульса */
    for (var dt = 0; dt < dists.length; dt++) {
      dists[dt].classList.toggle('is-on', reduceMo && dists[dt].getAttribute('data-from') === slug);
    }

    for (var c = 0; c < provs.length; c++) {
      var isOn = provs[c].getAttribute('data-prov') === slug;
      provs[c].classList.remove('is-on');
      if (isOn) {
        void provs[c].getBoundingClientRect();   /* перезапуск прочерчивания */
        provs[c].classList.add('is-on');
      }
    }
    /* Лучи от активного города. Линии прокладываются по очереди (шаг RAY_STEP),
       а импульсы уходят залпом — все разом, в момент вспышки города-источника.
       Поэтому общий ноль волн один на всех: когда последняя линия дочерчена. */
    clearWaves();
    if (introAt === null) {
      for (var z = 0; z < rays.length; z++) rays[z].classList.remove('is-live');
      if (prev) prev.disabled = idx <= 0;
      if (next) next.disabled = idx >= pins.length - 1;
      return;
    }
    var base = Math.max(0, (introAt + T_RAYS * 1000) - now());
    var mine = [];
    for (var r = 0; r < rays.length; r++) {
      rays[r].classList.remove('is-live');
      if (rays[r].getAttribute('data-from') === slug) mine.push(rays[r]);
    }
    var lens = [], maxLen = 1;
    for (var m = 0; m < mine.length; m++) {
      var ln = mine[m].getTotalLength ? mine[m].getTotalLength() : 400;
      lens.push(ln);
      if (ln > maxLen) maxLen = ln;
      mine[m].style.setProperty('--len', ln.toFixed(0));
      mine[m].style.setProperty('--d', ((base + m * RAY_STEP * 1000) / 1000).toFixed(2) + 's');
      void mine[m].getBoundingClientRect();      /* перезапуск прочерчивания */
      mine[m].classList.add('is-live');
    }
    if (!reduceMo && mine.length) {
      /* порядок лучей по удалённости: order[i] — место i-го луча в этом ряду */
      var byLen = [];
      for (var o = 0; o < lens.length; o++) byLen.push(o);
      byLen.sort(function(a, b){ return lens[a] - lens[b]; });
      var order = [];
      for (var o2 = 0; o2 < byLen.length; o2++) order[byLen[o2]] = o2;

      /* залп начинается, когда последняя линия дошла до своего города */
      var t0 = now() + base + (mine.length - 1) * RAY_STEP * 1000 + RAY_DRAW * 1000;
      for (var w2 = 0; w2 < mine.length; w2++) {
        var s = stopEls(mine[w2].getAttribute('data-grad'));
        if (!s || !s.core) continue;
        /* Чистая пропорция длине сводила бы Мадрид, Малагу и Барселону в один
           момент — они почти равноудалены. Поэтому время полёта считается
           наполовину от длины, наполовину от места в порядке удалённости:
           физика сохраняется, но одинаковых прилётов не остаётся. */
        var rank = mine.length > 1 ? order[w2] / (mine.length - 1) : 0;
        var mix  = 0.55 * (lens[w2] / maxLen) + 0.45 * rank;
        var fly  = FLY_MIN + (FLY_MAX - FLY_MIN) * mix;
        waves.push({
          s: s,
          pin: pinBy(mine[w2].getAttribute('data-to')),
          dist: distBy(slug, mine[w2].getAttribute('data-to')),
          src: w2 === 0 ? pins[idx] : null,   /* вспышка источника — одна на залп */
          t0: t0,
          fly: fly,
          hit: fly * (1 + WAVE_W / 2) / (1 + WAVE_W),   /* центр волны дошёл до города */
          fired: -1,
          sent: -1
        });
      }
    }
    pump();

    /* на краях списка стрелка гаснет — как в ленте отзывов */
    if (prev) prev.disabled = idx <= 0;
    if (next) next.disabled = idx >= pins.length - 1;
  }

  for (var n = 0; n < pins.length; n++) {
    (function(pin, i){
      pin.addEventListener('click', function(){ show(i); });
      pin.addEventListener('mouseenter', function(){ show(i); });
      pin.addEventListener('focus', function(){ show(i); });
      pin.addEventListener('keydown', function(e){
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(i); }
      });
    })(pins[n], n);
  }
  /* свайп по ленте — пересчитываем город по ближайшей карточке, чтобы карта
     догоняла руку, а не оставалась на прежней точке */
  if (track) {
    var swipeT = null;
    track.addEventListener('scroll', function(){
      if (swipeT) clearTimeout(swipeT);
      swipeT = setTimeout(function(){
        var w = track.clientWidth;
        if (!w) return;
        var near = Math.round(track.scrollLeft / w);
        if (near !== idx) show(near);
      }, 110);
    }, {passive: true});
  }

  if (prev) prev.addEventListener('click', function(){ show(idx - 1); });
  if (next) next.addEventListener('click', function(){ show(idx + 1); });

  /* Партитура запускается ровно тогда, когда секция въехала в экран, — тем же
     сигналом, что запускает отрисовку контура. Раньше её таймеры считались от
     загрузки страницы: если пользователь скроллил вниз не сразу, вступление
     отыгрывало вхолостую, и к моменту показа обводка с лучами уже висели
     поверх недорисованного контура. */
  var section = document.querySelector('.home-coverage');
  var reduce = reduceMo;

  function startScore(){
    if (introAt !== null) return;
    introAt = now();
    setTimeout(function(){
      section.classList.remove('is-hold');
      show(idx);                 /* провинция прочерчивается, лучи встают в очередь */
    }, T_PINS * 1000);
    setTimeout(function(){
      section.classList.remove('is-sat-hold');
    }, T_SATS * 1000);
  }

  if (section && !reduce) {
    section.classList.add('is-hold');
    section.classList.add('is-sat-hold');
    if (section.classList.contains('is-visible')) startScore();
    else if (window.MutationObserver) {
      var mo = new MutationObserver(function(){
        if (!section.classList.contains('is-visible')) return;
        mo.disconnect();
        startScore();
      });
      mo.observe(section, {attributes: true, attributeFilter: ['class']});
    } else {
      section.classList.remove('is-hold');
      section.classList.remove('is-sat-hold');
      startScore();
    }
  } else if (section) {
    /* анимации отключены системно — показываем финальное состояние сразу */
    section.classList.remove('is-hold');
    section.classList.remove('is-sat-hold');
    introAt = now() - T_RAYS * 1000;
  }

  /* Карта ведёт за курсором. Значение не пишется в стиль напрямую из
     mousemove: события приходят чаще кадров, и вместе с CSS-transition это
     давало рывки. Здесь mousemove только задаёт цель, а собственный кадровый
     цикл подтягивает к ней текущее положение — ход получается непрерывным
     и гасится сам, когда курсор останавливается. */
  var mapEl  = document.querySelector('.map');
  var foreEl = document.querySelector('.map__fore');
  var canHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;
  if (mapEl && !reduce && canHover && window.requestAnimationFrame) {
    var stageBox = mapEl.parentNode;
    var AMP_X = 18, AMP_Y = 14, FORE = 0.55;   /* передний план идёт на 55% сильнее */
    var tx = 0, ty = 0, cx = 0, cy = 0, tilting = null;

    function tiltFrame(){
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      mapEl.style.setProperty('--mx', cx.toFixed(2) + 'px');
      mapEl.style.setProperty('--my', cy.toFixed(2) + 'px');
      if (foreEl) {
        foreEl.style.setProperty('--fx', (cx * FORE).toFixed(2) + 'px');
        foreEl.style.setProperty('--fy', (cy * FORE).toFixed(2) + 'px');
      }
      /* дошли до цели и стоим — цикл выключается до следующего движения */
      if (Math.abs(tx - cx) < 0.05 && Math.abs(ty - cy) < 0.05) {
        cx = tx; cy = ty;
        tilting = null;
        return;
      }
      tilting = requestAnimationFrame(tiltFrame);
    }
    function tiltPump(){ if (tilting === null) tilting = requestAnimationFrame(tiltFrame); }

    /* Прямоугольник SVG вдвое больше самой Испании: её силуэт оставляет
       пустыми целые углы. Реакция по контейнеру означала, что карта плывёт,
       когда курсор визуально далеко от неё. Поэтому проверяем попадание в
       заливку контура: реагируем, только когда курсор действительно над сушей. */
    var landEl = document.getElementById('es-land');
    var canHitTest = landEl && landEl.isPointInFill;
    function overLand(e, b){
      if (!canHitTest) return true;                 /* старый браузер — как раньше */
      var vx = (e.clientX - b.left) / b.width  * 1000;        /* viewBox 0 25 1000 775 */
      var vy = (e.clientY - b.top)  / b.height * 775 + 25;
      try { return landEl.isPointInFill({x: vx, y: vy}); }
      catch (err) { canHitTest = false; return true; }
    }

    stageBox.addEventListener('mousemove', function(e){
      var b = mapEl.getBoundingClientRect();        /* rect учитывает текущее смещение карты */
      if (!b.width || !b.height) return;
      if (!overLand(e, b)) { tx = 0; ty = 0; tiltPump(); return; }
      tx = ((e.clientX - b.left) / b.width  - 0.5) * 2 * AMP_X;
      ty = ((e.clientY - b.top)  / b.height - 0.5) * 2 * AMP_Y;
      tiltPump();
    }, {passive: true});
    stageBox.addEventListener('mouseleave', function(){ tx = 0; ty = 0; tiltPump(); });
  }

  /* лёгкий параллакс: карта смещается медленнее страницы */
  var stageEl = document.querySelector('.map-stage');
  if (stageEl && !reduce) {
    var queued = false;
    function par(){
      queued = false;
      var r = stageEl.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.bottom < 0 || r.top > vh) return;
      var progress = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
      stageEl.style.setProperty('--par', (progress * -26).toFixed(1) + 'px');
    }
    function parTick(){
      if (queued) return;
      queued = true;
      if (window.requestAnimationFrame) requestAnimationFrame(par); else setTimeout(par, 16);
    }
    window.addEventListener('scroll', parTick, {passive: true});
    window.addEventListener('resize', parTick, {passive: true});
    par();
  }

  show(0);
})();


/* Секция-группа: её содержимое проявляется одной волной.
   Раньше каждый .anim наблюдался сам за собой, и в высокой секции заголовок
   с подзаголовком успевали проявиться задолго до карточек — блок выглядел
   разрезанным надвое. Теперь наблюдаем контейнер, а каскад внутри задают
   собственные transition-delay элементов. */
(function(){
  var groups = document.querySelectorAll('[data-anim-group]');
  if (!groups.length) return;

  function reveal(g){
    var kids = g.querySelectorAll('.anim, .reveal, .timeline-item');
    for (var i = 0; i < kids.length; i++) kids[i].classList.add('is-visible');
    g.classList.add('is-visible');
  }
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (var r = 0; r < groups.length; r++) reveal(groups[r]);
    return;
  }
  if (!('IntersectionObserver' in window)) {
    for (var f = 0; f < groups.length; f++) reveal(groups[f]);
    return;
  }
  /* запуск, когда верх секции поднялся выше нижней пятой экрана */
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      reveal(e.target);
    });
  }, {threshold: 0, rootMargin: '0px 0px -18% 0px'});
  for (var k = 0; k < groups.length; k++) io.observe(groups[k]);

  /* подстраховка: IO молчит в фоновой вкладке */
  function check(){
    for (var i = groups.length - 1; i >= 0; i--) {
      var g = groups[i];
      if (g.classList.contains('is-visible')) continue;
      var b = g.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      if (b.top < vh * 0.82 && b.bottom > 0) reveal(g);
    }
  }
  window.addEventListener('scroll', check, {passive: true});
  window.addEventListener('resize', check, {passive: true});
  check();
})();

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

/* Round 35: снять каскадную задержку с hover.
   Карточкам проставлен inline transition-delay (0…350ms) для поочерёдного
   появления при скролле, но он же тормозил и наведение: последняя карточка
   начинала подниматься лишь через 0.35s. Гасим задержку в момент наведения —
   каскад появления при этом сохраняется полностью. */
(function(){
  var els = document.querySelectorAll('.gcard[style*="transition-delay"], .srow[style*="transition-delay"], .loc[style*="transition-delay"]');
  function drop(){ this.style.transitionDelay = '0s'; }
  for (var i = 0; i < els.length; i++) {
    els[i].addEventListener('mouseenter', drop);
    els[i].addEventListener('focusin', drop);
  }
})();

/* Round 33: FAQ — плавное раскрытие + одновременно открыт только один вопрос.
   <details> нативно переключается рывком, поэтому перехватываем клик по summary
   и анимируем высоту ответа вручную. Закрытие тоже проигрываем до конца, и лишь
   потом снимаем open — иначе браузер спрячет содержимое мгновенно.
   Клик по summary покрывает и клавиатуру: Enter/Space генерируют click. */
(function(){
  var items = document.querySelectorAll('.home-faq .faq__item');
  if (!items.length) return;

  var DUR  = 360;
  var EASE = 'cubic-bezier(.22, 1, .36, 1)';
  var PAD  = 30;                       // нижний отступ ответа, гасим вместе с высотой
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canAnimate = !reduce && typeof Element !== 'undefined' && Element.prototype.animate;

  function panel(d){ return d.querySelector('.faq__a'); }

  function expand(d){
    var p = panel(d);
    d.open = true;
    if (!canAnimate || !p) return;
    if (p._anim) p._anim.cancel();
    var h = p.scrollHeight;
    p._anim = p.animate(
      [{ height: '0px', paddingBottom: '0px', opacity: 0 },
       { height: h + 'px', paddingBottom: PAD + 'px', opacity: 1 }],
      { duration: DUR, easing: EASE }
    );
    p._anim.onfinish = function(){ p._anim = null; };
  }

  function collapse(d){
    var p = panel(d);
    if (!canAnimate || !p) { d.open = false; return; }
    if (p._anim) p._anim.cancel();
    var h = p.scrollHeight;
    p._anim = p.animate(
      [{ height: h + 'px', paddingBottom: PAD + 'px', opacity: 1 },
       { height: '0px', paddingBottom: '0px', opacity: 0 }],
      { duration: DUR, easing: EASE }
    );
    p._anim.onfinish = function(){ p._anim = null; d.open = false; };
  }

  for (var i = 0; i < items.length; i++) {
    (function(d){
      var s = d.querySelector('summary');
      if (!s) return;
      s.addEventListener('click', function(e){
        e.preventDefault();
        if (d.open) { collapse(d); return; }
        for (var j = 0; j < items.length; j++) {
          if (items[j] !== d && items[j].open) collapse(items[j]);
        }
        expand(d);
      });
    })(items[i]);
  }
})();


/* ═══ Мобильная «обложка» знакомства: текст выезжает из-под фото ═══
   Прогресс привязан к положению низа фото: пока фото в нижней трети
   экрана — текст спрятан под ним, к подъёму фото к 55% экрана текст
   полностью выезжает. Прямое связывание со скроллом, без transition. */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var mq = window.matchMedia('(max-width: 719px)');
  var fig = document.querySelector('#sec-intro .portrait__figure');
  var sec = document.getElementById('sec-intro');
  if (!fig || !sec) return;

  var queued = false;
  function tick() {
    queued = false;
    if (!mq.matches) { sec.style.removeProperty('--slide'); return; }
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var b = fig.getBoundingClientRect();
    if (b.bottom < -100 || b.top > vh + 100) return;   /* вне экрана — не считаем */
    var p = (vh * 0.92 - b.bottom) / (vh * 0.37);
    p = Math.max(0, Math.min(1, p));
    sec.style.setProperty('--slide', p.toFixed(3));
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(tick); } }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue, { passive: true });
  tick();
})();


/* ═══ Hero-ротатор услуг (референс rockfi.fr) ═══
   Единственный источник истины — JS: позиция ленты анимируется покадрово
   (rAF), подсветка назначается ТОЛЬКО когда лента фактически доехала.
   CSS-транзиция не используется — она на iOS иногда глоталась, и лента
   расходилась с подсветкой (активная «уползала вниз»). */
(function () {
  var box = document.getElementById('hero-roll');
  if (!box) return;
  var mq = window.matchMedia('(max-width: 719px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ul = box.querySelector('ul');
  var LINE = 32, PAUSE_MS = 1900, RIDE_MS = 520;
  var base = Array.prototype.slice.call(ul.children);
  var n = base.length;
  base.slice().reverse().forEach(function (li) { ul.insertBefore(li.cloneNode(true), ul.firstChild); });
  base.forEach(function (li) { ul.appendChild(li.cloneNode(true)); });
  var items = ul.children;

  var idx = n;                    /* строка в центре окна */
  var y = (idx - 2) * LINE;       /* фактическая позиция ленты (px) */

  function setY(v) { y = v; ul.style.transform = 'translateY(' + (-v) + 'px)'; }
  function paint(clearOnly) {
    for (var k2 = 0; k2 < items.length; k2++) {
      items[k2].classList.remove('is-c', 'is-n');
      if (clearOnly) continue;
      var d = k2 - idx;
      if (d === 0) items[k2].classList.add('is-c');
      else if (d === -1 || d === 1) items[k2].classList.add('is-n');
    }
  }
  function snap() {               /* мгновенно привести всё в согласованный кадр */
    while (idx >= 2 * n) idx -= n;
    setY((idx - 2) * LINE);
    paint(false);
  }

  if (reduce) { snap(); return; }

  var animating = false;
  function stepOnce() {
    if (!mq.matches || document.hidden || animating) return;
    animating = true;
    if (idx >= 2 * n) { idx -= n; setY((idx - 2) * LINE); }
    paint(true);                  /* точка и чернота гаснут — лента едет серой */
    idx++;
    var from = y, to = (idx - 2) * LINE, t0 = null, lit = false;
    function frame(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / RIDE_MS, 1);
      var e = 1 - Math.pow(1 - p, 3);           /* easeOutCubic */
      setY(from + (to - from) * e);
      /* подсветка стартует на 55% пути: выезд вправо идёт внахлёст
         с доездом ленты — одно слитное движение, а не два рывка */
      if (!lit && p >= 0.55) { lit = true; paint(false); }
      if (p < 1) { requestAnimationFrame(frame); }
      else { animating = false; }
    }
    requestAnimationFrame(frame);
  }
  setInterval(stepOnce, PAUSE_MS + RIDE_MS);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) { animating = false; snap(); }
  });
  snap();
})();

/* Метрика «промессы»: счёт при появлении (мобилка) */
(function () {
  var el = document.querySelector('.promise__metric b[data-count]');
  if (!el || !('IntersectionObserver' in window)) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.disconnect();
      var to = parseInt(el.getAttribute('data-count'), 10), t0 = null;
      function step(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min((ts - t0) / 1400, 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(step);
      }
      el.textContent = '0';
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });
  io.observe(el);
})();
