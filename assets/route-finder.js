/* Подборщик маршрута выхода из временной защиты + счётчик дней до дедлайна.
   Страницы: /migracion/vyhod-iz-tps/ и любая другая с deadline/route_finder
   в frontmatter.

   Маршруты — по RD 1155/2024 (пять модальностей arraigo) и Instrucción
   SEM 2/2026 (переход с временной защиты). Подбор намеренно грубый: он
   отвечает «какие двери открыты», а не «вам одобрят». Тонкие случаи —
   перерывы в прописке, отказы в прошлом, смешанные основания — видит только
   человек, и текст результата об этом честно говорит. */
(function () {
  /* ── счётчик дней до даты из BOE ──
     Считаем в браузере: в статическом HTML число протухло бы назавтра. */
  (function () {
    var box = document.querySelector('[data-deadline]');
    if (!box) return;
    var iso = box.getAttribute('data-deadline');
    var target = new Date(iso + 'T00:00:00');
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
  var form = document.getElementById('rfinder-form');
  if (!form) return;
  var section = document.getElementById('route-finder');
  var result = document.getElementById('rfinder-result');
  var routeEl = document.getElementById('rfinder-route');
  var whyEl = document.getElementById('rfinder-why');
  var altEl = document.getElementById('rfinder-alt');
  var ctaEl = document.getElementById('rfinder-cta');
  if (section) section.hidden = false;        /* блок живёт только со скриптом */

  var LABELS = {
    years: { lt2: 'меньше 2 лет в Испании', '2to3': '2–3 года в Испании', '3to5': '3–5 лет в Испании', gt5: '5+ лет в Испании' },
    work: { gt1y: 'официальная работа больше года', lt1y: 'официальная работа меньше года', no: 'без официальной работы' },
    family: { eu: 'супруг(а) — гражданин Испании или ЕС', relatives: 'близкие родственники с ВНЖ', kids: 'дети живут со мной', no: 'без семьи в Испании' },
  };

  /* Маршруты. `alt` — что ещё стоит проверить: у большинства людей открыто
     несколько дверей, и показать это важнее, чем назвать одну. */
  var ROUTES = {
    eu: {
      name: 'Карта члена семьи гражданина ЕС',
      why: 'Супруг(а) с гражданством Испании или другой страны ЕС даёт право на отдельный режим: карта на пять лет, право работать сразу, требования мягче, чем у любого arraigo.',
      alt: ['Проверим, не выгоднее ли параллельно larga duración, если стаж уже большой'],
    },
    larga: {
      name: 'Larga duración — долгосрочная резиденция',
      why: 'Пять лет проживания в Испании открывают долгосрочный статус. Время на временной защите засчитывается полностью — а это самый устойчивый статус из доступных: пять лет карты и почти те же права, что у резидента с постоянным ВНЖ.',
      alt: ['Если по стажу что-то не сойдётся — запасной маршрут arraigo', 'После larga duración считается срок до гражданства'],
    },
    mod191: {
      name: 'Модификация статуса (ст. 191)',
      why: 'При официальной работе больше года это самый выгодный переход: разрешение выдаётся сразу на четыре года — дольше, чем по любому arraigo. Ждать окончания временной защиты не нужно.',
      alt: ['Arraigo sociolaboral — если по модификации чего-то не хватит', 'При 5 годах стажа стоит сравнить с larga duración'],
    },
    sociolaboral: {
      name: 'Arraigo sociolaboral',
      why: 'Два года в Испании и действующая работа складываются в маршрут через трудовые отношения. Контракт нужен на 20 часов в неделю и больше — это ключевое требование нового регламента.',
      alt: ['Через год работы откроется модификация статуса на 4 года', 'Arraigo social — если с контрактом возникнут сложности'],
    },
    social: {
      name: 'Arraigo social',
      why: 'Два года в Испании плюс родственные связи с резидентами дают маршрут без требования действующего контракта. Второй путь внутри него — отчёт об интеграции от автономного сообщества.',
      alt: ['Arraigo socioformativo — через зачисление на обучение, работать можно с начала процесса', 'Появится официальная работа — откроется sociolaboral'],
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
      name: 'Подготовка к arraigo + продление защиты',
      why: 'Основные маршруты открываются от двух лет проживания. Пока стаж набирается, задача другая: держать прописку непрерывной и заранее получить украинские справки — именно они идут дольше всего и чаще всего срывают сроки.',
      alt: ['Работа больше года откроет модификацию статуса раньше двух лет', 'Проверим семейные основания — они не зависят от стажа'],
    },
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
    /* меньше двух лет: работы больше года нет — значит копим стаж */
    if (v.family === 'kids') return 'kids';
    return 'wait';
  }

  function values() {
    var out = {};
    ['years', 'work', 'family'].forEach(function (n) {
      var el = form.querySelector('input[name="' + n + '"]:checked');
      if (el) out[n] = el.value;
    });
    return out;
  }

  function render() {
    var v = values();
    if (!v.years || !v.work || !v.family) return;   /* ждём все три ответа */

    var key = pick(v);
    var r = ROUTES[key];
    routeEl.textContent = r.name;
    whyEl.textContent = r.why;

    altEl.innerHTML = '';
    r.alt.forEach(function (a) {
      var li = document.createElement('li');
      li.textContent = a;
      altEl.appendChild(li);
    });

    /* Сообщение в WhatsApp собирается из ответов: человек отправляет не
       «здравствуйте», а вводную — и первый ответ уже по делу. */
    var msg = 'Здравствуйте! Хочу выйти с временной защиты на ВНЖ.\n'
      + 'Моя ситуация: ' + LABELS.years[v.years] + ', ' + LABELS.work[v.work] + ', ' + LABELS.family[v.family] + '.\n'
      + 'На сайте подобрался маршрут: ' + r.name + '. Подскажите, подходит ли он мне?';
    ctaEl.href = 'https://wa.me/34641048296?text=' + encodeURIComponent(msg);

    if (result.hidden) {
      result.hidden = false;
      var noAnim = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      result.scrollIntoView({ block: 'nearest', behavior: noAnim ? 'auto' : 'smooth' });
    }
  }

  form.addEventListener('change', render);
})();
