/* Krepko Blog — centralized articles registry */
var ARTICLES = [
  // ВНЖ / Статус
  { slug: 'vnzh-ispaniya',              title: 'Как получить ВНЖ в Испании: полный гид для украинцев',          tag: 'ВНЖ · Статус',            cat: 'vnzh',    time: 7 },
  { slug: 'arraigo-social-ispaniya',    title: 'Arraigo social — ВНЖ через 3 года жизни в Испании',             tag: 'ВНЖ',                     cat: 'vnzh',    time: 7 },
  { slug: 'temporalnaya-zashita',       title: 'Временная защита в Испании 2026: продление и права',             tag: 'Временная защита · 2026', cat: 'vnzh',    time: 7 },
  { slug: 'vossoedineniye-semi-ispaniya', title: 'Воссоединение семьи в Испании: кто может и как',              tag: 'ВНЖ · Семья',             cat: 'vnzh',    time: 7 },
  { slug: 'viza-tsifrovogo-nomada-ispaniya', title: 'Виза цифрового номада в Испании 2026',                     tag: 'Виза · Цифровой номад',   cat: 'vnzh',    time: 8 },
  // Документы
  { slug: 'nie-tie-ispaniya',           title: 'NIE и TIE в Испании: в чём разница и как получить',              tag: 'Документы · Статус',      cat: 'docs',    time: 7 },
  { slug: 'padron-municipal',           title: 'Прописка в Испании (padrón municipal): зачем нужна',             tag: 'Документы · Регистрация', cat: 'docs',    time: 7 },
  { slug: 'apostil-perevod',            title: 'Апостиль и присяжный перевод в Испании',                         tag: 'Документы · Нотариус',    cat: 'docs',    time: 6 },
  { slug: 'zamena-pasporta-ukraina-ispaniya', title: 'Замена украинского паспорта в Испании 2026',                  tag: 'Документы',               cat: 'docs',    time: 5 },
  { slug: 'zamena-prav-ispaniya',       title: 'Замена украинских водительских прав на испанские 2026',          tag: 'Документы · Права',       cat: 'docs',    time: 7 },
  // Финансы / Банк
  { slug: 'bank-nerezident',            title: 'Как открыть счёт в испанском банке нерезиденту',                 tag: 'Банк · Финансы',          cat: 'finance', time: 6 },
  { slug: 'perevod-deneg-ispaniya',     title: 'Как перевести деньги в Испанию: Wise, SWIFT, наличные',          tag: 'Финансы · Переводы',      cat: 'finance', time: 8 },
  { slug: 'neobanki-ispaniya',          title: 'Необанки в Испании 2026: Wise, Revolut, N26',                    tag: 'Финансы · Необанки',      cat: 'finance', time: 7 },
  // Работа / Налоги
  { slug: 'autonomo-ispaniya',          title: 'Регистрация autónomo в Испании: налоги и взносы',                tag: 'Autónomo · Налоги',       cat: 'work',    time: 8 },
  { slug: 'irpf-nalogi-ispaniya',       title: 'IRPF и налоги в Испании 2026: кто платит, сколько и когда',     tag: 'Налоги · IRPF',           cat: 'work',    time: 9 },
  { slug: 'otkryt-sl-biznes-ispaniya',  title: 'Как открыть SL (ООО) в Испании: пошаговый гайд 2026',          tag: 'Бизнес · SL',             cat: 'work',    time: 9 },
  // Жизнь / Жильё / Медицина
  { slug: 'meditsinskaya-strahovka-ispaniya', title: 'Медицинская страховка в Испании: государственная и частная', tag: 'Страховка · Медицина', cat: 'life',    time: 8 },
  { slug: 'tarjeta-sanitaria-ispaniya', title: 'Tarjeta Sanitaria в Испании: как получить медицинскую карту',   tag: 'Медицина · Карта здоровья', cat: 'life',  time: 6 },
  { slug: 'arenda-zhilya-ispaniya',     title: 'Как снять квартиру в Испании: полный гайд',                     tag: 'Жильё · Аренда',          cat: 'life',    time: 8 },
  { slug: 'pokupka-nedvizhimosti-ispaniya', title: 'Покупка недвижимости в Испании: пошаговый гид',             tag: 'Недвижимость · Инвестиции', cat: 'life',  time: 9 },
  // Семья / Социальное
  { slug: 'shkola-deti-ispaniya',       title: 'Как записать ребёнка в школу в Испании',                        tag: 'Дети · Образование',      cat: 'social',  time: 7 },
  { slug: 'socialnye-posobiya-ispaniya', title: 'Социальные пособия в Испании для украинцев 2026',              tag: 'Пособия · Социалка',      cat: 'social',  time: 8 },
  // Новые — апрель 2026
  { slug: 'certificado-empadronamiento', title: 'Certificado de empadronamiento: как получить выписку из падрона', tag: 'Документы',              cat: 'docs',    time: 6 },
  { slug: 'arraigo-laboral-ispaniya',   title: 'Arraigo laboral — ВНЖ через 2 года работы в Испании',           tag: 'ВНЖ',                     cat: 'vnzh',    time: 7 },
  { slug: 'seguro-hogar-ispaniya',      title: 'Страховка жилья в Испании: как выбрать seguro de hogar',        tag: 'Жильё · Страховка',       cat: 'life',    time: 6 },
  { slug: 'modelo-030',                 title: 'Modelo 030: регистрация и изменение данных в налоговой Испании', tag: 'Документы · Налоговая',  cat: 'docs',    time: 6 },
  { slug: 'certificado-digital',        title: 'Certificado digital: электронная подпись в Испании 2026',        tag: 'Документы · Электронная подпись', cat: 'docs', time: 7 },
  // Нотариальные услуги — апрель 2026
  { slug: 'doverennost-na-russkom',     title: 'Доверенность в Испании на русском за 30 минут',                  tag: 'Документы · Нотариус',    cat: 'docs',    time: 6 },
  { slug: 'carta-de-invitacion-ispaniya', title: 'Carta de invitación через нотариуса — день в день',             tag: 'Документы · Нотариус',    cat: 'docs',    time: 6 },
  { slug: 'matrimonio-ispaniya-inostrancev', title: 'Свадьба в Испании для иностранцев: брак в нотариусе или ЗАГСе', tag: 'Документы · Нотариус · Семья', cat: 'docs', time: 6 },
  { slug: 'separacion-de-bienes-ispaniya', title: 'Брачный контракт (separación de bienes) в Испании: как защитить активы', tag: 'Документы · Нотариус · Семья', cat: 'docs', time: 5 },
  { slug: 'razvod-ispaniya-notarius', title: 'Развод в Испании через нотариуса: быстрее и дешевле, чем суд', tag: 'Документы · Нотариус · Семья', cat: 'docs', time: 5 }
];
