/* Подборщик маршрута выхода из временной защиты + счётчик дней до дедлайна.
   Страницы: /migracion/vyhod-iz-tps/ и любая другая, где во frontmatter есть
   deadline или route_finder.

   Подборщик работает как переписка: один вопрос за раз, варианты вертикальным
   списком, ответ уходит в историю пузырём. Первая версия показывала все
   одиннадцать вариантов сразу — человек упирался в поле таблеток и не знал,
   с чего начать.

   Маршруты — по RD 1155/2024 (пять модальностей arraigo) и Instrucción
   SEM 2/2026 (переход с временной защиты). Подбор намеренно грубый: он
   отвечает «какие двери открыты», а не «вам одобрят». Тонкие случаи —
   перерывы в прописке, отказы в прошлом, смешанные основания — видит только
   человек, и текст результата об этом честно говорит. */
(function () {
  var WA = 'https://wa.me/34641048296';

  /* ── счётчик дней до даты из BOE ──
     Считаем в браузере: в статическом HTML число протухло бы назавтра. */
  (function () {
    var box = document.querySelector('[data-deadline]');
    if (!box) return;
    var target = new Date(box.getAttribute('data-deadline') + 'T00:00:00');
    if (isNaN(target)) return;

    var out = box.querySelector('[data-deadline-count]');
    if (!out) return;

    var days = Math.ceil((target - new Date()) / 86400000);
    if (days <= 0) return;                    /* дата прошла — молчим, а не пугаем */

    /* «дня/дней» — иначе на 2–4 днях получается «2 дней» */
    var n = days % 100, n10 = days % 10, word = 'дней';
    if (n < 11 || n > 14) {
      if (n10 === 1) word = 'день';
      else if (n10 >= 2 && n10 <= 4) word = 'дня';
    }
    out.textContent = 'осталось ' + days + ' ' + word;
    out.hidden = false;
  })();

  /* ── подборщик ── */
  var thread = document.getElementById('rfinder-thread');
  if (!thread) return;
  var section = document.getElementById('route-finder');
  if (section) section.hidden = false;        /* блок живёт только со скриптом */

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var QUESTIONS = [
    {
      key: 'years',
      ask: 'Давайте разберёмся за три вопроса. Сколько вы живёте в Испании?',
      opts: [
        { v: 'lt2', t: 'Меньше 2 лет' },
        { v: '2to3', t: '2–3 года' },
        { v: '3to5', t: '3–5 лет' },
        { v: 'gt5', t: '5 лет и больше' },
      ],
    },
    {
      key: 'work',
      ask: 'Понял. Работаете официально — по контракту или как autónomo?',
      opts: [
        { v: 'gt1y', t: 'Да, больше года' },
        { v: 'lt1y', t: 'Да, меньше года' },
        { v: 'no', t: 'Нет' },
      ],
    },
    {
      key: 'family',
      ask: 'Последний вопрос: есть ли у вас семья в Испании?',
      opts: [
        { v: 'eu', t: 'Супруг(а) — гражданин Испании или ЕС' },
        { v: 'relatives', t: 'Близкие родственники с ВНЖ' },
        { v: 'kids', t: 'Дети живут со мной' },
        { v: 'no', t: 'Нет' },
      ],
    },
  ];

  /* `alt` — что ещё стоит проверить: у большинства открыто несколько дверей,
     и показать это важнее, чем назвать одну. */
  var ROUTES = {
    eu: {
      name: 'Карта члена семьи гражданина ЕС',
      why: 'Супруг(а) с гражданством Испании или другой страны ЕС даёт право на отдельный режим: карта на пять лет, право работать сразу, требования мягче, чем у любого arraigo.',
      alt: ['Проверим, не выгоднее ли параллельно larga duración, если стаж уже большой'],
    },
    larga: {
      name: 'Larga duración — долгосрочная резиденция',
      why: 'Пять лет проживания открывают долгосрочный статус, и время на временной защите засчитывается полностью. Это самый устойчивый статус из доступных: пять лет карты и почти те же права, что у постоянного резидента.',
      alt: ['Если по стажу что-то не сойдётся — запасной маршрут arraigo', 'После larga duración начинает считаться срок до гражданства'],
    },
    mod191: {
      name: 'Модификация статуса (ст. 191)',
      why: 'При официальной работе больше года это самый выгодный переход: разрешение выдаётся сразу на четыре года — дольше, чем по любому arraigo. Ждать окончания временной защиты не нужно.',
      alt: ['Arraigo sociolaboral — если по модификации чего-то не хватит', 'При пяти годах стажа стоит сравнить с larga duración'],
    },
    sociolaboral: {
      name: 'Arraigo sociolaboral',
      why: 'Два года в Испании и действующая работа складываются в маршрут через трудовые отношения. Контракт нужен на 20 часов в неделю и больше — это ключевое требование нового регламента.',
      alt: ['Через год работы откроется модификация статуса на четыре года', 'Arraigo social — если с контрактом возникнут сложности'],
    },
    social: {
      name: 'Arraigo social',
      why: 'Два года в Испании плюс родственные связи с резидентами дают маршрут без требования действующего контракта. Второй путь внутри него — отчёт об интеграции от автономного сообщества.',
      alt: ['Arraigo socioformativo — через обучение, работать можно с начала процесса', 'Появится официальная работа — откроется sociolaboral'],
    },
    socioformativo: {
      name: 'Arraigo socioformativo',
      why: 'Маршрут для тех, у кого нет официальной работы: зачисление на профессиональное обучение даёт основание для ВНЖ, причём работать разрешено с начала процесса — это отличает его от старых правил.',
      alt: ['Arraigo social — если найдутся родственники с ВНЖ или будет отчёт об интеграции', 'Дети в Испании открывают отдельные семейные маршруты'],
    },
    kids: {
      name: 'Семейный маршрут через детей',
      why: 'Дети в Испании открывают собственные основания: у ребёнка свой путь к ВНЖ, а рождённый в Испании может получить разрешение сразу на пять лет. Часто это оказывается быстрее, чем маршрут родителя.',
      alt: ['Arraigo social или socioformativo — параллельно для взрослых'],
    },
    wait: {
      name: 'Подготовка к arraigo и продление защиты',
      why: 'Основные маршруты открываются от двух лет проживания. Пока стаж набирается, задача другая: держать прописку непрерывной и заранее получить украинские справки — именно они идут дольше всего и чаще всего срывают сроки.',
      alt: ['Работа больше года откроет модификацию статуса раньше двух лет', 'Проверим семейные основания — они от стажа не зависят'],
    },
  };

  var LABELS = {
    years: { lt2: 'меньше 2 лет в Испании', '2to3': '2–3 года в Испании', '3to5': '3–5 лет в Испании', gt5: '5 лет и больше в Испании' },
    work: { gt1y: 'официальная работа больше года', lt1y: 'официальная работа меньше года', no: 'без официальной работы' },
    family: { eu: 'супруг(а) — гражданин Испании или ЕС', relatives: 'близкие родственники с ВНЖ', kids: 'дети живут со мной', no: 'без семьи в Испании' },
  };

  function pick(v) {
    /* Семья с гражданством ЕС бьёт всё остальное — режим мягче любого arraigo */
    if (v.family === 'eu') return 'eu';
    if (v.years === 'gt5') return 'larga';
    if (v.work === 'gt1y') return 'mod191';

    var hasStaz = v.years === '2to3' || v.years === '3to5';
    if (hasStaz) {
      if (v.work === 'lt1y') return 'sociolaboral';
      if (v.family === 'relatives') return 'social';
      if (v.family === 'kids') return 'kids';
      return 'socioformativo';
    }
    /* меньше двух лет и работы больше года нет — значит копим стаж */
    if (v.family === 'kids') return 'kids';
    return 'wait';
  }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  var answers = {}, step = 0;

  /* Пауза перед репликой: без неё вопросы сыплются пачкой и ощущение
     разговора пропадает. При reduce-motion пауз нет — сразу текст. */
  function afterTyping(delay, done) {
    if (reduce) { done(); return; }
    var typing = el('div', 'rfinder__typing rfinder__in',
      '<span class="rfinder__ava" aria-hidden="true">K</span>' +
      '<span class="rfinder__dots"><i></i><i></i><i></i></span>');
    thread.appendChild(typing);
    setTimeout(function () { typing.remove(); done(); }, delay);
  }

  function ask(i) {
    var q = QUESTIONS[i];
    afterTyping(i === 0 ? 350 : 650, function () {
      var row = el('div', 'rfinder__ask rfinder__in',
        '<span class="rfinder__ava" aria-hidden="true">K</span>' +
        '<div class="rfinder__bubble">' + q.ask + '</div>');
      thread.appendChild(row);

      var opts = el('div', 'rfinder__opts rfinder__in');
      q.opts.forEach(function (o, idx) {
        var b = el('button', 'rfinder__opt', o.t);
        b.type = 'button';
        /* длинная формулировка в половине ряда рвётся на три строки, а
           одинокий последний вариант оставляет дыру — оба случая тянем
           на всю ширину */
        var lonely = idx === q.opts.length - 1 && q.opts.length % 2 === 1;
        if (o.t.length > 20 || lonely) b.classList.add('rfinder__opt--wide');
        b.addEventListener('click', function () {
          answers[q.key] = o.v;
          opts.remove();
          thread.appendChild(el('div', 'rfinder__said rfinder__in', '<span>' + o.t + '</span>'));
          step++;
          if (step < QUESTIONS.length) ask(step);
          else finish();
        });
        opts.appendChild(b);
      });
      thread.appendChild(opts);
    });
  }

  function finish() {
    afterTyping(850, function () {
      var r = ROUTES[pick(answers)];
      var alt = r.alt.map(function (a) { return '<li>' + a + '</li>'; }).join('');

      /* Сообщение собирается из ответов: человек отправляет не «здравствуйте»,
         а вводную — и первый ответ уже по делу. */
      var msg = 'Здравствуйте! Хочу выйти с временной защиты на ВНЖ.\n'
        + 'Моя ситуация: ' + LABELS.years[answers.years] + ', ' + LABELS.work[answers.work] + ', ' + LABELS.family[answers.family] + '.\n'
        + 'На сайте подобрался маршрут: ' + r.name + '. Подскажите, подходит ли он мне?';

      var box = el('div', 'rfinder__ask rfinder__ask--res rfinder__in',
        '<span class="rfinder__ava" aria-hidden="true">K</span>' +
        '<div class="rfinder__res">' +
          '<span class="rfinder__res-label">Скорее всего вам подойдёт</span>' +
          '<h3 class="rfinder__route">' + r.name + '</h3>' +
          '<p class="rfinder__why">' + r.why + '</p>' +
          '<ul class="rfinder__alt">' + alt + '</ul>' +
          '<div class="rfinder__foot">' +
            '<a class="rfinder__cta" href="' + WA + '?text=' + encodeURIComponent(msg) + '" target="_blank" rel="noopener">' +
              '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.7 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-2.9.8.8-2.8-.2-.3A8.2 8.2 0 1 1 12 20.2Z"/></svg>' +
              'Продолжить в WhatsApp</a>' +
            '<button type="button" class="rfinder__restart">Ответить заново</button>' +
          '</div>' +
        '</div>');
      thread.appendChild(box);

      thread.appendChild(el('p', 'rfinder__disclaimer',
        'Подбор ориентировочный: он не учитывает деталей вашей истории — прописки, перерывов в статусе, документов. Точный маршрут называем после разбора, он бесплатный.'));

      box.querySelector('.rfinder__restart').addEventListener('click', function () {
        thread.innerHTML = '';
        answers = {};
        step = 0;
        ask(0);
      });
    });
  }

  ask(0);
})();
