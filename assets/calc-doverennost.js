/**
 * KREPKO_АВАНС калькулятор v3 — услуга «Доверенность на родном языке».
 *
 * Формула — docs/services/acta-207.md §4 (v3).
 * Результат — ПРЕДВАРИТЕЛЬНАЯ ОЦЕНКА, не оферта. См. acta-207 §2.
 * Аванс берётся ПОСЛЕ ручного подтверждения Krepko, не на этапе калькулятора.
 *
 * Город — информационное поле для подбора переводчика и нотариуса, на цену не влияет.
 * Никаких зависимостей. Только vanilla. Идемпотентный init.
 */
(function () {
  'use strict';

  if (window.__krepkoCalcDoverennostInited) return;
  window.__krepkoCalcDoverennostInited = true;

  // --- Константы формулы (acta-207 §4 v3) ---
  var BASE_WITH_DRAFT = 50;
  var BASE_NO_DRAFT_FIX = 60;
  var BASE_NO_DRAFT_PER_PAGE = 25;
  var TRANSLATION_PER_PAGE = 22;
  var URGENCY_T_MULT = { standard: 1, rush_25: 1.25, rush_50: 1.5 };
  var URGENCY_S_ADD = { standard: 0, rush_30: 30 };
  var APOSTILLE_COORD = 8;
  var APOSTILLE_SELFCOST = { none: 0, normal: 22, urgent: 32, self: 0 };
  var NOTARY_FIRST_PAGE = 100;
  var NOTARY_NEXT_PAGE = 20;
  var TRANSLATOR_FLAT = 50;
  var WA_NUMBER = '34641048296';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function eur(n) { return '€' + Math.round(n); }

  function readState(form) {
    var fd = new FormData(form);
    return {
      hasDraft: fd.get('hasDraft') === 'yes',
      pages: fd.get('pages') || '1',
      city: fd.get('city') || '',
      urgencyT: fd.get('urgencyT') || 'standard',
      urgencyS: fd.get('urgencyS') || 'standard',
      apostille: fd.get('apostille') || 'none',
    };
  }

  function compute(state) {
    if (state.pages === 'more') return { oversize: true };
    var N = parseInt(state.pages, 10) || 1;
    var apostilleViaUs = (state.apostille === 'normal' || state.apostille === 'urgent');

    // KREPKO_АВАНС
    var base = state.hasDraft ? BASE_WITH_DRAFT : (BASE_NO_DRAFT_FIX + BASE_NO_DRAFT_PER_PAGE * N);
    var translation = TRANSLATION_PER_PAGE * N * (URGENCY_T_MULT[state.urgencyT] || 1);
    var urgencySigning = URGENCY_S_ADD[state.urgencyS] || 0;
    var apostilleCoord = apostilleViaUs ? APOSTILLE_COORD : 0;
    var krepkoAvans = base + translation + urgencySigning + apostilleCoord;

    // Платежи на месте
    var notary = NOTARY_FIRST_PAGE + NOTARY_NEXT_PAGE * (N - 1);
    var translatorOnsite = TRANSLATOR_FLAT;
    var apostilleSelfCost = APOSTILLE_SELFCOST[state.apostille] || 0;

    var underKey = krepkoAvans + notary + translatorOnsite + apostilleSelfCost;

    // Edge case: без черновика + <48ч → предупреждение
    var rushDraftWarning = (!state.hasDraft && state.urgencyT === 'rush_50');

    return {
      oversize: false,
      N: N,
      apostilleViaUs: apostilleViaUs,
      krepkoAvans: krepkoAvans,
      base: base,
      translation: translation,
      urgencySigning: urgencySigning,
      apostilleCoord: apostilleCoord,
      notary: notary,
      translatorOnsite: translatorOnsite,
      apostilleSelfCost: apostilleSelfCost,
      underKey: underKey,
      rushDraftWarning: rushDraftWarning,
    };
  }

  function buildWaText(state, calc, cityNamesBySlug, docMeta) {
    var lines = [];
    var docTitle = docMeta && docMeta.title ? docMeta.title.toLowerCase() : 'доверенность на родном языке';
    lines.push('Здравствуйте! Хочу оформить: ' + docTitle + '.');
    lines.push('');
    lines.push('Из калькулятора — предварительная оценка:');
    lines.push('• Черновик: ' + (state.hasDraft ? 'есть, готовый текст' : 'нет, нужно составить'));
    lines.push('• Страниц: ' + (calc.oversize ? 'больше 3 — нестандартный кейс' : calc.N));
    if (state.city) {
      lines.push('• Город: ' + (cityNamesBySlug[state.city] || state.city));
    }
    lines.push('• Срочность перевода: ' + urgencyTLabel(state.urgencyT));
    lines.push('• Срочность подписания: ' + urgencySLabel(state.urgencyS));
    lines.push('• Апостиль: ' + apostilleLabel(state.apostille));

    if (!calc.oversize) {
      lines.push('');
      lines.push('Аванс Krepko (наша работа): ' + eur(calc.krepkoAvans));
      lines.push('Под ключ (оценка): ~' + eur(calc.underKey));
      lines.push('');
      lines.push('Готов прислать документ или описание для точного расчёта.');
    }
    return lines.join('\n');
  }

  function urgencyTLabel(v) {
    return { standard: 'стандарт (>5 дней)', rush_25: '2–5 дней (+25%)', rush_50: 'менее 48 ч (+50%)' }[v] || v;
  }
  function urgencySLabel(v) {
    return { standard: '>5 рабочих дней', rush_30: '≤5 рабочих дней (+€30)' }[v] || v;
  }
  function apostilleLabel(v) {
    return {
      none: 'не нужен',
      normal: 'обычный через Krepko (€22)',
      urgent: 'срочный через Krepko (€32)',
      self: 'клиент оформляет сам',
    }[v] || v;
  }

  function loadCityNames() {
    // Reads <option> labels from the city <select> — single source of truth.
    var map = {};
    document.querySelectorAll('#krepko-calc-doverennost select[name="city"] option').forEach(function (opt) {
      if (opt.value) map[opt.value] = opt.textContent.trim();
    });
    return map;
  }

  function render(resultEl, state, calc, cityNamesBySlug, docMeta) {
    if (calc.oversize) {
      resultEl.innerHTML =
        '<div class="krepko-calc__oversize">' +
        '<p class="krepko-calc__oversize-title">Нестандартный объём</p>' +
        '<p>Больше трёх страниц — расчёт индивидуальный. Опишите кейс в WhatsApp, посчитаем за 10 минут.</p>' +
        ctaButton(state, calc, cityNamesBySlug, docMeta) +
        '</div>';
      return;
    }

    var warningHtml = calc.rushDraftWarning
      ? '<p class="krepko-calc__warning">⚠ Срочное составление с нуля — уточним выполнимость в WhatsApp.</p>'
      : '';

    var rows = [];
    rows.push(row('Наша работа (аванс):', eur(calc.krepkoAvans)));
    rows.push(row('Нотариус (оценка):', eur(calc.notary)));
    rows.push(row('Переводчик:', eur(calc.translatorOnsite)));
    if (calc.apostilleSelfCost > 0) {
      rows.push(row('Апостиль (передаётся переводчику):', eur(calc.apostilleSelfCost)));
    } else {
      rows.push(row('Апостиль:', '<em>не входит</em>'));
    }

    // Главный акцент — на «Наша работа», под ключ — second-tier.
    var headlineHtml =
      '<div class="krepko-calc__total">' +
        '<span class="krepko-calc__total-eyebrow">≈ Предварительная оценка · аванс за нашу работу</span>' +
        '<span class="krepko-calc__total-row">' +
          '<span class="krepko-calc__total-label">Наша работа:</span> ' +
          '<span class="krepko-calc__total-value">' + eur(calc.krepkoAvans) + '</span>' +
        '</span>' +
        '<span class="krepko-calc__total-sub">' +
          'Под ключ ~' + eur(calc.underKey) +
          ' (с нотариусом, переводчиком, апостилем — оценка на месте)' +
        '</span>' +
      '</div>';

    var paymentsHtml =
      '<div class="krepko-calc__payments">' +
        '<p class="krepko-calc__payments-title">Аванс при подтверждении: <strong>' + eur(calc.krepkoAvans) + '</strong></p>' +
        '<p class="krepko-calc__payments-note">После подтверждения заявки пришлём точную сумму и ссылку на оплату — это наша работа. Остальное оплачивается на месте напрямую:</p>' +
        '<ul class="krepko-calc__payments-list">' +
          '<li>Нотариусу: ~' + eur(calc.notary) + '</li>' +
          '<li>Переводчику: ' + eur(calc.translatorOnsite) + (calc.apostilleSelfCost > 0 ? ' + апостиль ' + eur(calc.apostilleSelfCost) + ' (передаёте переводчику)' : '') + '</li>' +
        '</ul>' +
      '</div>';

    var disclaimerHtml =
      '<p class="krepko-calc__disclaimer">' +
        'Это ориентировочный расчёт. Точную стоимость подтвердим после получения вашего документа — обычно в течение рабочего дня. ' +
        'После подтверждения цена нашей работы фиксируется. По нотариусу действует гарантия: расхождение до €30 от согласованной оценки покрываем мы.' +
      '</p>';

    resultEl.innerHTML =
      headlineHtml +
      warningHtml +
      '<hr class="krepko-calc__rule">' +
      '<ul class="krepko-calc__breakdown">' + rows.join('') + '</ul>' +
      paymentsHtml +
      disclaimerHtml +
      ctaButton(state, calc, cityNamesBySlug, docMeta);
  }

  function row(label, value) {
    return '<li><span class="krepko-calc__row-label">' + label + '</span> <span class="krepko-calc__row-value">' + value + '</span></li>';
  }

  function ctaButton(state, calc, cityNamesBySlug, docMeta) {
    return '<a class="krepko-calc__cta krepko-calc__cta--wa" href="' + waLink(buildWaText(state, calc, cityNamesBySlug, docMeta)) + '" rel="noopener noreferrer" target="_blank">Получить точный расчёт →</a>';
  }

  function waLink(text) {
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
  }

  function init() {
    var form = $('#krepko-calc-doverennost');
    var resultEl = $('#krepko-calc-result');
    if (!form || !resultEl) return;

    var cityNamesBySlug = loadCityNames();
    var docMeta = {
      slug: form.dataset.documentType || '',
      title: form.dataset.documentTitle || '',
    };

    // Preselect typical_pages если задан и валиден (1, 2, 3).
    var defaultPages = form.dataset.defaultPages;
    if (defaultPages && ['1', '2', '3'].indexOf(defaultPages) !== -1) {
      var pagesSelect = form.querySelector('select[name="pages"]');
      if (pagesSelect) pagesSelect.value = defaultPages;
    }

    function recalc() {
      var state = readState(form);
      var calc = compute(state);
      render(resultEl, state, calc, cityNamesBySlug, docMeta);
    }

    form.addEventListener('change', recalc);
    form.addEventListener('input', recalc);
    recalc();
  }

  // === Modal control (2026-05-29 redesign) ===
  // Триггеры открытия: любой [data-calc-open]. Закрытие: [data-calc-close],
  // бэкдроп, Esc. Расчёт/CTA уже рисует init() выше — здесь только show/hide.
  // Фон намеренно без inert/aria-hidden: лёгкий vanilla-сайт, ловушка фокуса
  // ловит только физический Tab (см. onKeydown) — для этого кейса достаточно.
  function initModal() {
    var modal = document.getElementById('krepko-calc-modal');
    if (!modal) return;
    var card = modal.querySelector('.calc-modal__card');
    var lastFocus = null;

    function focusables() {
      return card.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
    }
    function onKeydown(e) {
      if (e.key === 'Escape') { closeModal(); return; }
      if (e.key !== 'Tab') return;
      var f = focusables();
      if (!f.length) return;
      var first = f[0];
      var last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    function openModal() {
      if (!modal.hidden) return;
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.body.classList.add('calc-modal-open');
      var f = focusables();
      if (f.length) f[0].focus();
      document.addEventListener('keydown', onKeydown);
    }
    function closeModal() {
      modal.hidden = true;
      document.body.classList.remove('calc-modal-open');
      document.removeEventListener('keydown', onKeydown);
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }

    Array.prototype.forEach.call(document.querySelectorAll('[data-calc-open]'), function (btn) {
      btn.addEventListener('click', function (e) { e.preventDefault(); openModal(); });
    });
    Array.prototype.forEach.call(modal.querySelectorAll('[data-calc-close]'), function (btn) {
      btn.addEventListener('click', function (e) { e.preventDefault(); closeModal(); });
    });
  }

  function boot() { init(); initModal(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
